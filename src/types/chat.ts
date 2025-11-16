export interface ChatMessage {
  id: string;
  type: "human" | "ai";
  content: string;
}

export interface SessionResponse {
  thread_id: string;
  messages: ChatMessage[];
}

export interface StreamRequest {
  thread_id: string;
  message: string;
  use_rag?: boolean;
  rag_k?: number;
  rag_threshold?: number;
}

export interface ChatSettings {
  use_rag: boolean;
  rag_k: number;
  rag_threshold: number;
}

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ThreadCreate {
  title: string;
  metadata?: Record<string, any>;
}

export interface ThreadUpdate {
  title?: string;
  metadata?: Record<string, any>;
}