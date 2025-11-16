import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble.tsx';
import ChatInput from './ChatInput.tsx';
import ChatSettingsModal from './ChatSettingsModal.tsx';
import TypingIndicator from './TypingIndicator.tsx';
import type { ChatMessage, SessionResponse, StreamRequest, ChatSettings } from '../types/chat.ts';
import AuthService from '../services/auth.service';

interface ChatWindowProps {
  threadId: string;
  apiBaseUrl?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ 
  threadId, 
  apiBaseUrl = 'http://localhost:8000' 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings>({
    use_rag: true,
    rag_k: 5,
    rag_threshold: 0.7
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchSessionHistory();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [threadId]);

  const fetchSessionHistory = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/session/${threadId}`, {
        headers: {
          ...AuthService.getAuthHeader()
        }
      });
      if (response.ok) {
        const data: SessionResponse = await response.json();
        // Ensure each message has a unique ID
        // Messages are returned from backend in the correct order (oldest to newest)
        const messagesWithUniqueIds = data.messages.map((msg, index) => ({
          ...msg,
          id: msg.id || generateMessageId() + `-${index}`
        }));
        setMessages(messagesWithUniqueIds);
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  const generateMessageId = () => {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      type: 'human',
      content
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setIsWaitingForResponse(true);

    const aiMessageId = generateMessageId();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      type: 'ai',
      content: ''
    };
    setMessages(prev => [...prev, aiMessage]);

    try {
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const requestData: StreamRequest = {
        thread_id: threadId,
        message: content,
        use_rag: chatSettings.use_rag,
        rag_k: chatSettings.rag_k,
        rag_threshold: chatSettings.rag_threshold
      };

      const response = await fetch(`${apiBaseUrl}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(requestData),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              // Stop showing typing indicator as soon as we get data
              setIsWaitingForResponse(false);
              
              try {
                const chunk = JSON.parse(data);
                // Only append if there's actual content and not a finish event
                if (chunk.content && !chunk.metadata?.finish_reason) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessageId 
                        ? { ...msg, content: msg.content + chunk.content }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // If it's not JSON, treat it as plain text (backwards compatibility)
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === aiMessageId 
                      ? { ...msg, content: msg.content + data }
                      : msg
                  )
                );
              }
            }
          }
        }
      }

      setIsStreaming(false);
      setIsWaitingForResponse(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      setIsWaitingForResponse(false);
    }
  };

  return (
    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column">
      {/* Chat Header Bar */}
      <div className="border-bottom bg-light px-3 py-2 d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          {chatSettings.use_rag && (
            <span className="badge bg-success">
              <i className="bi bi-database me-1"></i>
              RAG Enabled
            </span>
          )}
          {!chatSettings.use_rag && (
            <span className="badge bg-secondary">
              <i className="bi bi-database me-1"></i>
              RAG Disabled
            </span>
          )}
        </div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setShowSettings(true)}
          title="Chat Settings"
        >
          <i className="bi bi-gear"></i>
        </button>
      </div>
      
      <div className="flex-grow-1 overflow-auto p-3" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="text-center text-muted py-5">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isWaitingForResponse && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-top bg-white" style={{ flexShrink: 0 }}>
        <ChatInput onSendMessage={handleSendMessage} disabled={isStreaming} />
      </div>
      
      {/* Settings Modal */}
      <ChatSettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        settings={chatSettings}
        onSave={setChatSettings}
      />
    </div>
  );
};

export default ChatWindow;