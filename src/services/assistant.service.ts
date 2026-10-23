import {
  AssistantChatRequest,
  AssistantChatResponse,
} from '../types/assistant.types';
import {
  assistantRepository,
  AssistantContext,
} from '../repositories/assistant.repository';
import { AppError } from '../utils/response';
import { askGab, cleanHistory, isGabAiEnabled } from './gab.service';

/*
 * GabAi Assistant (offline, multi-language)
 *
 * No outside AI is used. The assistant understands the user's
 * message through keywords (with typo tolerance) and answers using
 * the user's own GabAi data, built-in study tips, app help, simple
 * math, and the current date and time.
 *
 * It replies in the language the user writes in:
 *   en  = English
 *   ceb = Cebuano / Bisaya
 *   tl  = Tagalog / Filipino
 *
 * To change a reply, edit the TEXT section below.
 */

const MAX_MESSAGE_LENGTH = 1000;
const MAX_LIST_ITEMS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const BULLET = '•';

type PendingTask = AssistantContext['pendingTasks'][number];
type Period = 'today' | 'week' | 'month';
type Lang = 'en' | 'ceb' | 'tl';
type Feature =
  | 'password'
  | 'notifications'
  | 'theme'
  | 'appLock'
  | 'note'
  | 'focus'
  | 'calendar'
  | 'expense'
  | 'task';

// ======================================================
// KEYWORDS (what the user might type)
// ======================================================

const KEYWORDS = {
  // Safety first: someone may be in danger.
  crisis: [
    'suicide', 'suicidal', 'kill myself', 'end my life', 'want to die', 'self harm',
    'magpakamatay', 'mamatay na lang', 'gusto na ko mamatay', 'gusto nako mamatay',
    'ayaw na ko mabuhi', 'ayaw nako mabuhi', 'pasakitan akong kaugalingon',
    'gusto ko nang mamatay', 'ayoko nang mabuhay', 'saktan ang sarili', 'magpakamatay na',
  ],
  feelings: [
    'stress', 'pressure', 'overwhelm', 'tired', 'exhausted', 'burnout', 'burn out', 'sad',
    'lonely', 'anxious', 'anxiety', 'worried', 'depressed', 'give up', 'cant do this',
    'kapoy', 'gikapoy', 'kaguol', 'naguol', 'kabalaka', 'kulbaan', 'lisod kaayo',
    'di ko kaya', 'dili ko kaya', 'suko na', 'sukoan',
    'pagod', 'napagod', 'nakakapagod', 'malungkot', 'hirap na', 'hindi ko kaya', 'sumuko',
    'need a break', 'need rest', 'gusto ko mopahulay', 'kailangan ko ng pahinga',
  ],
  help: ['help', 'tabang', 'tulong', 'what can you do', 'unsa imong mahimo', 'unsay imong mahimo', 'ano kaya mo', 'ano ang kaya mo', 'features'],
  howTo: ['how to', 'how do i', 'how can i', 'unsaon', 'paano', 'pano', 'where is', 'where can', 'asa makita', 'saan makikita', 'giunsa'],
  identity: ['who are you', 'what are you', 'your name', 'kinsa ka', 'unsa ka', 'imong ngalan', 'sino ka', 'ano ka', 'pangalan mo'],
  tips: ['tip', 'tips', 'advice', 'payo', 'how to study', 'study better', 'unsaon pagtuon', 'paano mag aral', 'procrastinat', 'tapolan', 'tamad', 'lazy', 'motivat', 'time management', 'memorize'],
  dateTime: ['what day', 'what date', 'what time', 'date today', 'unsa adlaw', 'unsang adlawa', 'unsa petsa', 'unsa oras', 'unsay oras', 'anong araw', 'anong petsa', 'anong oras', 'ano oras'],
  expense: ['expense', 'spend', 'spent', 'spending', 'gasto', 'gastos', 'nagasto', 'ginastos', 'nagastos', 'gumastos'],
  income: ['income', 'allowance', 'kita', 'sweldo', 'salary', 'earned'],
  budget: ['budget', 'balance', 'wallet', 'money', 'kwarta', 'kuwarta', 'pera', 'savings', 'ipon'],
  focus: ['focus', 'pomodoro', 'study session', 'tuon', 'concentrate'],
  notes: ['note', 'nota'],
  subjects: ['subject', 'class', 'klase', 'asignatura'],
  overdue: ['overdue', 'late', 'lapas', 'lampas', 'missed', 'nalapsan', 'atrasado'],
  today: ['today', 'karon', 'karong adlawa', 'ngayon', 'ngayong araw', 'tonight', 'karong gabii'],
  tomorrow: ['tomorrow', 'ugma', 'bukas'],
  week: ['week', 'semana', 'linggo', 'schedule', 'calendar', 'event', 'iskedyul', 'upcoming'],
  next: ['what next', 'next task', 'unsay sunod', 'ano susunod', 'priority', 'prioritize', 'una', 'unahon', 'unahin', 'uunahin', 'what should', 'unsay buhaton', 'unsa akong buhaton', 'buhaton', 'ano gagawin', 'anong gagawin', 'gagawin', 'recommend', 'suggest'],
  completed: ['done', 'completed', 'finished', 'nahuman', 'tapos', 'natapos', 'progress', 'accomplished'],
  tasks: ['task', 'assignment', 'homework', 'buluhaton', 'gawain', 'todo', 'activity', 'activities', 'project', 'requirement', 'deadline'],
  bye: ['bye', 'babay', 'goodbye', 'paalam', 'good night', 'goodnight', 'see you', 'una ko'],
  greeting: ['hi', 'hello', 'hey', 'kumusta', 'kamusta', 'musta', 'maayong buntag', 'maayong hapon', 'maayong gabii', 'magandang', 'good morning', 'good afternoon', 'good evening'],
  thanks: ['thank', 'salamat', 'ty'],
  ack: ['ok', 'okay', 'okey', 'sige', 'noted', 'nice', 'cool', 'nindot', 'galing', 'ayos', 'great', 'k'],
  stats: ['productivity', 'statistic', 'stats', 'analytics', 'summary', 'overview', 'report', 'performance'],
  periodToday: ['today', 'karon', 'ngayon', 'tonight'],
  periodWeek: ['week', 'semana', 'linggo', 'last 7 days'],
  periodMonth: ['month', 'bulan', 'buwan'],
  questionWords: ['who', 'what', 'when', 'where', 'why', 'which', 'kinsa', 'unsa', 'kanus', 'asa', 'ngano', 'sino', 'ano', 'kailan', 'saan', 'bakit'],
};

/** Feature words for "how do I ..." questions (checked in this order). */
const FEATURE_KEYWORDS: [Feature, string[]][] = [
  ['password', ['password']],
  ['notifications', ['notification', 'notif', 'reminder']],
  ['theme', ['dark mode', 'light mode', 'theme', 'appearance']],
  ['appLock', ['app lock', 'lock', 'fingerprint', 'face id']],
  ['note', ['note', 'nota']],
  ['focus', ['focus', 'pomodoro', 'timer']],
  ['calendar', ['calendar', 'event', 'iskedyul', 'schedule']],
  ['expense', ['expense', 'gasto', 'gastos', 'transaction', 'income', 'allowance', 'wallet', 'budget']],
  ['task', ['task', 'assignment', 'buluhaton', 'gawain']],
];

// ======================================================
// LANGUAGE DETECTION
// ======================================================

/**
 * Language to use when the message only has words shared by
 * Cebuano and Tagalog (like "salamat" or "kumusta").
 * Change to 'tl' if most of your users speak Tagalog.
 */
const DEFAULT_FILIPINO_LANG: Lang = 'ceb';

