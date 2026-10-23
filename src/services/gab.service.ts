import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import { env } from '../config/env';
import { AssistantContext } from '../repositories/assistant.repository';
import { AssistantMessage } from '../types/assistant.types';

/*
 * Gab — GabAi's AI study buddy, powered by Google Gemini.
 *
 * The Gemini key stays on the server (GEMINI_API_KEY in .env / Render).
 * Gab gets a short summary of the student's own GabAi data with every
 * message, so its answers are about THEIR tasks, schedule, wallet and focus.
 * If Gemini is not set up or fails, the caller falls back to the offline
 * assistant, so the chat never breaks.
 */

const MANILA = 'Asia/Manila';
const MAX_HISTORY = 10;
const MAX_HISTORY_CHARS = 1000;
const REQUEST_TIMEOUT_MS = 20000;

/** Calendar events are tasks whose subject is one of these. */
const CALENDAR_CATEGORIES = new Set([
  'assignment',
  'exam',
  'class',
  'meeting',
  'personal',
  'focus session',
]);

const HOTLINES = [
  'NCMH Crisis Hotline (24/7): 1553, 0917-899-8727 (Globe/TM), 0908-639-2672 (Smart/TNT)',
  'Tawag Paglaum – Centro Bisaya: 0939-937-5433 (Smart/TNT), 0927-654-1629 (Globe/TM)',
  'Emergency: 911',
];

const SYSTEM_PROMPT = `You are Gab, the friendly AI study buddy inside GabAi, a productivity app for Filipino college students (tasks, calendar, wallet, focus timer, notes).

PERSONALITY
- Warm, upbeat and supportive, like a caring ate/kuya or classmate. Never preachy, never judgmental.
- Celebrate small wins. When the student is tired or stressed, acknowledge the feeling first, then offer one small, doable next step.
- Use a few emojis naturally (0-3 per reply). Use the student's first name sometimes, not in every reply.

LANGUAGE
- Reply in the same language the student uses: English, Cebuano/Bisaya, Tagalog/Filipino, or a mix (Taglish/Bislish). Keep it natural and casual.

WHAT YOU HELP WITH
1. Productivity: plan the day, decide what to do first (overdue first, then nearest deadline and High priority), break big tasks into steps, suggest a Focus Session (Pomodoro 25 min + 5 min break) in the app.
2. Mood and motivation: listen, encourage, give practical study-stress tips (rest, water, short walk, sleep, talk to a friend). Keep it light and kind.
3. Study help: explain topics simply, give examples, quiz the student, share study techniques (active recall, spaced repetition, Pomodoro).
4. Money: simple student budgeting tips based on their wallet.
5. App help: point to the right GabAi screen (Tasks, Calendar, Wallet, Focus Session, Notes, Settings).

USING THE STUDENT'S DATA
- A summary of the student's GabAi data is given below. Use it to make answers specific (name the actual tasks, times, amounts).
- Never invent tasks, events, amounts or numbers that are not in the data. If something is not in the data, say so simply.
- You cannot create, edit, complete or delete anything. If asked, tell them how to do it in the app (e.g. "Tap + on the Tasks screen").
- Amounts are in Philippine pesos (₱). Dates and times are Philippine time.

STYLE
- Short and easy to read on a phone: usually 2-6 short lines. Use "1." or "•" for lists and **bold** for the key items only. No headings, no tables, no code blocks.
- End with a gentle next step or question when it helps.

SAFETY
- If the student talks about self-harm, suicide, abuse or being in danger: respond with care, encourage them to reach out to someone they trust, and share these free hotlines:
${HOTLINES.map((line) => `  • ${line}`).join('\n')}
- You are not a doctor, therapist, lawyer or financial advisor. For serious health, mental health or money problems, gently suggest talking to a professional, guidance counselor or trusted adult.
- Keep everything school-appropriate. Politely decline harmful or inappropriate requests and steer back to studying.
- Do not help with cheating on exams; you may help them understand and practice instead.`;

let client: GoogleGenAI | null = null;

/** True when a Gemini key is set on the server. */
export const isGabAiEnabled = (): boolean => Boolean(env.GEMINI_API_KEY);

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

/* ---------- the student's data, as short text ---------- */

const manilaDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: MANILA }).format(date); // 2026-10-24

const manilaNow = () =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date());

