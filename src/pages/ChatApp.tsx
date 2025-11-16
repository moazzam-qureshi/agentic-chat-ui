import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

function ChatApp() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const apiBaseUrl = "http://localhost:8000";

  const generateNewThreadId = () => {
    return `thread-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
    setKey(prev => prev + 1);
  };

  const handleNewChat = () => {
    const newThreadId = generateNewThreadId();
    setCurrentThreadId(newThreadId);
    setKey(prev => prev + 1);
  };

  useEffect(() => {
    if (!currentThreadId) {
      handleNewChat();
    }
  }, []);

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        <div className="col-md-3 col-lg-3 h-100">
          <Sidebar
            currentThreadId={currentThreadId}
            onThreadSelect={handleThreadSelect}
            onNewChat={handleNewChat}
            apiBaseUrl={apiBaseUrl}
            userId={user?.id || 'default-user'}
          />
        </div>
        
        <div className="col-md-9 col-lg-9 h-100 d-flex flex-column">
          <nav className="navbar navbar-dark bg-primary flex-shrink-0">
            <div className="container-fluid">
              <span className="navbar-brand mb-0 h1">Chat UI</span>
              <div className="d-flex align-items-center">
                {currentThreadId && (
                  <span className="text-white small me-3">
                    Thread: {currentThreadId.substring(0, 8)}...
                  </span>
                )}
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-light btn-sm dropdown-toggle" 
                    type="button" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    {user?.username || 'User'}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <span className="dropdown-item-text">
                        <small className="text-muted">Signed in as</small><br />
                        <strong>{user?.email}</strong>
                      </span>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={() => navigate('/documents')}>
                        📚 Knowledge Base
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item" onClick={logout}>
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </nav>
          
          <div className="flex-grow-1 overflow-hidden position-relative">
            {currentThreadId && (
              <ChatWindow 
                key={key}
                threadId={currentThreadId} 
                apiBaseUrl={apiBaseUrl}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatApp;