export interface ToolCall {
  index?: number;
  name?: string;
  args?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Source[];
  toolCalls?: ToolCall[];
}

export interface StreamEvent {
  messages?: Array<{
    role?: string;
    content?: string;
    type?: string;
    additional_kwargs?: Record<string, unknown>;
  }>;
  [key: string]: unknown;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string; // Changed from number to string to match SQLite timestamp
}

export interface Source {
  page: number;
}
