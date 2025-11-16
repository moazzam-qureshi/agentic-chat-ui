import React from 'react';
import type { ChatMessage } from '../types/chat.ts';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isHuman = message.type === 'human';
  
  return (
    <div className={`d-flex mb-3 ${isHuman ? 'justify-content-end' : 'justify-content-start'}`}>
      <div 
        className={`card p-3 ${isHuman ? 'bg-primary text-white' : 'bg-light'}`}
        style={{ maxWidth: '70%', borderRadius: '15px' }}
      >
        <div className="card-body p-0">
          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;