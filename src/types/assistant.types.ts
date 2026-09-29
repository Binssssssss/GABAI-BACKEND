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
}

export interface AssistantResetResponse {
  message: string;
}