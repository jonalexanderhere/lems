export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIConfig = {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
};

export type AIResponse = {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    reasoningTokens?: number;
  };
};

export type AIStreamChunk = {
  content?: string;
  usage?: any;
};
