import React, { useState, useEffect } from 'react';
import type { Thread, ThreadCreate } from '../types/chat';
import AuthService from '../services/auth.service';

interface SidebarProps {
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  onNewChat: () => void;
  apiBaseUrl?: string;
  userId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentThreadId,
  onThreadSelect,
  onNewChat,
  apiBaseUrl = 'http://localhost:8000',
  userId = 'default-user'
}) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/threads`, {
        headers: {
          'X-User-ID': userId,
          ...AuthService.getAuthHeader()
        }
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewThread = async () => {
    try {
      const threadData: ThreadCreate = {
        title: 'New Chat',
        metadata: {}
      };

      const response = await fetch(`${apiBaseUrl}/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...AuthService.getAuthHeader()
        },
        body: JSON.stringify(threadData)
      });

      if (response.ok) {
        const newThread: Thread = await response.json();
        setThreads(prev => [newThread, ...prev]);
        onThreadSelect(newThread.id);
      }
    } catch (error) {
      console.error('Error creating thread:', error);
    }
  };

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this chat?')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'X-User-ID': userId,
          ...AuthService.getAuthHeader()
        }
      });

      if (response.ok) {
        setThreads(prev => prev.filter(t => t.id !== threadId));
        if (currentThreadId === threadId) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-light border-end">
      <div className="p-3">
        <button 
          className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
          onClick={createNewThread}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="me-2">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          New Chat
        </button>
      </div>
      
      <div className="flex-grow-1 overflow-auto">
        {isLoading ? (
          <div className="text-center p-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center p-3 text-muted">
            <small>No conversations yet</small>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {threads.map(thread => (
              <button
                key={thread.id}
                className={`list-group-item list-group-item-action border-0 d-flex justify-content-between align-items-center ${
                  currentThreadId === thread.id ? 'active' : ''
                }`}
                onClick={() => onThreadSelect(thread.id)}
              >
                <div className="text-start flex-grow-1 me-2" style={{ overflow: 'hidden' }}>
                  <div className="text-truncate" style={{ fontSize: '14px' }}>
                    {thread.title === 'New Chat' ? thread.id : thread.title}
                  </div>
                  <small className={currentThreadId === thread.id ? 'text-light' : 'text-muted'}>
                    {formatDate(thread.created_at)}
                  </small>
                </div>
                <button
                  className={`btn btn-sm ${currentThreadId === thread.id ? 'btn-light' : 'btn-outline-secondary'} p-1`}
                  onClick={(e) => deleteThread(thread.id, e)}
                  style={{ width: '28px', height: '28px' }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                </button>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;