/** Words that are only used in one language (whole words only). */
const LANGUAGE_MARKERS: Record<'ceb' | 'tl', string[]> = {
  ceb: [
    'unsa', 'unsay', 'unsaon', 'unsang', 'nako', 'nimo', 'akong', 'imong', 'nakong', 'nimong',
    'naa', 'koy', 'karon', 'karong', 'ugma', 'gahapon', 'pila', 'kwarta', 'kuwarta',
    'buhaton', 'nahuman', 'lapas', 'nalapsan', 'gasto', 'nagasto', 'sunod', 'semanaha',
    'bulan', 'bulana', 'asa', 'kanus', 'tabang', 'diay', 'pud', 'sad', 'sab', 'kaayo',
    'maayong', 'buntag', 'gabii', 'ug', 'ani', 'ana', 'adlaw', 'adlawa', 'kinsa', 'ngano',
    'giunsa', 'kapoy', 'gikapoy', 'lisod', 'babay', 'tapolan', 'pagtuon', 'kaguol', 'ngalan',
    'hatagi', 'hatag', 'kog', 'mopahulay', 'pahulay',
    // also common in Tagalog, so they cancel out and the default decides
    'ko', 'ako',
  ],
  tl: [
    'ano', 'anong', 'ako', 'ko', 'kong', 'ngayon', 'ngayong', 'bukas', 'kahapon', 'ilan',
    'magkano', 'pera', 'gagawin', 'natapos', 'lampas', 'gastos', 'nagastos', 'gumastos',
    'susunod', 'linggo', 'buwan', 'saan', 'kailan', 'tulong', 'ng', 'po', 'naman', 'mo',
    'yung', 'natin', 'meron', 'mayroon', 'magandang', 'umaga', 'araw', 'iyong', 'sino',
    'bakit', 'paano', 'pano', 'pagod', 'hirap', 'paalam', 'tamad', 'malungkot', 'pangalan',
    'bigyan', 'magpahinga', 'nang',
  ],
};

/** Filipino words used in both Cebuano and Tagalog. */
const SHARED_FILIPINO = ['salamat', 'kumusta', 'kamusta', 'musta', 'sige'];

function detectLanguage(words: string[]): Lang {
  const score = (markers: string[]) =>
    words.filter((word) => markers.includes(word)).length;

  const ceb = score(LANGUAGE_MARKERS.ceb);
  const tl = score(LANGUAGE_MARKERS.tl);

  if (ceb === 0 && tl === 0) {
    return words.some((word) => SHARED_FILIPINO.includes(word))
      ? DEFAULT_FILIPINO_LANG
      : 'en';
  }

  if (ceb === tl) return DEFAULT_FILIPINO_LANG;

  return ceb > tl ? 'ceb' : 'tl';
}

// ======================================================
// TEXT (every reply, in each language — edit here)
// ======================================================

interface Texts {
  /** "3 tasks" / "3 ka task" / "3 na task" */
  count: (n: number, word: string) => string;
  words: {
    task: string;
    pendingTask: string;
    overdueTask: string;
    expense: string;
    focusSession: string;
    note: string;
  };

  today: string;
  tomorrow: string;
  due: string;
  of: string;
  percentOf: string;
  more: (n: number) => string;
  period: Record<Period, string>;

  help: string[];

  overdueNone: string;
  overdueList: (count: string, list: string, first: string) => string;

  dayNone: (label: string, extra: string) => string;
  dayTomorrowExtra: (count: string) => string;
  dayList: (count: string, label: string, list: string) => string;

  weekNone: (note: string) => string;
  weekList: (count: string, list: string, note: string) => string;
  weekOverdueNote: (count: string) => string;

  nextNone: string;
  nextOverdue: string;
  nextDue: (when: string) => string;
  nextFirst: (title: string, subject: string, when: string, priority: string) => string;
  upNext: string;

  progressNone: string;
  progress: (done: number, total: number, rate: number, tail: string) => string;
  progressRemaining: (count: string) => string;
  progressAllDone: string;

  statsTitle: string;
  statsCompletion: string;
  statsPending: string;
  statsDueToday: string;
  statsOverdue: string;
  statsFocus: string;
  statsTipOverdue: string;
  statsTipDone: string;

  tasksNone: string;
  tasksHave: (count: string) => string;
  tasksOverdue: (n: number) => string;
  tasksToday: (n: number) => string;

  expensesNone: (label: string) => string;
  expenses: (total: string, label: string, count: string, top: string) => string;
  income: (amount: string, label: string, total: string) => string;

  budgetNone: string;
  budget: (balance: string, income: string, expenses: string) => string;

  subjectsNone: string;
  subjectsTitle: string;

  focusNone: string;
  focus: (count: string, subject: string) => string;

  notesNone: string;
  notes: (count: string, recent: string) => string;
  pinned: string;

  greetingNothing: string;
  greetingDueToday: (count: string) => string;
  greetingOverdue: (n: number) => string;
  greetingStatus: (parts: string[]) => string;
  greeting: (name: string, status: string) => string;

  thanks: (name: string) => string;
  fallback: string[];

  // ----- smarter offline replies -----
  crisis: string;
  feelingsWithTasks: (name: string, count: string, title: string) => string;
  feelingsNoTasks: (name: string) => string;
  mathDivideByZero: string;
  dateTime: (date: string, time: string) => string;
  taskOverdueBy: (days: number) => string;
  taskDueToday: string;
  taskDueTomorrow: string;
  taskDueIn: (days: number) => string;
  taskInfo: (title: string, subject: string, due: string, status: string, priority: string) => string;
  howTo: Record<Feature, string>;
  tips: string[];
  identity: string;
  bye: (name: string) => string;
  ack: string;
  generalQuestion: string[];
}

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

const HOTLINES = [
  `${BULLET} NCMH Crisis Hotline (24/7): 1553, 0917-899-8727 (Globe/TM), 0908-639-2672 (Smart/TNT)`,
  `${BULLET} Tawag Paglaum – Centro Bisaya: 0939-937-5433 (Smart/TNT), 0927-654-1629 (Globe/TM)`,
  `${BULLET} Emergency: 911`,
].join('\n');

