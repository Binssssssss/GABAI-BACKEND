import {
  AssistantChatRequest,
  AssistantChatResponse,
} from '../types/assistant.types';

import { assistantRepository } from '../repositories/assistant.repository';

export class AssistantService {
  async chat(
    userId: string,
    data: AssistantChatRequest,
  ): Promise<AssistantChatResponse> {
    const message = data.message.trim();

    if (!message) {
      throw new Error('Message is required');
    }

    const context = await assistantRepository.getUserContext(userId);

    /*
     * Local/rule-based assistant for now.
     *
     * Later, this is the location where you can connect
     * your actual AI provider or AI engine.
     */

    const lowerMessage = message.toLowerCase();

    let reply =
      "I'm here to help you organize your tasks, schedule, focus sessions, and productivity.";

    if (
      lowerMessage.includes('task') ||
      lowerMessage.includes('assignment')
    ) {
      const pendingTasks = context.tasks.filter(
        (task) => !task.completed,
      );

      reply =
        pendingTasks.length > 0
          ? `You currently have ${pendingTasks.length} pending task${
              pendingTasks.length === 1 ? '' : 's'
            }. I can help you prioritize them.`
          : 'You currently have no pending tasks. Nice work!';
    } else if (
      lowerMessage.includes('subject') ||
      lowerMessage.includes('class')
    ) {
      reply =
        context.subjects.length > 0
          ? `You currently have ${context.subjects.length} subject${
              context.subjects.length === 1 ? '' : 's'
            } registered.`
          : 'You do not have any subjects registered yet.';
    } else if (
      lowerMessage.includes('focus') ||
      lowerMessage.includes('study')
    ) {
      reply =
        'You can start a focus session to work on one task without distractions.';
    } else if (
      lowerMessage.includes('schedule') ||
      lowerMessage.includes('calendar')
    ) {
      reply =
        'I can help you organize your tasks and deadlines into a manageable schedule.';
    }

    return {
      reply,
    };
  }

  async reset(): Promise<{ message: string }> {
    /*
     * No database records are deleted because the current
     * assistant implementation does not persist conversations.
     *
     * The frontend should clear its local message state.
     */

    return {
      message: 'Assistant conversation reset successfully.',
    };
  }
}

export const assistantService = new AssistantService();