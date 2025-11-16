import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="d-flex justify-content-start mb-3">
      <div 
        className="card p-3 bg-light"
        style={{ maxWidth: '70%', borderRadius: '15px' }}
      >
        <div className="card-body p-0">
          <div className="typing-indicator d-flex align-items-center">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;