import React, { useState } from 'react';
import type { ChatSettings } from '../types/chat';

interface ChatSettingsModalProps {
  show: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({ show, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<ChatSettings>(settings);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings({
      use_rag: true,
      rag_k: 5,
      rag_threshold: 0.7
    });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-gear me-2"></i>
              Chat Settings
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-4">
              <h6 className="mb-3">RAG (Retrieval-Augmented Generation) Settings</h6>
              
              <div className="form-check form-switch mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="useRag"
                  checked={localSettings.use_rag}
                  onChange={(e) => setLocalSettings({ ...localSettings, use_rag: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="useRag">
                  Enable RAG for Knowledge Base Search
                </label>
                <small className="form-text text-muted d-block">
                  When enabled, the AI will search your indexed documents before answering
                </small>
              </div>

              {localSettings.use_rag && (
                <div className="ms-3">
                  <div className="mb-3">
                    <label htmlFor="ragK" className="form-label">Number of Results (k)</label>
                    <input
                      type="number"
                      className="form-control"
                      id="ragK"
                      value={localSettings.rag_k}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        rag_k: Math.max(1, Math.min(20, parseInt(e.target.value) || 5))
                      })}
                      min="1"
                      max="20"
                    />
                    <small className="form-text text-muted">
                      Number of document chunks to retrieve (1-20)
                    </small>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="ragThreshold" className="form-label">
                      Similarity Threshold ({(localSettings.rag_threshold * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      className="form-range"
                      id="ragThreshold"
                      value={localSettings.rag_threshold}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        rag_threshold: parseFloat(e.target.value)
                      })}
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">0% (All)</small>
                      <small className="text-muted">50%</small>
                      <small className="text-muted">100% (Exact)</small>
                    </div>
                    <small className="form-text text-muted">
                      Minimum similarity score for retrieved documents
                    </small>
                  </div>

                  <div className="alert alert-info" role="alert">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Current Settings:</strong><br/>
                    Retrieve top {localSettings.rag_k} documents with {(localSettings.rag_threshold * 100).toFixed(0)}%+ similarity
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3">
              <h6 className="mb-2">Presets</h6>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setLocalSettings({ use_rag: true, rag_k: 3, rag_threshold: 0.8 })}
                >
                  <small>Precise<br/>(Top 3, 80%+)</small>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setLocalSettings({ use_rag: true, rag_k: 5, rag_threshold: 0.7 })}
                >
                  <small>Balanced<br/>(Top 5, 70%+)</small>
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setLocalSettings({ use_rag: true, rag_k: 10, rag_threshold: 0.5 })}
                >
                  <small>Broad<br/>(Top 10, 50%+)</small>
                </button>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-link" onClick={handleReset}>
              Reset to Defaults
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatSettingsModal;