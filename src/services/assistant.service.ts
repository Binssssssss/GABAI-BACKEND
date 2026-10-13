import {
  AssistantChatRequest,
  AssistantChatResponse,
} from '../types/assistant.types';
import {
  assistantRepository,
  AssistantContext,
} from '../repositories/assistant.repository';
import { AppError } from '../utils/response';

/*
 * GabAi Assistant (offline)
 *
 * No outside AI is used. The assistant understands the user's
 * question through keywords (English, Cebuano and Tagalog) and
 * answers ONLY with the user's own data inside GabAi:
 * tasks, schedule, subjects, budget, notes and focus sessions.
 */

const MAX_MESSAGE_LENGTH = 500;
const MAX_LIST_ITEMS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

type PendingTask = AssistantContext['pendingTasks'][number];

// ======================================================
// KEYWORDS (what the user might type)
// ======================================================

const KEYWORDS = {
  help: ['help', 'tabang', 'tulong', 'what can you do', 'unsa imong mahimo', 'unsay imong mahimo', 'ano kaya mo', 'ano ang kaya mo', 'features'],
  expense: ['expense', 'spend', 'spent', 'spending', 'gasto', 'gastos', 'nagasto', 'ginastos'],
  income: ['income', 'allowance', 'kita', 'sweldo', 'salary', 'earned'],
  budget: ['budget', 'balance', 'wallet', 'money', 'kwarta', 'kuwarta', 'pera', 'savings', 'ipon'],
  focus: ['focus', 'pomodoro', 'study session', 'tuon', 'concentrate'],
  notes: ['note', 'nota'],
  subjects: ['subject', 'class', 'klase', 'asignatura'],
  overdue: ['overdue', 'late', 'lapas', 'lampas', 'missed', 'nalapsan', 'atrasado'],
  today: ['today', 'karon', 'karong adlawa', 'ngayon', 'ngayong araw', 'tonight', 'karong gabii'],
  tomorrow: ['tomorrow', 'ugma', 'bukas'],
  week: ['week', 'semana', 'linggo', 'schedule', 'calendar', 'event', 'iskedyul', 'upcoming'],
  next: ['what next', 'next task', 'unsay sunod', 'ano susunod', 'priority', 'prioritize', 'una', 'unahon', 'unahin', 'uunahin', 'what should', 'unsay buhaton', 'unsa akong buhaton', 'ano gagawin', 'anong gagawin', 'recommend', 'suggest'],
  completed: ['done', 'completed', 'finished', 'nahuman', 'tapos', 'natapos', 'progress', 'accomplished'],
  tasks: ['task', 'assignment', 'homework', 'buluhaton', 'gawain', 'todo', 'activity', 'activities', 'project', 'requirement', 'deadline'],
  greeting: ['hi', 'hello', 'hey', 'kumusta', 'kamusta', 'musta', 'maayong buntag', 'maayong hapon', 'maayong gabii', 'good morning', 'good afternoon', 'good evening'],
  thanks: ['thank', 'salamat', 'ty'],
};

// ======================================================
// TEXT HELPERS
// ======================================================

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * True when the message mentions any keyword.
 * - phrases ("what should") are matched anywhere
 * - short words ("hi", "ty", "una") must match a whole word
 * - longer words also match their plural/forms ("task" -> "tasks")
 */
function mentions(text: string, words: string[], keywords: string[]): boolean {
  return keywords.some((keyword) => {
    if (keyword.includes(' ')) return text.includes(keyword);
    if (keyword.length <= 3) return words.includes(keyword);
    return words.some((word) => word.startsWith(keyword));
  });
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function peso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function firstName(context: AssistantContext): string {
  return context.userName.split(' ')[0] || 'there';
}

// ======================================================
// DATE HELPERS (Philippine time, same format as Task.dueDate)
// ======================================================

function manilaDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(
    new Date(Date.now() + offsetDays * DAY_MS),
  );
}

function formatTime(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
  if (!match) return '';

  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;

  return `${hour12}:${match[2]} ${suffix}`;
}

