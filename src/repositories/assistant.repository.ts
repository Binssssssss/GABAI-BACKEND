import { prisma } from '../lib/prisma';

/** First moment of this month in Philippine time (UTC+8). */
function startOfMonthManila(): Date {
  const yearMonth = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date()); // e.g. "2026-10"

  return new Date(`${yearMonth}-01T00:00:00+08:00`);
}

/** Start of a Manila calendar day, offset from today. */
function startOfDayManila(offsetDays = 0): Date {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(
    new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000),
  ); // e.g. "2026-10-13"

  return new Date(`${day}T00:00:00+08:00`);
}

/** Monday 00:00 of the current week in Philippine time. */
function startOfWeekManila(): Date {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
  }).format(new Date());

  const daysSinceMonday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday);

  return startOfDayManila(-Math.max(daysSinceMonday, 0));
}

export class AssistantRepository {
  async getUserContext(userId: string) {
    const periodStarts = {
      today: startOfDayManila(0),
      week: startOfWeekManila(),
      month: startOfMonthManila(),
    };

    // Early in the month, this week can start in the previous month.
    const earliest =
      periodStarts.week < periodStarts.month ? periodStarts.week : periodStarts.month;

    const [
      user,
      pendingTasks,
      completedTaskCount,
      subjects,
      focusSessions,
      noteCount,
      recentNotes,
      monthTransactions,
      walletTotals,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true },
      }),

      // Unfinished tasks, soonest due date first
      prisma.task.findMany({
        where: { userId, completed: false },
        orderBy: [{ dueDate: 'asc' }, { dueTime: 'asc' }],
        take: 50,
        select: {
          title: true,
          subject: true,
          priority: true,
          dueDate: true,
          dueTime: true,
        },
      }),

      prisma.task.count({
        where: { userId, completed: true },
      }),

      prisma.subject.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
        select: { name: true },
      }),

      prisma.focusSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { subject: true, status: true, createdAt: true },
      }),

      prisma.note.count({
        where: { userId, isArchived: false },
      }),

      prisma.note.findMany({
        where: { userId, isArchived: false },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { title: true, category: true, isPinned: true },
      }),

      // This month's and this week's transactions (for "how much did I spend")
      prisma.transaction.findMany({
        where: { userId, date: { gte: earliest } },
        orderBy: { date: 'desc' },
        select: {
          title: true,
          amount: true,
          type: true,
          category: true,
          date: true,
        },
      }),

      // All-time totals (for the balance)
      prisma.transaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
      }),
    ]);

    const sumFor = (type: string) =>
      walletTotals.find((row) => row.type === type)?._sum.amount ?? 0;

    const totalIncome = sumFor('income');
    const totalExpenses = sumFor('expense');

    return {
      userName: user?.fullName ?? 'Student',
      pendingTasks,
      completedTaskCount,
      subjects,
      focusSessions,
      noteCount,
      recentNotes,
      recentTransactions: monthTransactions,
      periodStarts,
      wallet: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      },
    };
  }
}

export const assistantRepository = new AssistantRepository();

export type AssistantContext = Awaited<
  ReturnType<AssistantRepository['getUserContext']>
>;