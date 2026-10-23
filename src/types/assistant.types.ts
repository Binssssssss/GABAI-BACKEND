export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatRequest {
  message: string;
  history?: AssistantMessage[];
}

export interface AssistantChatResponse {
  reply: string;
  /** 'gemini' = answered by Gab (Gemini); 'offline' = built-in answers. */
  source?: 'gemini' | 'offline';
}

export interface AssistantResetResponse {
  message: string;
}