function formatDue(task: PendingTask): string {
  const today = manilaDate(0);
  const tomorrow = manilaDate(1);
  const time = formatTime(task.dueTime);

  let day: string;

  if (task.dueDate === today) {
    day = 'today';
  } else if (task.dueDate === tomorrow) {
    day = 'tomorrow';
  } else {
    const parsed = new Date(`${task.dueDate}T12:00:00+08:00`);
    day = Number.isNaN(parsed.getTime())
      ? task.dueDate
      : new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(parsed);
  }

  return time ? `${day}, ${time}` : day;
}

// ======================================================
// TASK HELPERS
// ======================================================

const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

function sortByUrgency(tasks: PendingTask[]): PendingTask[] {
  return [...tasks].sort((a, b) => {
    const byDate = `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`);
    if (byDate !== 0) return byDate;
    return (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
  });
}

function taskList(tasks: PendingTask[]): string {
  const lines = tasks
    .slice(0, MAX_LIST_ITEMS)
    .map((task) => `- **${task.title}** (${task.subject}), due ${formatDue(task)}`);

  if (tasks.length > MAX_LIST_ITEMS) {
    lines.push(`- ...and ${tasks.length - MAX_LIST_ITEMS} more in your Tasks tab`);
  }

  return lines.join('\n');
}

function overdueTasks(context: AssistantContext) {
  const today = manilaDate(0);
  return context.pendingTasks.filter((task) => task.dueDate < today);
}

function tasksOn(context: AssistantContext, date: string) {
  return context.pendingTasks.filter((task) => task.dueDate === date);
}

// ======================================================
// ANSWERS
// ======================================================

function answerHelp(): string {
  return [
    'I can answer questions about your **GabAi data**. Try asking:',
    '- "What is due today?" / "Unsay deadline karon?"',
    '- "What should I do next?"',
    '- "Do I have overdue tasks?"',
    '- "What is my schedule this week?"',
    '- "How much did I spend this month?"',
    '- "What is my balance?"',
    '- "Show my subjects", "my notes", or "my focus sessions"',
  ].join('\n');
}

function answerOverdue(context: AssistantContext): string {
  const overdue = sortByUrgency(overdueTasks(context));

  if (overdue.length === 0) {
    return 'Good news: you have **no overdue tasks**. Keep it up!';
  }

  return `You have **${plural(overdue.length, 'overdue task')}**:\n${taskList(overdue)}\n\nTry finishing **${overdue[0].title}** first.`;
}

function answerDay(context: AssistantContext, offsetDays: 0 | 1): string {
  const label = offsetDays === 0 ? 'today' : 'tomorrow';
  const tasks = sortByUrgency(tasksOn(context, manilaDate(offsetDays)));

  if (tasks.length === 0) {
    const extra =
      offsetDays === 0 && tasksOn(context, manilaDate(1)).length > 0
        ? ` Tomorrow you have **${plural(tasksOn(context, manilaDate(1)).length, 'task')}**.`
        : '';

    return `You have **no tasks due ${label}**.${extra}`;
  }

  return `You have **${plural(tasks.length, 'task')}** due ${label}:\n${taskList(tasks)}`;
}

function answerWeek(context: AssistantContext): string {
  const today = manilaDate(0);
  const weekEnd = manilaDate(6);

  const tasks = sortByUrgency(
    context.pendingTasks.filter(
      (task) => task.dueDate >= today && task.dueDate <= weekEnd,
    ),
  );

  const overdueCount = overdueTasks(context).length;
  const overdueNote =
    overdueCount > 0 ? `\n\nYou also have **${plural(overdueCount, 'overdue task')}**.` : '';

  if (tasks.length === 0) {
    return `Nothing is due in the **next 7 days**.${overdueNote}`;
  }

  return `Here is your **next 7 days** (${plural(tasks.length, 'task')}):\n${taskList(tasks)}${overdueNote}`;
}

function answerNext(context: AssistantContext): string {
  const ordered = sortByUrgency(context.pendingTasks);

  if (ordered.length === 0) {
    return "You're **all caught up**! No pending tasks right now.";
  }

  const [first, ...rest] = ordered;
  const isOverdue = first.dueDate < manilaDate(0);

  let reply = `Start with **${first.title}** (${first.subject}). It's ${
    isOverdue ? '**overdue**' : `due ${formatDue(first)}`
  } and has **${first.priority}** priority.`;

  if (rest.length > 0) {
    reply += `\n\nAfter that: ${rest
      .slice(0, 2)
      .map((task) => `**${task.title}**`)
      .join(', ')}.`;
  }

  return reply;
}

function answerProgress(context: AssistantContext): string {
  const done = context.completedTaskCount;
  const total = done + context.pendingTasks.length;

  if (total === 0) {
    return "You don't have any tasks yet. Add one in the **Tasks** tab to start tracking your progress.";
  }

  const rate = Math.round((done / total) * 100);

  return `You've completed **${done} of ${total} tasks** (${rate}%). ${
    context.pendingTasks.length > 0
      ? `**${plural(context.pendingTasks.length, 'task')}** left to go.`
      : 'Everything is done. Great job!'
  }`;
}

function answerTasks(context: AssistantContext): string {
  const pending = sortByUrgency(context.pendingTasks);

  if (pending.length === 0) {
    return 'You have **no pending tasks**. Nice work!';
  }

  const overdueCount = overdueTasks(context).length;
  const todayCount = tasksOn(context, manilaDate(0)).length;

  const summary = [
    `You have **${plural(pending.length, 'pending task')}**`,
    overdueCount > 0 ? `${overdueCount} overdue` : null,
    todayCount > 0 ? `${todayCount} due today` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `${summary}.\n${taskList(pending)}`;
}

function answerExpenses(context: AssistantContext): string {
  const expenses = context.monthTransactions.filter((item) => item.type === 'expense');

  if (expenses.length === 0) {
    return 'You have **no expenses recorded this month** yet.';
  }

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const byCategory = new Map<string, number>();
  for (const item of expenses) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
  }

  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => `- ${category}: **${peso(amount)}**`)
    .join('\n');

  return `This month you've spent **${peso(total)}** (${plural(expenses.length, 'expense')}).\nTop categories:\n${topCategories}`;
}

function answerIncome(context: AssistantContext): string {
  const income = context.monthTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  return `This month you've received **${peso(income)}**. Your total income so far is **${peso(context.wallet.totalIncome)}**.`;
}

function answerBudget(context: AssistantContext): string {
  const { balance, totalIncome, totalExpenses } = context.wallet;

  if (totalIncome === 0 && totalExpenses === 0) {
    return 'You have no transactions yet. Add your allowance or expenses in the **Expenses** tab.';
  }

  const warning = balance < 0 ? '\n\nHeads up: you are spending **more than you earn**.' : '';

  return `Your balance is **${peso(balance)}**.\n- Total income: ${peso(totalIncome)}\n- Total expenses: ${peso(totalExpenses)}${warning}`;
}

function answerSubjects(context: AssistantContext): string {
  if (context.subjects.length === 0) {
    return "You don't have any subjects yet. You can add them from the **Tasks** tab.";
  }

  const lines = context.subjects.map((subject) => {
    const pending = context.pendingTasks.filter((task) => task.subject === subject.name).length;
    return `- **${subject.name}**${pending > 0 ? ` (${plural(pending, 'pending task')})` : ''}`;
  });

  return `Your subjects:\n${lines.join('\n')}`;
}

function answerFocus(context: AssistantContext): string {
  const weekAgo = Date.now() - 7 * DAY_MS;
  const thisWeek = context.focusSessions.filter(
    (session) => session.createdAt.getTime() >= weekAgo,
  );

  if (context.focusSessions.length === 0) {
    return 'You have no focus sessions yet. Start one in the **Focus** tab to study without distractions.';
  }

  const last = context.focusSessions[0];

  return `You had **${plural(thisWeek.length, 'focus session')}** in the last 7 days. Your latest was for **${last.subject ?? 'General'}**.`;
}

function answerNotes(context: AssistantContext): string {
  if (context.noteCount === 0) {
    return 'You have no notes yet. Create one in the **Notes** tab.';
  }

  const recent = context.recentNotes
    .slice(0, 3)
    .map((note) => `- **${note.title}** (${note.category})${note.isPinned ? ', pinned' : ''}`)
    .join('\n');

  return `You have **${plural(context.noteCount, 'note')}**. Most recent:\n${recent}`;
}

function answerGreeting(context: AssistantContext): string {
  const todayCount = tasksOn(context, manilaDate(0)).length;
  const overdueCount = overdueTasks(context).length;

  const status =
    todayCount === 0 && overdueCount === 0
      ? 'Nothing is due today.'
      : [
          todayCount > 0 ? `**${plural(todayCount, 'task')}** due today` : null,
          overdueCount > 0 ? `**${overdueCount} overdue**` : null,
        ]
          .filter(Boolean)
          .join(' and ')
          .replace(/^./, (c) => c.toUpperCase()) + '.';

  return `Hi ${firstName(context)}! ${status}\n\nAsk me about your tasks, schedule, budget, subjects, notes or focus sessions.`;
}

function answerFallback(): string {
  return [
    'Sorry, I can only answer questions about your **GabAi data**: tasks, schedule, subjects, budget, notes and focus sessions.',
    '',
    'Try asking:',
    '- "What is due today?"',
    '- "What should I do next?"',
    '- "How much did I spend this month?"',
  ].join('\n');
}

// ======================================================
// INTENT MATCHING (first match wins, so order matters)
// ======================================================

function answer(message: string, context: AssistantContext): string {
  const text = normalize(message);
  const words = text.split(' ');
  const has = (keywords: string[]) => mentions(text, words, keywords);

  if (has(KEYWORDS.help)) return answerHelp();

  // Money
  if (has(KEYWORDS.expense)) return answerExpenses(context);
  if (has(KEYWORDS.income)) return answerIncome(context);
  if (has(KEYWORDS.budget)) return answerBudget(context);

  // Other features
  if (has(KEYWORDS.focus)) return answerFocus(context);
  if (has(KEYWORDS.notes)) return answerNotes(context);
  if (has(KEYWORDS.subjects)) return answerSubjects(context);

  // Tasks and schedule
  if (has(KEYWORDS.overdue)) return answerOverdue(context);
  if (has(KEYWORDS.next)) return answerNext(context);
  if (has(KEYWORDS.tomorrow)) return answerDay(context, 1);
  if (has(KEYWORDS.today)) return answerDay(context, 0);
  if (has(KEYWORDS.week)) return answerWeek(context);
  if (has(KEYWORDS.completed)) return answerProgress(context);
  if (has(KEYWORDS.tasks)) return answerTasks(context);

  // Small talk
  if (has(KEYWORDS.greeting)) return answerGreeting(context);
  if (has(KEYWORDS.thanks)) {
    return `You're welcome, ${firstName(context)}! Good luck with your studies.`;
  }

  return answerFallback();
}

// ======================================================
// SERVICE
// ======================================================

export class AssistantService {
  async chat(
    userId: string,
    data: AssistantChatRequest,
  ): Promise<AssistantChatResponse> {
    const message =
      typeof data?.message === 'string'
        ? data.message.trim().slice(0, MAX_MESSAGE_LENGTH)
        : '';

    if (!message) {
      throw new AppError('Message is required', 400);
    }

    const context = await assistantRepository.getUserContext(userId);

    return { reply: answer(message, context) };
  }

  async reset(): Promise<{ message: string }> {
    // Conversations are not saved on the server; the app clears its own messages.
    return {
      message: 'Assistant conversation reset successfully.',
    };
  }
}

export const assistantService = new AssistantService();