const TEXT: Record<Lang, Texts> = {
  // ---------------- ENGLISH ----------------
  en: {
    count: (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`,
    words: {
      task: 'task',
      pendingTask: 'pending task',
      overdueTask: 'overdue task',
      expense: 'expense',
      focusSession: 'focus session',
      note: 'note',
    },

    today: 'today',
    tomorrow: 'tomorrow',
    due: 'due',
    of: 'of',
    percentOf: 'of',
    more: (n) => `and ${n} more in your Tasks tab`,
    period: { today: 'today', week: 'this week', month: 'this month' },

    help: [
      'Here is what I can help you with:',
      '',
      `${BULLET} Your tasks: "What is due today?", "What should I do next?"`,
      `${BULLET} Your schedule: "What is my schedule this week?"`,
      `${BULLET} Your money: "How much did I spend this week?", "What is my balance?"`,
      `${BULLET} Your progress: "Show my productivity summary"`,
      `${BULLET} Study tips: "Give me study tips"`,
      `${BULLET} Using the app: "How do I add a task?"`,
      `${BULLET} Quick math: "250 + 120" or "15% of 800"`,
      `${BULLET} Date and time: "What day is it?"`,
      '',
      'You can also ask in Bisaya or Tagalog.',
    ],

    overdueNone: 'You have no overdue tasks. Everything is on track.',
    overdueList: (count, list, first) =>
      `You have ${count}:\n\n${list}\n\nI recommend finishing "${first}" first.`,

    dayNone: (label, extra) => `You have no tasks due ${label}.${extra}`,
    dayTomorrowExtra: (count) => ` You have ${count} due tomorrow.`,
    dayList: (count, label, list) => `You have ${count} due ${label}:\n\n${list}`,

    weekNone: (note) => `Nothing is due in the next 7 days.${note}`,
    weekList: (count, list, note) =>
      `Here is what's due in the next 7 days (${count}):\n\n${list}${note}`,
    weekOverdueNote: (count) => `\n\nYou also have ${count}.`,

    nextNone: "You're all caught up. There are no pending tasks right now.",
    nextOverdue: 'It is overdue',
    nextDue: (when) => `It is due ${when}`,
    nextFirst: (title, subject, when, priority) =>
      `I recommend starting with "${title}" (${subject}). ${when} and marked ${priority} priority.`,
    upNext: 'Up next:',

    progressNone:
      "You don't have any tasks yet. Add one in the Tasks tab to start tracking your progress.",
    progress: (done, total, rate, tail) =>
      `You've completed ${done} of ${total} tasks (${rate}%). ${tail}`,
    progressRemaining: (count) => `${capitalize(count)} remaining.`,
    progressAllDone: 'Everything is done. Great work!',

    statsTitle: 'Here is your productivity summary:',
    statsCompletion: 'Task completion',
    statsPending: 'Pending tasks',
    statsDueToday: 'Due today',
    statsOverdue: 'Overdue',
    statsFocus: 'Focus sessions this week',
    statsTipOverdue:
      'Clearing your overdue tasks first will raise your completion rate the fastest.',
    statsTipDone: 'You have no pending tasks. Excellent work!',

    tasksNone: 'You have no pending tasks. Nice work!',
    tasksHave: (count) => `You have ${count}`,
    tasksOverdue: (n) => `${n} overdue`,
    tasksToday: (n) => `${n} due today`,

    expensesNone: (label) => `You have no expenses recorded ${label}.`,
    expenses: (total, label, count, top) =>
      `You've spent ${total} ${label} across ${count}.\n\nTop categories:\n${top}`,
    income: (amount, label, total) =>
      `You've received ${amount} ${label}. Your total income so far is ${total}.`,

    budgetNone:
      'You have no transactions yet. Add your allowance or expenses in the Expenses tab.',
    budget: (balance, income, expenses) =>
      `Your current balance is ${balance}.\n\n${BULLET} Total income: ${income}\n${BULLET} Total expenses: ${expenses}`,

    subjectsNone: "You don't have any subjects yet. You can add them from the Tasks tab.",
    subjectsTitle: 'Your subjects:',

    focusNone:
      'You have no focus sessions yet. Start one in the Focus tab to study without distractions.',
    focus: (count, subject) =>
      `You completed ${count} in the last 7 days. Your most recent session was for ${subject}.`,

    notesNone: 'You have no notes yet. Create one in the Notes tab.',
    notes: (count, recent) => `You have ${count}. Most recent:\n\n${recent}`,
    pinned: ', pinned',

    greetingNothing: 'Nothing is due today.',
    greetingDueToday: (count) => `${count} due today`,
    greetingOverdue: (n) => `${n} overdue`,
    greetingStatus: (parts) => `${capitalize(parts.join(' and '))}.`,
    greeting: (name, status) =>
      `Hi ${name}! ${status}\n\nAsk me about your tasks, schedule, budget, study tips, or how to use GabAi.`,

    thanks: (name) => `You're welcome, ${name}! Good luck with your studies.`,
    fallback: [
      "Sorry, I didn't quite get that. Here are some things you can ask me:",
      '',
      `${BULLET} "What is due today?"`,
      `${BULLET} "What should I do next?"`,
      `${BULLET} "How much did I spend this week?"`,
      `${BULLET} "Give me study tips"`,
      `${BULLET} "How do I add a task?"`,
    ],

    crisis: [
      "I'm really sorry you're feeling this way. You don't have to go through this alone, and you deserve support right now.",
      '',
      'Please talk to someone you trust, or reach out to a free crisis hotline. They are there to listen, any time:',
      '',
      HOTLINES,
      '',
      "If you're in immediate danger, please call 911 or go to the nearest hospital.",
    ].join('\n'),
    feelingsWithTasks: (name, count, title) =>
      `I'm sorry you're feeling this way, ${name}. It's okay to feel overwhelmed sometimes.\n\nYou have ${count}, but you don't have to do everything at once. Start small: work on "${title}" for just 25 minutes, then take a 5-minute break.\n\nDon't forget to rest, eat, and drink water. If it feels too heavy, talking to a friend, family member or your guidance counselor can really help.`,
    feelingsNoTasks: (name) =>
      `I'm sorry you're feeling this way, ${name}. The good news is you're all caught up on your tasks, so it's a good time to rest.\n\nTake a break, get some sleep, and do something you enjoy. If it feels too heavy, talking to a friend, family member or your guidance counselor can really help.`,
    mathDivideByZero: "That can't be calculated because it divides by zero.",
    dateTime: (date, time) => `Today is ${date}. It's ${time}.`,
    taskOverdueBy: (days) => `It is overdue by ${days} day${days === 1 ? '' : 's'}.`,
    taskDueToday: 'It is due today.',
    taskDueTomorrow: 'It is due tomorrow.',
    taskDueIn: (days) => `You have ${days} days left.`,
    taskInfo: (title, subject, due, status, priority) =>
      `"${title}" (${subject})\n\n${BULLET} Deadline: ${due}\n${BULLET} Priority: ${priority}\n\n${status}`,
    howTo: {
      task: 'To add a task, open the Tasks tab and tap the + button. Fill in the title, subject, priority and due date, then save. Tap a task to mark it as done.',
      expense: 'To record money, open the Wallet (Expenses) tab and tap the + button at the top. Choose Expense or Income, enter the title, amount and category, then save.',
      focus: 'Open Focus from the menu or the dashboard, pick your subject and timer, then start. A good routine is 25 minutes of focus followed by a 5-minute break.',
      note: 'Open the Notes tab and tap the + button to create a note. You can pin it, mark it as a favorite, or turn it into a task.',
      calendar: 'Open the Calendar tab and tap + to add an event. Tasks with due dates also appear on your calendar.',
      appLock: 'Go to Profile → Privacy & Security and turn on "Lock GabAi". The app will ask for your fingerprint, face or phone PIN when you open it.',
      notifications: 'Go to Profile → Notification Settings to turn reminders on or off and choose how early you want to be reminded.',
      password: 'Go to Profile → Privacy & Security → Change Password. If you signed up with Google, use "Forgot Password" on the login screen to set a password first.',
      theme: 'Go to Profile → Appearance and choose Light, Dark or System.',
    },
    tips: [
      'Try the Pomodoro method: study for 25 minutes, then take a 5-minute break. After 4 rounds, take a longer 15–30 minute break. You can time it in the Focus tab.',
      'Start with the task that is due soonest, and break big tasks into small steps you can finish in 30 minutes or less.',
      'Review in short sessions over several days instead of cramming the night before. Testing yourself with flashcards or practice questions works better than just re-reading.',
      'Put your phone on silent and keep only what you need on your desk. Even 25 minutes of real focus beats 2 hours of distracted studying.',
      'Feeling unmotivated? Promise yourself just 5 minutes. Starting is the hardest part, and it usually gets easier once you begin.',
    ],
    identity:
      "I'm GabAi Assistant, your study and productivity buddy. I work offline and use your own GabAi data: tasks, schedule, budget, notes and focus sessions.",
    bye: (name) => `Bye, ${name}! Good luck with your studies. See you!`,
    ack: "Okay! Just let me know if you need anything else.",
    generalQuestion: [
      "Sorry, I work offline, so I don't have information about that. I can only answer using your GabAi data and my built-in study tips.",
      '',
      'Try asking about your tasks, schedule, budget, progress, or "Give me study tips".',
    ],
  },

  // ---------------- CEBUANO / BISAYA ----------------
  ceb: {
    count: (n, word) => (n === 1 ? `usa ka ${word}` : `${n} ka ${word}`),
    words: {
      task: 'task',
      pendingTask: 'pending nga task',
      overdueTask: 'overdue nga task',
      expense: 'expense',
      focusSession: 'focus session',
      note: 'note',
    },

    today: 'karon',
    tomorrow: 'ugma',
    due: 'deadline',
    of: 'sa',
    percentOf: 'sa',
    more: (n) => `ug ${n} pa sa imong Tasks tab`,
    period: { today: 'karon', week: 'karong semanaha', month: 'karong bulana' },

    help: [
      'Mao ni ang akong matabang nimo:',
      '',
      `${BULLET} Imong tasks: "Unsay deadline karon?", "Unsay sunod nakong buhaton?"`,
      `${BULLET} Imong schedule: "Unsa akong schedule karong semanaha?"`,
      `${BULLET} Imong kwarta: "Pila akong nagasto karong semanaha?", "Pila akong kwarta?"`,
      `${BULLET} Imong progress: "Ipakita akong productivity summary"`,
      `${BULLET} Study tips: "Hatagi kog study tips"`,
      `${BULLET} Paggamit sa app: "Unsaon pag-add og task?"`,
      `${BULLET} Dali nga math: "250 + 120" o "15% sa 800"`,
      `${BULLET} Petsa ug oras: "Unsa adlaw karon?"`,
      '',
      'Pwede pud ka mangutana sa English o Tagalog.',
    ],

    overdueNone: 'Wala kay overdue nga task. Maayo kaayo!',
    overdueList: (count, list, first) =>
      `Naa kay ${count}:\n\n${list}\n\nAkong sugyot, unaha ang "${first}".`,

    dayNone: (label, extra) => `Wala kay task nga deadline ${label}.${extra}`,
    dayTomorrowExtra: (count) => ` Naa kay ${count} nga deadline ugma.`,
    dayList: (count, label, list) => `Naa kay ${count} nga deadline ${label}:\n\n${list}`,

    weekNone: (note) => `Walay deadline sulod sa sunod nga 7 ka adlaw.${note}`,
    weekList: (count, list, note) =>
      `Mao ni ang mga deadline sulod sa sunod nga 7 ka adlaw (${count}):\n\n${list}${note}`,
    weekOverdueNote: (count) => `\n\nNaa pud kay ${count}.`,

    nextNone: 'Nahuman na nimo tanan! Wala kay pending nga task karon.',
    nextOverdue: 'Overdue na kini',
    nextDue: (when) => `Ang deadline kay ${when}`,
    nextFirst: (title, subject, when, priority) =>
      `Akong sugyot, sugdi ang "${title}" (${subject}). ${when}, ug ${priority} ang priority.`,
    upNext: 'Sunod:',

    progressNone:
      'Wala pa kay task. Pag-add og usa sa Tasks tab para ma-track ang imong progress.',
    progress: (done, total, rate, tail) =>
      `Nahuman na nimo ang ${done} sa ${total} ka task (${rate}%). ${tail}`,
    progressRemaining: (count) => `${capitalize(count)} pa ang nahibilin.`,
    progressAllDone: 'Nahuman na tanan. Maayo kaayo!',

    statsTitle: 'Mao ni ang imong productivity summary:',
    statsCompletion: 'Nahuman nga task',
    statsPending: 'Pending nga task',
    statsDueToday: 'Deadline karon',
    statsOverdue: 'Overdue',
    statsFocus: 'Focus sessions karong semanaha',
    statsTipOverdue:
      'Unaha ang mga overdue nga task para dali mosaka ang imong completion rate.',
    statsTipDone: 'Wala kay pending nga task. Maayo kaayo!',

    tasksNone: 'Wala kay pending nga task. Nindot!',
    tasksHave: (count) => `Naa kay ${count}`,
    tasksOverdue: (n) => `${n} ang overdue`,
    tasksToday: (n) => `${n} ang deadline karon`,

    expensesNone: (label) => `Wala kay expense nga na-record ${label}.`,
    expenses: (total, label, count, top) =>
      `Nakagasto ka og ${total} ${label} sa ${count}.\n\nMga top category:\n${top}`,
    income: (amount, label, total) =>
      `Nakadawat ka og ${amount} ${label}. Ang imong total nga income kay ${total}.`,

    budgetNone:
      'Wala pa kay transaction. I-add ang imong allowance o gasto sa Expenses tab.',
    budget: (balance, income, expenses) =>
      `Ang imong balance karon kay ${balance}.\n\n${BULLET} Total income: ${income}\n${BULLET} Total expenses: ${expenses}`,

    subjectsNone: 'Wala pa kay subject. Pwede ka mo-add sa Tasks tab.',
    subjectsTitle: 'Imong mga subject:',

    focusNone:
      'Wala pa kay focus session. Pagsugod og usa sa Focus tab para makatuon nga walay samok.',
    focus: (count, subject) =>
      `Naa kay ${count} sulod sa miaging 7 ka adlaw. Ang pinakaulahi kay para sa ${subject}.`,

    notesNone: 'Wala pa kay note. Paghimo og usa sa Notes tab.',
    notes: (count, recent) => `Naa kay ${count}. Pinakabag-o:\n\n${recent}`,
    pinned: ', naka-pin',

    greetingNothing: 'Walay deadline karon.',
    greetingDueToday: (count) => `${count} nga deadline karon`,
    greetingOverdue: (n) => `${n} nga overdue`,
    greetingStatus: (parts) => `Naa kay ${parts.join(' ug ')}.`,
    greeting: (name, status) =>
      `Hi ${name}! ${status}\n\nPangutan-a ko bahin sa imong tasks, schedule, budget, study tips, o unsaon paggamit sa GabAi.`,

    thanks: (name) => `Walay sapayan, ${name}! Good luck sa imong pagtuon.`,
    fallback: [
      'Pasensya, wala nako kaayo masabtan. Mao ni ang pwede nimo ipangutana:',
      '',
      `${BULLET} "Unsay deadline karon?"`,
      `${BULLET} "Unsay sunod nakong buhaton?"`,
      `${BULLET} "Pila akong nagasto karong semanaha?"`,
      `${BULLET} "Hatagi kog study tips"`,
      `${BULLET} "Unsaon pag-add og task?"`,
    ],

    crisis: [
      'Pasensya kaayo nga ingon ana imong gibati. Dili ka nag-inusara, ug angay ka makadawat og tabang karon dayon.',
      '',
      'Palihug istoryahi ang tawo nga imong gisaligan, o tawag sa libre nga crisis hotline. Andam sila maminaw bisan unsang orasa:',
      '',
      HOTLINES,
      '',
      'Kung naa ka sa peligro karon, palihug tawag sa 911 o adto sa pinakaduol nga ospital.',
    ].join('\n'),
    feelingsWithTasks: (name, count, title) =>
      `Pasensya nga ingon ana imong gibati, ${name}. Normal ra nga mabug-atan usahay.\n\nNaa kay ${count}, pero dili nimo kinahanglan buhaton tanan dungan. Sugdi og gamay: trabahoa ang "${title}" sulod lang sa 25 minutos, dayon pahulay og 5 minutos.\n\nAyaw kalimti ang pahulay, pagkaon, ug pag-inom og tubig. Kung bug-at kaayo, makatabang gyud ang pakig-istorya sa higala, pamilya, o sa imong guidance counselor.`,
    feelingsNoTasks: (name) =>
      `Pasensya nga ingon ana imong gibati, ${name}. Ang maayong balita, nahuman na nimo tanan nimong task, so maayo nga panahon ni para mopahulay.\n\nPahulay, katulog, ug buhata ang imong ganahan. Kung bug-at kaayo, makatabang gyud ang pakig-istorya sa higala, pamilya, o sa imong guidance counselor.`,
    mathDivideByZero: 'Dili ni ma-compute kay mag-divide man sa zero.',
    dateTime: (date, time) => `Karon kay ${date}. Ang oras karon kay ${time}.`,
    taskOverdueBy: (days) => `Overdue na kini og ${days} ka adlaw.`,
    taskDueToday: 'Ang deadline niini kay karon.',
    taskDueTomorrow: 'Ang deadline niini kay ugma.',
    taskDueIn: (days) => `Naa pa kay ${days} ka adlaw.`,
    taskInfo: (title, subject, due, status, priority) =>
      `"${title}" (${subject})\n\n${BULLET} Deadline: ${due}\n${BULLET} Priority: ${priority}\n\n${status}`,
    howTo: {
      task: 'Para mo-add og task, ablihi ang Tasks tab ug pindota ang + nga button. Isulat ang title, subject, priority, ug deadline, dayon i-save. Pindota ang task para markahan nga nahuman na.',
      expense: 'Para mo-record og kwarta, ablihi ang Wallet (Expenses) tab ug pindota ang + sa ibabaw. Pilia ang Expense o Income, isulat ang title, amount, ug category, dayon i-save.',
      focus: 'Ablihi ang Focus gikan sa menu o dashboard, pilia ang subject ug timer, dayon sugdi. Maayo nga routine ang 25 minutos nga focus ug 5 minutos nga pahulay.',
      note: 'Ablihi ang Notes tab ug pindota ang + para mohimo og note. Pwede nimo kini i-pin, himoong favorite, o himoon nga task.',
      calendar: 'Ablihi ang Calendar tab ug pindota ang + para mo-add og event. Ang mga task nga naay deadline makita usab sa imong calendar.',
      appLock: 'Adto sa Profile → Privacy & Security ug i-on ang "Lock GabAi". Mangayo ang app sa imong fingerprint, face, o PIN sa phone inig abli.',
      notifications: 'Adto sa Profile → Notification Settings para i-on o i-off ang mga reminder ug pilion kung kanus-a ka pahinumdoman.',
      password: 'Adto sa Profile → Privacy & Security → Change Password. Kung Google ang imong gigamit pag-sign up, gamita ang "Forgot Password" sa login screen para mohimo og password.',
      theme: 'Adto sa Profile → Appearance ug pilia ang Light, Dark, o System.',
    },
    tips: [
      'Sulayi ang Pomodoro method: pagtuon og 25 minutos, dayon pahulay og 5 minutos. Human sa 4 ka round, pahulay og mas dugay, mga 15–30 minutos. Pwede nimo i-timer sa Focus tab.',
      'Sugdi ang task nga pinakaduol na ang deadline, ug bahina ang dagkong task ngadto sa gagmay nga lakang nga mahuman sulod sa 30 minutos.',
      'Pag-review og mubo matag adlaw imbes nga mag-cram sa gabii sa wala pa ang exam. Mas epektibo ang pag-test sa kaugalingon gamit ang flashcards o practice questions kaysa basa-basa ra.',
      'I-silent ang phone ug ang kinahanglanon ra ang ibutang sa lamesa. Mas maayo ang 25 minutos nga tinuod nga focus kaysa 2 ka oras nga daghang samok.',
      'Tapolan? Saaga ang imong kaugalingon og 5 minutos lang. Ang pagsugod ang pinakalisod, ug kasagaran mosayon na kung nakasugod na ka.',
    ],
    identity:
      'Ako si GabAi Assistant, imong kauban sa pagtuon ug productivity. Offline ko mo-trabaho ug ang imong GabAi data ra ang akong gamiton: tasks, schedule, budget, notes, ug focus sessions.',
    bye: (name) => `Babay, ${name}! Good luck sa imong pagtuon. Kita-kits!`,
    ack: 'Sige! Sulti lang kung naa pa kay kinahanglan.',
    generalQuestion: [
      'Pasensya, offline ko, so wala koy impormasyon bahin ana. Ang imong GabAi data ug ang akong study tips ra ang akong matubag.',
      '',
      'Sulayi pangutana bahin sa imong tasks, schedule, budget, progress, o "Hatagi kog study tips".',
    ],
  },

  // ---------------- TAGALOG / FILIPINO ----------------
  tl: {
    count: (n, word) => (n === 1 ? `isang ${word}` : `${n} na ${word}`),
    words: {
      task: 'task',
      pendingTask: 'pending na task',
      overdueTask: 'overdue na task',
      expense: 'expense',
      focusSession: 'focus session',
      note: 'note',
    },

    today: 'ngayon',
    tomorrow: 'bukas',
    due: 'deadline',
    of: 'sa',
    percentOf: 'ng',
    more: (n) => `at ${n} pa sa iyong Tasks tab`,
    period: { today: 'ngayon', week: 'ngayong linggo', month: 'ngayong buwan' },

    help: [
      'Ito ang maitutulong ko:',
      '',
      `${BULLET} Iyong tasks: "Ano ang deadline ngayon?", "Ano ang gagawin ko?"`,
      `${BULLET} Iyong schedule: "Ano ang schedule ko ngayong linggo?"`,
      `${BULLET} Iyong pera: "Magkano ang nagastos ko ngayong linggo?", "Magkano ang pera ko?"`,
      `${BULLET} Iyong progress: "Ipakita ang productivity summary ko"`,
      `${BULLET} Study tips: "Bigyan mo ako ng study tips"`,
      `${BULLET} Paggamit ng app: "Paano mag-add ng task?"`,
      `${BULLET} Mabilis na math: "250 + 120" o "15% ng 800"`,
      `${BULLET} Petsa at oras: "Anong araw ngayon?"`,
      '',
      'Puwede ka ring magtanong sa English o Bisaya.',
    ],

    overdueNone: 'Wala kang overdue na task. Ayos!',
    overdueList: (count, list, first) =>
      `Mayroon kang ${count}:\n\n${list}\n\nMungkahi ko, unahin mo ang "${first}".`,

    dayNone: (label, extra) => `Wala kang task na deadline ${label}.${extra}`,
    dayTomorrowExtra: (count) => ` Mayroon kang ${count} na deadline bukas.`,
    dayList: (count, label, list) => `Mayroon kang ${count} na deadline ${label}:\n\n${list}`,

    weekNone: (note) => `Walang deadline sa susunod na 7 araw.${note}`,
    weekList: (count, list, note) =>
      `Ito ang mga deadline sa susunod na 7 araw (${count}):\n\n${list}${note}`,
    weekOverdueNote: (count) => `\n\nMayroon ka ring ${count}.`,

    nextNone: 'Tapos mo na lahat! Wala kang pending na task ngayon.',
    nextOverdue: 'Overdue na ito',
    nextDue: (when) => `Ang deadline nito ay ${when}`,
    nextFirst: (title, subject, when, priority) =>
      `Mungkahi ko, simulan mo ang "${title}" (${subject}). ${when}, at ${priority} ang priority.`,
    upNext: 'Susunod:',

    progressNone:
      'Wala ka pang task. Magdagdag ng isa sa Tasks tab para ma-track ang progress mo.',
    progress: (done, total, rate, tail) =>
      `Natapos mo na ang ${done} sa ${total} na task (${rate}%). ${tail}`,
    progressRemaining: (count) => `${capitalize(count)} pa ang natitira.`,
    progressAllDone: 'Tapos na lahat. Magaling!',

    statsTitle: 'Ito ang iyong productivity summary:',
    statsCompletion: 'Natapos na task',
    statsPending: 'Pending na task',
    statsDueToday: 'Deadline ngayon',
    statsOverdue: 'Overdue',
    statsFocus: 'Focus sessions ngayong linggo',
    statsTipOverdue:
      'Unahin ang mga overdue na task para mabilis tumaas ang completion rate mo.',
    statsTipDone: 'Wala kang pending na task. Magaling!',

    tasksNone: 'Wala kang pending na task. Ayos!',
    tasksHave: (count) => `Mayroon kang ${count}`,
    tasksOverdue: (n) => `${n} ang overdue`,
    tasksToday: (n) => `${n} ang deadline ngayon`,

    expensesNone: (label) => `Wala kang naitalang expense ${label}.`,
    expenses: (total, label, count, top) =>
      `Gumastos ka ng ${total} ${label} sa ${count}.\n\nMga top category:\n${top}`,
    income: (amount, label, total) =>
      `Nakatanggap ka ng ${amount} ${label}. Ang kabuuang income mo ay ${total}.`,

    budgetNone:
      'Wala ka pang transaction. Idagdag ang iyong allowance o gastos sa Expenses tab.',
    budget: (balance, income, expenses) =>
      `Ang balance mo ngayon ay ${balance}.\n\n${BULLET} Total income: ${income}\n${BULLET} Total expenses: ${expenses}`,

    subjectsNone: 'Wala ka pang subject. Puwede kang magdagdag sa Tasks tab.',
    subjectsTitle: 'Iyong mga subject:',

    focusNone:
      'Wala ka pang focus session. Magsimula ng isa sa Focus tab para makapag-aral nang walang istorbo.',
    focus: (count, subject) =>
      `Mayroon kang ${count} sa nakaraang 7 araw. Ang pinakahuli ay para sa ${subject}.`,

    notesNone: 'Wala ka pang note. Gumawa ng isa sa Notes tab.',
    notes: (count, recent) => `Mayroon kang ${count}. Pinakabago:\n\n${recent}`,
    pinned: ', naka-pin',

    greetingNothing: 'Walang deadline ngayon.',
    greetingDueToday: (count) => `${count} na deadline ngayon`,
    greetingOverdue: (n) => `${n} na overdue`,
    greetingStatus: (parts) => `Mayroon kang ${parts.join(' at ')}.`,
    greeting: (name, status) =>
      `Hi ${name}! ${status}\n\nTanungin mo ako tungkol sa iyong tasks, schedule, budget, study tips, o kung paano gamitin ang GabAi.`,

    thanks: (name) => `Walang anuman, ${name}! Good luck sa pag-aaral mo.`,
    fallback: [
      'Pasensya, hindi ko masyadong naintindihan. Ito ang puwede mong itanong:',
      '',
      `${BULLET} "Ano ang deadline ngayon?"`,
      `${BULLET} "Ano ang gagawin ko?"`,
      `${BULLET} "Magkano ang nagastos ko ngayong linggo?"`,
      `${BULLET} "Bigyan mo ako ng study tips"`,
      `${BULLET} "Paano mag-add ng task?"`,
    ],

    crisis: [
      'Pasensya na at ganyan ang nararamdaman mo. Hindi ka nag-iisa, at nararapat kang makatanggap ng tulong ngayon din.',
      '',
      'Pakiusap, kausapin ang taong pinagkakatiwalaan mo, o tumawag sa libreng crisis hotline. Handa silang makinig anumang oras:',
      '',
      HOTLINES,
      '',
      'Kung nasa panganib ka ngayon, tumawag sa 911 o pumunta sa pinakamalapit na ospital.',
    ].join('\n'),
    feelingsWithTasks: (name, count, title) =>
      `Pasensya na at ganyan ang nararamdaman mo, ${name}. Normal lang na mabigatan paminsan-minsan.\n\nMayroon kang ${count}, pero hindi mo kailangang gawin lahat nang sabay-sabay. Magsimula nang maliit: gawin ang "${title}" sa loob lang ng 25 minuto, tapos magpahinga ng 5 minuto.\n\nHuwag kalimutang magpahinga, kumain, at uminom ng tubig. Kung masyadong mabigat, malaking tulong ang makipag-usap sa kaibigan, pamilya, o sa iyong guidance counselor.`,
    feelingsNoTasks: (name) =>
      `Pasensya na at ganyan ang nararamdaman mo, ${name}. Ang magandang balita, tapos mo na lahat ng task mo, kaya magandang pagkakataon ito para magpahinga.\n\nMagpahinga, matulog, at gawin ang gusto mo. Kung masyadong mabigat, malaking tulong ang makipag-usap sa kaibigan, pamilya, o sa iyong guidance counselor.`,
    mathDivideByZero: 'Hindi ito makukuwenta dahil nagdi-divide sa zero.',
    dateTime: (date, time) => `Ngayon ay ${date}. Ang oras ngayon ay ${time}.`,
    taskOverdueBy: (days) => `Overdue na ito ng ${days} araw.`,
    taskDueToday: 'Ang deadline nito ay ngayon.',
    taskDueTomorrow: 'Ang deadline nito ay bukas.',
    taskDueIn: (days) => `May ${days} araw ka pa.`,
    taskInfo: (title, subject, due, status, priority) =>
      `"${title}" (${subject})\n\n${BULLET} Deadline: ${due}\n${BULLET} Priority: ${priority}\n\n${status}`,
    howTo: {
      task: 'Para mag-add ng task, buksan ang Tasks tab at pindutin ang + na button. Ilagay ang title, subject, priority, at deadline, tapos i-save. Pindutin ang task para markahan itong tapos na.',
      expense: 'Para mag-record ng pera, buksan ang Wallet (Expenses) tab at pindutin ang + sa itaas. Piliin ang Expense o Income, ilagay ang title, amount, at category, tapos i-save.',
      focus: 'Buksan ang Focus mula sa menu o dashboard, piliin ang subject at timer, tapos simulan. Magandang routine ang 25 minutong focus at 5 minutong pahinga.',
      note: 'Buksan ang Notes tab at pindutin ang + para gumawa ng note. Puwede mo itong i-pin, gawing favorite, o gawing task.',
      calendar: 'Buksan ang Calendar tab at pindutin ang + para mag-add ng event. Lumalabas din sa calendar ang mga task na may deadline.',
      appLock: 'Pumunta sa Profile → Privacy & Security at i-on ang "Lock GabAi". Hihingin ng app ang iyong fingerprint, face, o PIN ng phone tuwing bubuksan ito.',
      notifications: 'Pumunta sa Profile → Notification Settings para i-on o i-off ang mga reminder at piliin kung gaano kaaga ka ipapaalala.',
      password: 'Pumunta sa Profile → Privacy & Security → Change Password. Kung Google ang ginamit mo sa pag-sign up, gamitin ang "Forgot Password" sa login screen para gumawa ng password.',
      theme: 'Pumunta sa Profile → Appearance at piliin ang Light, Dark, o System.',
    },
    tips: [
      'Subukan ang Pomodoro method: mag-aral ng 25 minuto, tapos magpahinga ng 5 minuto. Pagkatapos ng 4 na round, magpahinga nang mas matagal, mga 15–30 minuto. Puwede mo itong i-timer sa Focus tab.',
      'Simulan ang task na pinakamalapit na ang deadline, at hatiin ang malalaking task sa maliliit na hakbang na matatapos sa loob ng 30 minuto.',
      'Mag-review nang paunti-unti araw-araw sa halip na mag-cram sa gabi bago ang exam. Mas epektibo ang pag-test sa sarili gamit ang flashcards o practice questions kaysa basta magbasa.',
      'I-silent ang phone at ilagay lang sa mesa ang kailangan mo. Mas mabuti ang 25 minutong tunay na focus kaysa 2 oras na puro istorbo.',
      'Tinatamad? Mangako sa sarili ng 5 minuto lang. Ang pagsisimula ang pinakamahirap, at kadalasan gumagaan na kapag nakapagsimula ka na.',
    ],
    identity:
      'Ako si GabAi Assistant, ang iyong kasama sa pag-aaral at productivity. Offline akong gumagana at ang iyong GabAi data lang ang ginagamit ko: tasks, schedule, budget, notes, at focus sessions.',
    bye: (name) => `Paalam, ${name}! Good luck sa pag-aaral mo. Kita-kits!`,
    ack: 'Sige! Sabihin mo lang kung may kailangan ka pa.',
    generalQuestion: [
      'Pasensya, offline ako kaya wala akong impormasyon tungkol diyan. Ang iyong GabAi data at ang aking study tips lang ang kaya kong sagutin.',
      '',
      'Subukang magtanong tungkol sa iyong tasks, schedule, budget, progress, o "Bigyan mo ako ng study tips".',
    ],
  },
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

/** Number of single-letter edits between two words (typo distance). */
function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;

    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = current;
    }
  }

  return row[b.length];
}

/** "dedline" ≈ "deadline", "assigments" ≈ "assignment" (long words only). */
function isTypoOf(word: string, keyword: string): boolean {
  if (keyword.length < 5 || word.length < 4) return false;

  const limit = keyword.length >= 8 ? 2 : 1;

  return (
    editDistance(word, keyword) <= limit ||
    // plural/suffix with a typo, e.g. "assigments" vs "assignment"
    (word.length > keyword.length &&
      editDistance(word.slice(0, keyword.length), keyword) <= limit)
  );
}

/**
 * True when the message mentions any keyword.
 * - phrases ("what should") are matched anywhere
 * - short words ("hi", "ty", "una") must match a whole word
 * - longer words also match their plural/forms ("task" -> "tasks")
 * - with `fuzzy`, small typos are allowed too ("dedline")
 */
function mentions(
  text: string,
  words: string[],
  keywords: string[],
  fuzzy = false,
): boolean {
  return keywords.some((keyword) => {
    if (keyword.includes(' ')) return text.includes(keyword);
    if (keyword.length <= 3) return words.includes(keyword);
    if (words.some((word) => word.startsWith(keyword))) return true;
    return fuzzy && words.some((word) => isTypoOf(word, keyword));
  });
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

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
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

function formatDue(task: PendingTask, t: Texts): string {
  const time = formatTime(task.dueTime);

  let day: string;

  if (task.dueDate === manilaDate(0)) {
    day = t.today;
  } else if (task.dueDate === manilaDate(1)) {
    day = t.tomorrow;
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

/** Whole days from today (Manila) to a YYYY-MM-DD date. */
function daysUntil(dueDate: string): number {
  const today = new Date(`${manilaDate(0)}T00:00:00+08:00`).getTime();
  const due = new Date(`${dueDate}T00:00:00+08:00`).getTime();
  return Math.round((due - today) / DAY_MS);
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

function taskLine(task: PendingTask, t: Texts): string {
  return `${BULLET} ${task.title} (${task.subject}), ${t.due} ${formatDue(task, t)}`;
}

function taskList(tasks: PendingTask[], t: Texts): string {
  const lines = tasks.slice(0, MAX_LIST_ITEMS).map((task) => taskLine(task, t));

  if (tasks.length > MAX_LIST_ITEMS) {
    lines.push(`${BULLET} ${t.more(tasks.length - MAX_LIST_ITEMS)}`);
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

/** A pending task whose title appears in the message, e.g. "Capstone Chapter 3". */
function findMentionedTask(context: AssistantContext, text: string): PendingTask | null {
  const matches = context.pendingTasks
    .filter((task) => {
      const title = normalize(task.title);
      return title.length >= 4 && text.includes(title);
    })
    // Prefer the longest (most specific) title.
    .sort((a, b) => b.title.length - a.title.length);

  return matches[0] ?? null;
}

// ======================================================
// MONEY HELPERS
// ======================================================

/** Which period the user is asking about. Defaults to this month. */
function detectPeriod(has: (keywords: string[]) => boolean): Period {
  if (has(KEYWORDS.periodMonth)) return 'month';
  if (has(KEYWORDS.periodWeek)) return 'week';
  if (has(KEYWORDS.periodToday)) return 'today';
  return 'month';
}

function transactionsIn(context: AssistantContext, period: Period, type: 'income' | 'expense') {
  const from = context.periodStarts[period].getTime();
  return context.recentTransactions.filter(
    (item) => item.type === type && new Date(item.date).getTime() >= from,
  );
}

// ======================================================
// QUICK MATH ("250 + 120", "15% of 800")
// ======================================================

/** Words allowed around a math question, e.g. "what is", "pila ang". */
const MATH_FILLER = [
  'what', 'whats', 'is', 'the', 'answer', 'calculate', 'compute', 'solve', 'equals',
  'equal', 'to', 'please', 'pls', 'unsa', 'unsay', 'pila', 'ang', 'kay', 'ano', 'po',
  'ba', 'mo', 'ko', 'magkano', 'ilan', 'i', 'can', 'you',
];

function formatNumber(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

/** Safe calculator for + - * / and parentheses (no eval). */
function evaluateExpression(expression: string): number | null {
  const tokens = expression.match(/\d+(?:\.\d+)?|[+\-*/()]/g);
  if (!tokens) return null;

  let index = 0;

  const parseFactor = (): number => {
    const token = tokens[index++];

    if (token === '-') return -parseFactor();

    if (token === '(') {
      const value = parseSum();
      if (tokens[index++] !== ')') throw new Error('Missing )');
      return value;
    }

    const value = Number(token);
    if (Number.isNaN(value)) throw new Error('Bad number');
    return value;
  };

  const parseProduct = (): number => {
    let value = parseFactor();

    while (tokens[index] === '*' || tokens[index] === '/') {
      const operator = tokens[index++];
      const right = parseFactor();
      value = operator === '*' ? value * right : value / right;
    }

    return value;
  };

  const parseSum = (): number => {
    let value = parseProduct();

    while (tokens[index] === '+' || tokens[index] === '-') {
      const operator = tokens[index++];
      const right = parseProduct();
      value = operator === '+' ? value + right : value - right;
    }

    return value;
  };

  try {
    const result = parseSum();
    return index === tokens.length ? result : null;
  } catch {
    return null;
  }
}

function answerMath(message: string, t: Texts): string | null {
  const lower = message
    .toLowerCase()
    .replace(/(\d),(\d{3})/g, '$1$2') // 1,000 -> 1000
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/(\d)\s*x\s*(\d)/g, '$1*$2'); // 3 x 4 -> 3*4

  // "15% of 800" / "15% sa 800" / "15% ng 800"
  const percent = /(\d+(?:\.\d+)?)\s*(?:%|percent|porsyento)\s*(?:of|sa|ng)\s*(\d+(?:\.\d+)?)/.exec(lower);

  if (percent) {
    const rate = Number(percent[1]);
    const base = Number(percent[2]);
    return `${formatNumber(rate)}% ${t.percentOf} ${formatNumber(base)} = ${formatNumber((rate / 100) * base)}`;
  }

  // An expression with at least one operator between numbers.
  const match = /\(?\s*-?\d+(?:\.\d+)?(?:\s*[+\-*/]\s*\(?\s*-?\d+(?:\.\d+)?\s*\)?)+\s*\)?/.exec(lower);
  if (!match) return null;

  // Only treat it as math if the rest of the message is filler words
  // (so "Chapter 3-4 deadline" is not calculated).
  const rest = normalize(lower.replace(match[0], ' ')).split(' ').filter(Boolean);
  if (!rest.every((word) => MATH_FILLER.includes(word))) return null;

  const expression = match[0].replace(/\s+/g, '');
  const result = evaluateExpression(expression);

  if (result === null) return null;
  if (!Number.isFinite(result)) return t.mathDivideByZero;

  return `${expression.replace(/([+\-*/])/g, ' $1 ').replace(/\(\s/g, '(').replace(/\s\)/g, ')').trim()} = ${formatNumber(result)}`;
}

// ======================================================
// ANSWERS
// ======================================================

function answerOverdue(context: AssistantContext, t: Texts): string {
  const overdue = sortByUrgency(overdueTasks(context));

  if (overdue.length === 0) return t.overdueNone;

  return t.overdueList(
    t.count(overdue.length, t.words.overdueTask),
    taskList(overdue, t),
    overdue[0].title,
  );
}

function answerDay(context: AssistantContext, offsetDays: 0 | 1, t: Texts): string {
  const label = offsetDays === 0 ? t.today : t.tomorrow;
  const tasks = sortByUrgency(tasksOn(context, manilaDate(offsetDays)));

  if (tasks.length === 0) {
    const tomorrowCount = tasksOn(context, manilaDate(1)).length;
    const extra =
      offsetDays === 0 && tomorrowCount > 0
        ? t.dayTomorrowExtra(t.count(tomorrowCount, t.words.task))
        : '';

    return t.dayNone(label, extra);
  }

  return t.dayList(t.count(tasks.length, t.words.task), label, taskList(tasks, t));
}

function answerWeek(context: AssistantContext, t: Texts): string {
  const today = manilaDate(0);
  const weekEnd = manilaDate(6);

  const tasks = sortByUrgency(
    context.pendingTasks.filter(
      (task) => task.dueDate >= today && task.dueDate <= weekEnd,
    ),
  );

  const overdueCount = overdueTasks(context).length;
  const note =
    overdueCount > 0 ? t.weekOverdueNote(t.count(overdueCount, t.words.overdueTask)) : '';

  if (tasks.length === 0) return t.weekNone(note);

  return t.weekList(t.count(tasks.length, t.words.task), taskList(tasks, t), note);
}

function answerNext(context: AssistantContext, t: Texts): string {
  const ordered = sortByUrgency(context.pendingTasks);

  if (ordered.length === 0) return t.nextNone;

  const [first, ...rest] = ordered;
  const when = first.dueDate < manilaDate(0) ? t.nextOverdue : t.nextDue(formatDue(first, t));

  let reply = t.nextFirst(first.title, first.subject, when, first.priority);

  if (rest.length > 0) {
    reply += `\n\n${t.upNext}\n${rest
      .slice(0, 2)
      .map((task) => taskLine(task, t))
      .join('\n')}`;
  }

  return reply;
}

function answerProgress(context: AssistantContext, t: Texts): string {
  const done = context.completedTaskCount;
  const pending = context.pendingTasks.length;
  const total = done + pending;

  if (total === 0) return t.progressNone;

  const rate = Math.round((done / total) * 100);
  const tail =
    pending > 0
      ? t.progressRemaining(t.count(pending, t.words.task))
      : t.progressAllDone;

  return t.progress(done, total, rate, tail);
}

function answerStats(context: AssistantContext, t: Texts): string {
  const done = context.completedTaskCount;
  const pending = context.pendingTasks.length;
  const total = done + pending;
  const rate = total > 0 ? Math.round((done / total) * 100) : 0;

  const weekStart = context.periodStarts.week.getTime();
  const focusThisWeek = context.focusSessions.filter(
    (session) => session.createdAt.getTime() >= weekStart,
  ).length;

  const overdueCount = overdueTasks(context).length;
  const dueToday = tasksOn(context, manilaDate(0)).length;

  const lines = [
    t.statsTitle,
    '',
    `${BULLET} ${t.statsCompletion}: ${done} ${t.of} ${total} (${rate}%)`,
    `${BULLET} ${t.statsPending}: ${pending}`,
    `${BULLET} ${t.statsDueToday}: ${dueToday}`,
    `${BULLET} ${t.statsOverdue}: ${overdueCount}`,
    `${BULLET} ${t.statsFocus}: ${focusThisWeek}`,
  ];

  if (overdueCount > 0) {
    lines.push('', t.statsTipOverdue);
  } else if (pending === 0 && total > 0) {
    lines.push('', t.statsTipDone);
  }

  return lines.join('\n');
}

function answerTasks(context: AssistantContext, t: Texts): string {
  const pending = sortByUrgency(context.pendingTasks);

  if (pending.length === 0) return t.tasksNone;

  const overdueCount = overdueTasks(context).length;
  const todayCount = tasksOn(context, manilaDate(0)).length;

  const summary = [
    t.tasksHave(t.count(pending.length, t.words.pendingTask)),
    overdueCount > 0 ? t.tasksOverdue(overdueCount) : null,
    todayCount > 0 ? t.tasksToday(todayCount) : null,
  ]
    .filter(Boolean)
    .join(', ');

  return `${summary}:\n\n${taskList(pending, t)}`;
}

function answerTaskInfo(task: PendingTask, t: Texts): string {
  const days = daysUntil(task.dueDate);

  const status =
    days < 0
      ? t.taskOverdueBy(-days)
      : days === 0
        ? t.taskDueToday
        : days === 1
          ? t.taskDueTomorrow
          : t.taskDueIn(days);

  return t.taskInfo(task.title, task.subject, formatDue(task, t), status, task.priority);
}

function answerExpenses(context: AssistantContext, period: Period, t: Texts): string {
  const label = t.period[period];
  const expenses = transactionsIn(context, period, 'expense');

  if (expenses.length === 0) return t.expensesNone(label);

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  const byCategory = new Map<string, number>();
  for (const item of expenses) {
    byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + item.amount);
  }

  const topCategories = [...byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, amount]) => `${BULLET} ${category}: ${peso(amount)}`)
    .join('\n');

  return t.expenses(
    peso(total),
    label,
    t.count(expenses.length, t.words.expense),
    topCategories,
  );
}

function answerIncome(context: AssistantContext, period: Period, t: Texts): string {
  const income = transactionsIn(context, period, 'income').reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  return t.income(peso(income), t.period[period], peso(context.wallet.totalIncome));
}

function answerBudget(context: AssistantContext, t: Texts): string {
  const { balance, totalIncome, totalExpenses } = context.wallet;

  if (totalIncome === 0 && totalExpenses === 0) return t.budgetNone;

  return t.budget(peso(balance), peso(totalIncome), peso(totalExpenses));
}

function answerSubjects(context: AssistantContext, t: Texts): string {
  if (context.subjects.length === 0) return t.subjectsNone;

  const lines = context.subjects.map((subject) => {
    const pending = context.pendingTasks.filter((task) => task.subject === subject.name).length;
    return `${BULLET} ${subject.name}${
      pending > 0 ? ` (${t.count(pending, t.words.pendingTask)})` : ''
    }`;
  });

  return `${t.subjectsTitle}\n\n${lines.join('\n')}`;
}

function answerFocus(context: AssistantContext, t: Texts): string {
  if (context.focusSessions.length === 0) return t.focusNone;

  const weekAgo = Date.now() - 7 * DAY_MS;
  const thisWeek = context.focusSessions.filter(
    (session) => session.createdAt.getTime() >= weekAgo,
  );

  const last = context.focusSessions[0];

  return t.focus(t.count(thisWeek.length, t.words.focusSession), last.subject ?? 'General');
}

function answerNotes(context: AssistantContext, t: Texts): string {
  if (context.noteCount === 0) return t.notesNone;

  const recent = context.recentNotes
    .slice(0, 3)
    .map((note) => `${BULLET} ${note.title} (${note.category})${note.isPinned ? t.pinned : ''}`)
    .join('\n');

  return t.notes(t.count(context.noteCount, t.words.note), recent);
}

function answerFeelings(context: AssistantContext, t: Texts): string {
  const name = firstName(context);
  const ordered = sortByUrgency(context.pendingTasks);

  if (ordered.length === 0) return t.feelingsNoTasks(name);

  return t.feelingsWithTasks(
    name,
    t.count(ordered.length, t.words.pendingTask),
    ordered[0].title,
  );
}

function answerDateTime(t: Texts): string {
  const now = new Date();

  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
  }).format(now);

  return t.dateTime(date, time);
}

function answerGreeting(context: AssistantContext, t: Texts): string {
  const todayCount = tasksOn(context, manilaDate(0)).length;
  const overdueCount = overdueTasks(context).length;

  const parts = [
    todayCount > 0 ? t.greetingDueToday(t.count(todayCount, t.words.task)) : null,
    overdueCount > 0 ? t.greetingOverdue(overdueCount) : null,
  ].filter((part): part is string => Boolean(part));

  const status = parts.length === 0 ? t.greetingNothing : t.greetingStatus(parts);

  return t.greeting(firstName(context), status);
}

/** Removes leftover Markdown markers so replies display as clean text. */
function cleanReply(text: string): string {
  return text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*\*/g, '');
}

