import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column vh-100">
      <nav className="navbar navbar-dark bg-primary flex-shrink-0">
        <div className="container-fluid">
          <span 
            className="navbar-brand mb-0 h1" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            Chat UI
          </span>
          <div className="d-flex align-items-center">
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
                  <button className="dropdown-item" onClick={() => navigate('/')}>
                    💬 Chat
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => navigate('/documents')}>
                    📚 Knowledge Base
                  </button>
                </li>
                <li><hr className="dropdown-divider" /></li>
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
      
      <div className="flex-grow-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;