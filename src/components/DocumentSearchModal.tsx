import React, { useState } from 'react';
import DocumentService from '../services/document.service';
import type { DocumentSearchResult } from '../types/document';

interface DocumentSearchModalProps {
  show: boolean;
  onClose: () => void;
}

const DocumentSearchModal: React.FC<DocumentSearchModalProps> = ({ show, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocumentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchParams, setSearchParams] = useState({
    k: 10,
    score_threshold: 0.5,
    document_ids: [] as string[]
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setSearching(true);
      setError('');
      const response = await DocumentService.searchDocuments({
        query: query.trim(),
        k: searchParams.k,
        score_threshold: searchParams.score_threshold,
        document_ids: searchParams.document_ids.length > 0 ? searchParams.document_ids : undefined
      });
      setResults(response.results);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const toggleExpanded = (chunkId: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(chunkId)) {
      newExpanded.delete(chunkId);
    } else {
      newExpanded.add(chunkId);
    }
    setExpanded(newExpanded);
  };

  const highlightQuery = (text: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.trim().toLowerCase() 
        ? <mark key={index} className="bg-warning">{part}</mark>
        : part
    );
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content" style={{ maxHeight: '90vh' }}>
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-search me-2"></i>
              Search Knowledge Base
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask a question or search for information..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={searching || !query.trim()}
                >
                  {searching ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-search me-2"></i>
                      Search
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Advanced Options */}
            <div className="mb-3">
              <button
                className="btn btn-link btn-sm p-0"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'} me-1`}></i>
                Advanced Options
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small">Number of Results (k)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={searchParams.k}
                        onChange={(e) => setSearchParams({
                          ...searchParams,
                          k: Math.max(1, Math.min(100, parseInt(e.target.value) || 10))
                        })}
                        min="1"
                        max="100"
                      />
                      <small className="text-muted">Maximum number of results to return (1-100)</small>
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label small">Similarity Threshold</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={searchParams.score_threshold}
                        onChange={(e) => setSearchParams({
                          ...searchParams,
                          score_threshold: Math.max(0, Math.min(1, parseFloat(e.target.value) || 0.5))
                        })}
                        min="0"
                        max="1"
                        step="0.1"
                      />
                      <small className="text-muted">Minimum similarity score (0-1)</small>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="form-label small">Quick Presets</label>
                    <div className="btn-group btn-group-sm w-100" role="group">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchParams({ k: 5, score_threshold: 0.7, document_ids: [] })}
                      >
                        Precise (Top 5, 70%+)
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchParams({ k: 10, score_threshold: 0.5, document_ids: [] })}
                      >
                        Balanced (Top 10, 50%+)
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setSearchParams({ k: 20, score_threshold: 0.3, document_ids: [] })}
                      >
                        Broad (Top 20, 30%+)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {results.length > 0 ? (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="mb-0">Search Results ({results.length})</h6>
                    <small className="text-muted">
                      Showing top {Math.min(results.length, searchParams.k)} results 
                      with similarity ≥ {(searchParams.score_threshold * 100).toFixed(0)}%
                    </small>
                  </div>
                  <small className="text-muted">Sorted by relevance</small>
                </div>
                
                <div className="list-group">
                  {results.map((result) => (
                    <div key={result.chunk_id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">
                            📄 {result.filename}
                            <span className="badge bg-primary ms-2">
                              {(result.similarity_score * 100).toFixed(0)}% match
                            </span>
                          </h6>
                          
                          <div className="text-muted small mb-2">
                            Chunk {result.chunk_index + 1}
                          </div>
                          
                          <div 
                            className={`${expanded.has(result.chunk_id) ? '' : 'text-truncate'}`}
                            style={{ maxHeight: expanded.has(result.chunk_id) ? 'none' : '100px', overflow: 'hidden' }}
                          >
                            <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                              {highlightQuery(result.chunk_text)}
                            </p>
                          </div>
                          
                          {result.chunk_text.length > 200 && (
                            <button
                              className="btn btn-link btn-sm p-0 mt-1"
                              onClick={() => toggleExpanded(result.chunk_id)}
                            >
                              {expanded.has(result.chunk_id) ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : query && !searching && !error ? (
              <div className="text-center py-5">
                <i className="bi bi-search display-1 text-muted"></i>
                <p className="text-muted mt-3">No results found</p>
              </div>
            ) : !query && (
              <div className="text-center py-5">
                <i className="bi bi-lightbulb display-1 text-muted"></i>
                <p className="text-muted mt-3">
                  Search your documents using natural language queries
                </p>
                <small className="text-muted">
                  Example: "How to configure authentication?" or "API endpoints documentation"
                </small>
              </div>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearchModal;