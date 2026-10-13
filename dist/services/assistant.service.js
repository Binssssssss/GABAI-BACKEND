import { assistantRepository, } from '../repositories/assistant.repository.js';
import { AppError } from '../utils/response.js';
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
const BULLET = '•';
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
    stats: ['productivity', 'statistic', 'stats', 'analytics', 'summary', 'overview', 'report', 'performance'],
    periodToday: ['today', 'karon', 'ngayon', 'tonight'],
    periodWeek: ['week', 'semana', 'linggo', 'last 7 days'],
    periodMonth: ['month', 'bulan', 'buwan'],
};
// ======================================================
// TEXT HELPERS
// ======================================================
function normalize(text) {
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
function mentions(text, words, keywords) {
    return keywords.some((keyword) => {
        if (keyword.includes(' '))
            return text.includes(keyword);
        if (keyword.length <= 3)
            return words.includes(keyword);
        return words.some((word) => word.startsWith(keyword));
    });
}
function plural(count, word) {
    return `${count} ${word}${count === 1 ? '' : 's'}`;
}
function peso(amount) {
    return `₱${amount.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
function firstName(context) {
    return context.userName.split(' ')[0] || 'there';
}
// ======================================================
// DATE HELPERS (Philippine time, same format as Task.dueDate)
// ======================================================
function manilaDate(offsetDays = 0) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(Date.now() + offsetDays * DAY_MS));
}
function formatTime(time) {
    const match = /^(\d{1,2}):(\d{2})/.exec(time ?? '');
    if (!match)
        return '';
    const hours = Number(match[1]);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${match[2]} ${suffix}`;
}
function formatDue(task) {
    const today = manilaDate(0);
    const tomorrow = manilaDate(1);
    const time = formatTime(task.dueTime);
    let day;
    if (task.dueDate === today) {
        day = 'today';
    }
    else if (task.dueDate === tomorrow) {
        day = 'tomorrow';
    }
    else {
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
const PRIORITY_WEIGHT = { High: 3, Medium: 2, Low: 1 };
function sortByUrgency(tasks) {
    return [...tasks].sort((a, b) => {
        const byDate = `${a.dueDate} ${a.dueTime}`.localeCompare(`${b.dueDate} ${b.dueTime}`);
        if (byDate !== 0)
            return byDate;
        return (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0);
    });
}
function taskList(tasks) {
    const lines = tasks
        .slice(0, MAX_LIST_ITEMS)
        .map((task) => `${BULLET} ${task.title} (${task.subject}), due ${formatDue(task)}`);
    if (tasks.length > MAX_LIST_ITEMS) {
        lines.push(`${BULLET} and ${tasks.length - MAX_LIST_ITEMS} more in your Tasks tab`);
    }
    return lines.join('\n');
}
function overdueTasks(context) {
    const today = manilaDate(0);
    return context.pendingTasks.filter((task) => task.dueDate < today);
}
function tasksOn(context, date) {
    return context.pendingTasks.filter((task) => task.dueDate === date);
}
const PERIOD_LABEL = {
    today: 'today',
    week: 'this week',
    month: 'this month',
};
/** Which period the user is asking about. Defaults to this month. */
function detectPeriod(has) {
    if (has(KEYWORDS.periodMonth))
        return 'month';
    if (has(KEYWORDS.periodWeek))
        return 'week';
    if (has(KEYWORDS.periodToday))
        return 'today';
    return 'month';
}
function transactionsIn(context, period, type) {
    const from = context.periodStarts[period].getTime();
    return context.recentTransactions.filter((item) => item.type === type && new Date(item.date).getTime() >= from);
}
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
// ======================================================
// ANSWERS
// ======================================================
function answerHelp() {
    return [
        'Here is what I can help you with, using your GabAi data:',
        '',
        `${BULLET} "What is due today?" / "Unsay deadline karon?"`,
        `${BULLET} "What should I do next?"`,
        `${BULLET} "Do I have overdue tasks?"`,
        `${BULLET} "What is my schedule this week?"`,
        `${BULLET} "How much did I spend this week?"`,
        `${BULLET} "What is my balance?"`,
        `${BULLET} "Show my productivity summary"`,
        `${BULLET} "Show my subjects", "my notes" or "my focus sessions"`,
    ].join('\n');
}
function answerOverdue(context) {
    const overdue = sortByUrgency(overdueTasks(context));
    if (overdue.length === 0) {
        return 'You have no overdue tasks. Everything is on track.';
    }
    return `You have ${plural(overdue.length, 'overdue task')}:\n\n${taskList(overdue)}\n\nI recommend finishing "${overdue[0].title}" first.`;
}
function answerDay(context, offsetDays) {
    const label = offsetDays === 0 ? 'today' : 'tomorrow';
    const tasks = sortByUrgency(tasksOn(context, manilaDate(offsetDays)));
    if (tasks.length === 0) {
        const tomorrowCount = tasksOn(context, manilaDate(1)).length;
        const extra = offsetDays === 0 && tomorrowCount > 0
            ? ` You have ${plural(tomorrowCount, 'task')} due tomorrow.`
            : '';
        return `You have no tasks due ${label}.${extra}`;
    }
    return `You have ${plural(tasks.length, 'task')} due ${label}:\n\n${taskList(tasks)}`;
}
function answerWeek(context) {
    const today = manilaDate(0);
    const weekEnd = manilaDate(6);
    const tasks = sortByUrgency(context.pendingTasks.filter((task) => task.dueDate >= today && task.dueDate <= weekEnd));
    const overdueCount = overdueTasks(context).length;
    const overdueNote = overdueCount > 0 ? `\n\nYou also have ${plural(overdueCount, 'overdue task')}.` : '';
    if (tasks.length === 0) {
        return `Nothing is due in the next 7 days.${overdueNote}`;
    }
    return `Here is what's due in the next 7 days (${plural(tasks.length, 'task')}):\n\n${taskList(tasks)}${overdueNote}`;
}
function answerNext(context) {
    const ordered = sortByUrgency(context.pendingTasks);
    if (ordered.length === 0) {
        return "You're all caught up. There are no pending tasks right now.";
    }
    const [first, ...rest] = ordered;
    const isOverdue = first.dueDate < manilaDate(0);
    let reply = `I recommend starting with "${first.title}" (${first.subject}). It is ${isOverdue ? 'overdue' : `due ${formatDue(first)}`} and marked ${first.priority} priority.`;
    if (rest.length > 0) {
        reply += `\n\nUp next:\n${rest
            .slice(0, 2)
            .map((task) => `${BULLET} ${task.title} (${task.subject}), due ${formatDue(task)}`)
            .join('\n')}`;
    }
    return reply;
}
function answerProgress(context) {
    const done = context.completedTaskCount;
    const total = done + context.pendingTasks.length;
    if (total === 0) {
        return "You don't have any tasks yet. Add one in the Tasks tab to start tracking your progress.";
    }
    const rate = Math.round((done / total) * 100);
    return `You've completed ${done} of ${total} tasks (${rate}%). ${context.pendingTasks.length > 0
        ? `${capitalize(plural(context.pendingTasks.length, 'task'))} remaining.`
        : 'Everything is done. Great work!'}`;
}
function answerStats(context) {
    const done = context.completedTaskCount;
    const pending = context.pendingTasks.length;
    const total = done + pending;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    const weekStart = context.periodStarts.week.getTime();
    const focusThisWeek = context.focusSessions.filter((session) => session.createdAt.getTime() >= weekStart).length;
    const overdueCount = overdueTasks(context).length;
    const dueToday = tasksOn(context, manilaDate(0)).length;
    const lines = [
        'Here is your productivity summary:',
        '',
        `${BULLET} Task completion: ${done} of ${total} (${rate}%)`,
        `${BULLET} Pending tasks: ${pending}`,
        `${BULLET} Due today: ${dueToday}`,
        `${BULLET} Overdue: ${overdueCount}`,
        `${BULLET} Focus sessions this week: ${focusThisWeek}`,
    ];
    if (overdueCount > 0) {
        lines.push('', 'Clearing your overdue tasks first will raise your completion rate the fastest.');
    }
    else if (pending === 0 && total > 0) {
        lines.push('', 'You have no pending tasks. Excellent work!');
    }
    return lines.join('\n');
}
function answerTasks(context) {
    const pending = sortByUrgency(context.pendingTasks);
    if (pending.length === 0) {
        return 'You have no pending tasks. Nice work!';
    }
    const overdueCount = overdueTasks(context).length;
    const todayCount = tasksOn(context, manilaDate(0)).length;
    const summary = [
        `You have ${plural(pending.length, 'pending task')}`,
        overdueCount > 0 ? `${overdueCount} overdue` : null,
        todayCount > 0 ? `${todayCount} due today` : null,
    ]
        .filter(Boolean)
        .join(', ');
    return `${summary}:\n\n${taskList(pending)}`;
}
function answerExpenses(context, period) {
    const label = PERIOD_LABEL[period];
    const expenses = transactionsIn(context, period, 'expense');
    if (expenses.length === 0) {
        return `You have no expenses recorded ${label}.`;
    }
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const byCategory = new Map();
    for (const item of expenses) {
        byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
    }
    const topCategories = [...byCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, amount]) => `${BULLET} ${category}: ${peso(amount)}`)
        .join('\n');
    return `You've spent ${peso(total)} ${label} across ${plural(expenses.length, 'expense')}.\n\nTop categories:\n${topCategories}`;
}
function answerIncome(context, period) {
    const income = transactionsIn(context, period, 'income').reduce((sum, item) => sum + item.amount, 0);
    return `You've received ${peso(income)} ${PERIOD_LABEL[period]}. Your total income so far is ${peso(context.wallet.totalIncome)}.`;
}
function answerBudget(context) {
    const { balance, totalIncome, totalExpenses } = context.wallet;
    if (totalIncome === 0 && totalExpenses === 0) {
        return 'You have no transactions yet. Add your allowance or expenses in the Expenses tab.';
    }
    const warning = balance < 0 ? '\n\nNote: your expenses are higher than your income.' : '';
    return `Your current balance is ${peso(balance)}.\n\n${BULLET} Total income: ${peso(totalIncome)}\n${BULLET} Total expenses: ${peso(totalExpenses)}${warning}`;
}
function answerSubjects(context) {
    if (context.subjects.length === 0) {
        return "You don't have any subjects yet. You can add them from the Tasks tab.";
    }
    const lines = context.subjects.map((subject) => {
        const pending = context.pendingTasks.filter((task) => task.subject === subject.name).length;
        return `${BULLET} ${subject.name}${pending > 0 ? ` (${plural(pending, 'pending task')})` : ''}`;
    });
    return `Your subjects:\n\n${lines.join('\n')}`;
}
function answerFocus(context) {
    if (context.focusSessions.length === 0) {
        return 'You have no focus sessions yet. Start one in the Focus tab to study without distractions.';
    }
    const weekAgo = Date.now() - 7 * DAY_MS;
    const thisWeek = context.focusSessions.filter((session) => session.createdAt.getTime() >= weekAgo);
    const last = context.focusSessions[0];
    return `You completed ${plural(thisWeek.length, 'focus session')} in the last 7 days. Your most recent session was for ${last.subject ?? 'General'}.`;
}
function answerNotes(context) {
    if (context.noteCount === 0) {
        return 'You have no notes yet. Create one in the Notes tab.';
    }
    const recent = context.recentNotes
        .slice(0, 3)
        .map((note) => `${BULLET} ${note.title} (${note.category})${note.isPinned ? ', pinned' : ''}`)
        .join('\n');
    return `You have ${plural(context.noteCount, 'note')}. Most recent:\n\n${recent}`;
}
function answerGreeting(context) {
    const todayCount = tasksOn(context, manilaDate(0)).length;
    const overdueCount = overdueTasks(context).length;
    const status = todayCount === 0 && overdueCount === 0
        ? 'Nothing is due today.'
        : capitalize([
            todayCount > 0 ? `${plural(todayCount, 'task')} due today` : null,
            overdueCount > 0 ? `${overdueCount} overdue` : null,
        ]
            .filter(Boolean)
            .join(' and ')) + '.';
    return `Hi ${firstName(context)}! ${status}\n\nAsk me about your tasks, schedule, budget, subjects, notes or focus sessions.`;
}
function answerFallback() {
    return [
        "I'm not sure how to answer that yet. I can help with your tasks, schedule, subjects, budget, notes and focus sessions.",
        '',
        'Try asking:',
        `${BULLET} "What is due today?"`,
        `${BULLET} "What should I do next?"`,
        `${BULLET} "How much did I spend this week?"`,
    ].join('\n');
}
/** Removes leftover Markdown markers so replies display as clean text. */
function cleanReply(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
}
// ======================================================
// INTENT MATCHING (first match wins, so order matters)
// ======================================================
function answer(message, context) {
    const text = normalize(message);
    const words = text.split(' ');
    const has = (keywords) => mentions(text, words, keywords);
    if (has(KEYWORDS.help))
        return answerHelp();
    // Money
    if (has(KEYWORDS.expense))
        return answerExpenses(context, detectPeriod(has));
    if (has(KEYWORDS.income))
        return answerIncome(context, detectPeriod(has));
    if (has(KEYWORDS.budget))
        return answerBudget(context);
    // Overview
    if (has(KEYWORDS.stats))
        return answerStats(context);
    // Other features
    if (has(KEYWORDS.focus))
        return answerFocus(context);
    if (has(KEYWORDS.notes))
        return answerNotes(context);
    if (has(KEYWORDS.subjects))
        return answerSubjects(context);
    // Tasks and schedule
    if (has(KEYWORDS.overdue))
        return answerOverdue(context);
    if (has(KEYWORDS.next))
        return answerNext(context);
    if (has(KEYWORDS.tomorrow))
        return answerDay(context, 1);
    if (has(KEYWORDS.today))
        return answerDay(context, 0);
    if (has(KEYWORDS.week))
        return answerWeek(context);
    if (has(KEYWORDS.completed))
        return answerProgress(context);
    if (has(KEYWORDS.tasks))
        return answerTasks(context);
    // Small talk
    if (has(KEYWORDS.greeting))
        return answerGreeting(context);
    if (has(KEYWORDS.thanks)) {
        return `You're welcome, ${firstName(context)}! Good luck with your studies.`;
    }
    return answerFallback();
}
// ======================================================
// SERVICE
// ======================================================
export class AssistantService {
    async chat(userId, data) {
        const message = typeof data?.message === 'string'
            ? data.message.trim().slice(0, MAX_MESSAGE_LENGTH)
            : '';
        if (!message) {
            throw new AppError('Message is required', 400);
        }
        const context = await assistantRepository.getUserContext(userId);
        return { reply: cleanReply(answer(message, context)) };
    }
    async reset() {
        // Conversations are not saved on the server; the app clears its own messages.
        return {
            message: 'Assistant conversation reset successfully.',
        };
    }
}
export const assistantService = new AssistantService();
//# sourceMappingURL=assistant.service.js.map