// ======================================================
// INTENT MATCHING (first match wins, so order matters)
// ======================================================

function answer(message: string, context: AssistantContext): string {
  const text = normalize(message);
  const words = text.split(' ').filter(Boolean);
  const has = (keywords: string[]) => mentions(text, words, keywords);
  /** Same as `has`, but also accepts small typos ("dedline"). */
  const hasLoose = (keywords: string[]) => mentions(text, words, keywords, true);

  const t = TEXT[detectLanguage(words)];

  // 1. Safety always comes first.
  if (has(KEYWORDS.crisis)) return t.crisis;

  // 2. Quick math: "250 + 120", "15% of 800"
  const math = answerMath(message, t);
  if (math) return math;

  // 3. Feelings and stress
  if (has(KEYWORDS.feelings)) return answerFeelings(context, t);

  // 4. "How do I ...?" questions about the app
  if (has(KEYWORDS.howTo)) {
    const feature = FEATURE_KEYWORDS.find(([, keywords]) => hasLoose(keywords));
    if (feature) return t.howTo[feature[0]];
  }

  // 5. A specific task by name: "When is Capstone Chapter 3 due?"
  const mentionedTask = findMentionedTask(context, text);
  if (mentionedTask) return answerTaskInfo(mentionedTask, t);

  // 6. Date and time
  if (has(KEYWORDS.dateTime)) return answerDateTime(t);

  // 7. About the assistant, help, and study tips
  if (has(KEYWORDS.identity)) return t.identity;
  if (has(KEYWORDS.tips)) return pickRandom(t.tips);
  if (has(KEYWORDS.help)) return t.help.join('\n');

  // "karong semanaha" / "ngayong linggo" mean this WEEK, not today.
  const asksAboutWeek = has(KEYWORDS.periodWeek);

  // 8. Money
  if (hasLoose(KEYWORDS.expense)) return answerExpenses(context, detectPeriod(has), t);
  if (hasLoose(KEYWORDS.income)) return answerIncome(context, detectPeriod(has), t);
  if (hasLoose(KEYWORDS.budget)) return answerBudget(context, t);

  // 9. Overview
  if (hasLoose(KEYWORDS.stats)) return answerStats(context, t);

  // 10. Other features
  if (hasLoose(KEYWORDS.focus)) return answerFocus(context, t);
  if (hasLoose(KEYWORDS.notes)) return answerNotes(context, t);
  if (hasLoose(KEYWORDS.subjects)) return answerSubjects(context, t);

  // 11. Tasks and schedule
  if (hasLoose(KEYWORDS.overdue)) return answerOverdue(context, t);
  if (has(KEYWORDS.next)) return answerNext(context, t);
  if (hasLoose(KEYWORDS.tomorrow)) return answerDay(context, 1, t);
  if (hasLoose(KEYWORDS.today) && !asksAboutWeek) return answerDay(context, 0, t);
  if (hasLoose(KEYWORDS.week)) return answerWeek(context, t);
  if (has(KEYWORDS.completed)) return answerProgress(context, t);
  if (hasLoose(KEYWORDS.tasks)) return answerTasks(context, t);

  // 12. Small talk
  if (has(KEYWORDS.bye)) return t.bye(firstName(context));
  if (has(KEYWORDS.greeting)) return answerGreeting(context, t);
  if (has(KEYWORDS.thanks)) return t.thanks(firstName(context));
  if (words.length <= 3 && has(KEYWORDS.ack)) return t.ack;

  // 13. A general-knowledge question we can't answer offline
  if (has(KEYWORDS.questionWords) || message.trim().endsWith('?')) {
    return t.generalQuestion.join('\n');
  }

  return t.fallback.join('\n');
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

    // Safety first: messages about self-harm always get the fixed, tested
    // crisis reply with hotlines (never left to the AI).
    const words = normalize(message).split(' ').filter(Boolean);
    const isCrisis = mentions(normalize(message), words, KEYWORDS.crisis);

    // Gab (Gemini) answers when it is set up; otherwise, or if it fails,
    // the built-in offline assistant answers so the chat never breaks.
    if (!isCrisis && isGabAiEnabled()) {
      try {
        const reply = await askGab(message, cleanHistory(data?.history), context);
        return { reply, source: 'gemini' };
      } catch (error) {
        console.error('[Gab] Gemini failed, using offline answers:', (error as Error)?.message ?? error);
      }
    }

    return { reply: cleanReply(answer(message, context)), source: 'offline' };
  }

  async reset(): Promise<{ message: string }> {
    // Conversations are not saved on the server; the app clears its own messages.
    return {
      message: 'Assistant conversation reset successfully.',
    };
  }
}

export const assistantService = new AssistantService();