/** "18:00" -> "6:00 PM" */
function time12(value: string): string {
  const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value ?? '');
  const h = Number(match[1]);
  return `${h % 12 || 12}:${match[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

const peso = (amount: number) =>
  `₱${Number(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Short, factual summary of the student's GabAi data for the prompt. */
export function buildContextText(context: AssistantContext): string {
  const today = manilaDate(new Date());
  const tomorrow = manilaDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const lines: string[] = [];

  lines.push(`Now (Philippine time): ${manilaNow()}`);
  lines.push(`Student's name: ${context.userName}`);

  // Tasks and calendar events (open ones only)
  const items = context.pendingTasks.map((task) => {
    const isEvent = CALENDAR_CATEGORIES.has(String(task.subject).trim().toLowerCase());
    const when =
      task.dueDate === today
        ? 'today'
        : task.dueDate === tomorrow
          ? 'tomorrow'
          : task.dueDate;
    const status = task.dueDate < today ? 'OVERDUE' : '';
    return {
      isEvent,
      overdue: task.dueDate < today,
      text: `- ${task.title} | ${isEvent ? `${task.subject} event` : task.subject} | ${
        isEvent ? '' : `${task.priority} priority | `
      }${isEvent ? 'on' : 'due'} ${when} ${time12(task.dueTime)}${status ? ` | ${status}` : ''}`,
    };
  });

  const tasks = items.filter((item) => !item.isEvent);
  const events = items.filter((item) => item.isEvent && !item.overdue);

  lines.push('');
  lines.push(
    `OPEN TASKS (${tasks.length}, ${tasks.filter((t) => t.overdue).length} overdue; ${context.completedTaskCount} completed so far):`,
  );
  lines.push(tasks.length ? tasks.slice(0, 25).map((t) => t.text).join('\n') : '- none');

  lines.push('');
  lines.push(`UPCOMING CALENDAR EVENTS (${events.length}):`);
  lines.push(events.length ? events.slice(0, 15).map((e) => e.text).join('\n') : '- none');

  // Subjects
  if (context.subjects.length) {
    lines.push('');
    lines.push(`SUBJECTS: ${context.subjects.map((s) => s.name).join(', ')}`);
  }

  // Wallet
  const week = context.periodStarts.week.getTime();
  const month = context.periodStarts.month.getTime();
  const spent = (from: number) =>
    context.recentTransactions
      .filter((t) => t.type === 'expense' && new Date(t.date).getTime() >= from)
      .reduce((sum, t) => sum + Number(t.amount), 0);

  const byCategory = new Map<string, number>();
  for (const t of context.recentTransactions) {
    if (t.type !== 'expense' || new Date(t.date).getTime() < month) continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + Number(t.amount));
  }

  lines.push('');
  lines.push('WALLET:');
  lines.push(`- Current balance: ${peso(context.wallet.balance)}`);
  lines.push(`- Spent this week: ${peso(spent(week))} · this month: ${peso(spent(month))}`);
  if (byCategory.size) {
    lines.push(
      `- This month by category: ${[...byCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `${category} ${peso(amount)}`)
        .join(', ')}`,
    );
  }
  const recent = context.recentTransactions.slice(0, 5);
  if (recent.length) {
    lines.push(
      `- Latest: ${recent
        .map((t) => `${t.title} (${t.type === 'income' ? '+' : '-'}${peso(Number(t.amount))}, ${t.category}, ${manilaDate(new Date(t.date))})`)
        .join('; ')}`,
    );
  }

  // Focus sessions
  const completed = context.focusSessions.filter((s) => s.status === 'COMPLETED');
  const todayFocus = completed.filter((s) => manilaDate(new Date(s.createdAt)) === today);
  const todayMinutes = Math.round(
    todayFocus.reduce((sum, s) => sum + (Number(s.duration) || 0), 0) / 60,
  );
  const days = new Set(completed.map((s) => manilaDate(new Date(s.createdAt))));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(manilaDate(cursor))) cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000);
  while (days.has(manilaDate(cursor))) {
    streak += 1;
    cursor.setTime(cursor.getTime() - 24 * 60 * 60 * 1000);
  }

  lines.push('');
  lines.push('FOCUS SESSIONS:');
  lines.push(`- Today: ${todayFocus.length} session(s), about ${todayMinutes} min`);
  lines.push(`- Focus streak: ${streak} day(s)`);
  const lastSubjects = [...new Set(completed.slice(0, 5).map((s) => s.subject).filter(Boolean))];
  if (lastSubjects.length) lines.push(`- Recently focused on: ${lastSubjects.join(', ')}`);

  // Notes
  lines.push('');
  lines.push(`NOTES: ${context.noteCount} note(s)`);
  if (context.recentNotes.length) {
    lines.push(
      `- Recent: ${context.recentNotes
        .map((n) => `${n.title || 'Untitled'}${n.isPinned ? ' (pinned)' : ''}`)
        .join(', ')}`,
    );
  }

  return lines.join('\n');
}

/* ---------- chat ---------- */

/** Keeps only valid, recent turns from the app. */
export function cleanHistory(history: unknown): AssistantMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item): item is AssistantMessage =>
        !!item &&
        typeof item === 'object' &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY)
    .map((item) => ({
      role: item.role,
      content: item.content.trim().slice(0, MAX_HISTORY_CHARS),
    }));
}

async function generate(
  contents: { role: 'user' | 'model'; parts: { text: string }[] }[],
  systemInstruction: string,
  withThinkingConfig: boolean,
): Promise<string> {
  const response = await getClient().models.generateContent({
    model: env.GEMINI_MODEL,
    contents,
    config: {
      systemInstruction,
      temperature: 0.8,
      maxOutputTokens: 1024,
      httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      // Fast, chatty replies: keep the model's "thinking" low.
      ...(withThinkingConfig ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
    },
  });

  return (response.text ?? '').trim();
}

/**
 * Ask Gab. Returns the reply text, or throws when Gemini is not set up
 * or does not answer (the caller then uses the offline assistant).
 */
export async function askGab(
  message: string,
  history: AssistantMessage[],
  context: AssistantContext,
): Promise<string> {
  if (!isGabAiEnabled()) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  const systemInstruction = `${SYSTEM_PROMPT}\n\nSTUDENT'S GABAI DATA (private, up to date):\n${buildContextText(context)}`;

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: turn.content }],
    })),
    { role: 'user' as const, parts: [{ text: message }] },
  ];

  // A conversation sent to Gemini must start with the student's turn.
  while (contents.length > 1 && contents[0].role === 'model') contents.shift();

  let reply = '';
  try {
    reply = await generate(contents, systemInstruction, true);
  } catch (error) {
    // Some models don't accept the thinking setting; try once without it.
    console.warn('[Gab] Retrying without thinking config:', (error as Error)?.message);
    reply = await generate(contents, systemInstruction, false);
  }

  if (!reply) {
    throw new Error('Gemini returned an empty reply.');
  }

  return reply;
}
