import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/AppLayout';
import DocumentSearchModal from '../components/DocumentSearchModal';
import DocumentService from '../services/document.service';
import type { Document } from '../types/document';
import { 
  formatFileSize, 
  getFileIcon, 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE,
  IngestionStatus,
  getIngestionStatusIcon,
  getIngestionStatusText
} from '../types/document';

type ViewMode = 'list' | 'grid';
type SortField = 'filename' | 'created_at' | 'file_size';
type SortOrder = 'asc' | 'desc';

const Documents: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [error, setError] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [processingDocs, setProcessingDocs] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ingestionCheckInterval = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    fetchDocuments();
    // Check ingestion status for processing documents
    startIngestionStatusCheck();
    
    return () => {
      if (ingestionCheckInterval.current) {
        clearInterval(ingestionCheckInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Filter documents based on search query
    const filtered = documents.filter(doc => 
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort documents
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'filename') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredDocuments(sorted);
  }, [documents, searchQuery, sortField, sortOrder]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      // Fetch documents with pagination support
      let allDocuments: Document[] = [];
      let page = 0;
      const pageSize = 100; // Max allowed by backend
      let hasMore = true;

      while (hasMore) {
        const response = await DocumentService.getDocuments(page * pageSize, pageSize);
        allDocuments = [...allDocuments, ...response.documents];
        hasMore = response.documents.length === pageSize;
        page++;
      }

      setDocuments(allDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const isAllowedType = Object.keys(ALLOWED_FILE_TYPES).includes(file.type) ||
                         Object.values(ALLOWED_FILE_TYPES).some(ext => file.name.endsWith(ext));
    
    if (!isAllowedType) {
      setError('Invalid file type. Allowed types: PDF, TXT, MD, DOC, DOCX');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }

    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      setError('');
      await DocumentService.uploadDocument(file);
      fetchDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setError('');
      await DocumentService.deleteDocument(documentId);
      setSelectedDocIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
      if (selectedDoc?.id === documentId) {
        setSelectedDoc(null);
        setShowDetails(false);
      }
      fetchDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDocIds.size === 0) return;
    
    const count = selectedDocIds.size;
    if (!confirm(`Are you sure you want to delete ${count} document${count > 1 ? 's' : ''}?`)) return;

    try {
      setError('');
      for (const docId of selectedDocIds) {
        await DocumentService.deleteDocument(docId);
      }
      setSelectedDocIds(new Set());
      fetchDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bulk delete failed');
    }
  };

  const handleDownload = async (documentId: string) => {
    try {
      await DocumentService.downloadDocument(documentId);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download document');
    }
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleDocClick = (doc: Document) => {
    setSelectedDoc(doc);
    setShowDetails(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startIngestionStatusCheck = () => {
    // Check every 5 seconds for processing documents
    if (ingestionCheckInterval.current) {
      clearInterval(ingestionCheckInterval.current);
    }
    
    ingestionCheckInterval.current = setInterval(() => {
      checkProcessingDocuments();
    }, 5000);
  };

  const checkProcessingDocuments = async () => {
    const docsToCheck = documents.filter(doc => 
      doc.ingestion_status === IngestionStatus.PROCESSING || processingDocs.has(doc.id)
    );
    
    if (docsToCheck.length === 0 && ingestionCheckInterval.current) {
      clearInterval(ingestionCheckInterval.current);
      ingestionCheckInterval.current = null;
      return;
    }
    
    for (const doc of docsToCheck) {
      try {
        const status = await DocumentService.getIngestionStatus(doc.id);
        if (status.status !== IngestionStatus.PROCESSING) {
          // Update document in state
          setDocuments(prev => prev.map(d => 
            d.id === doc.id ? { ...d, ingestion_status: status.status, ingestion_error: status.error_message } : d
          ));
          setProcessingDocs(prev => {
            const newSet = new Set(prev);
            newSet.delete(doc.id);
            return newSet;
          });
        }
      } catch (error) {
        console.error('Error checking ingestion status:', error);
      }
    }
  };

  const handleIngest = async (documentId: string) => {
    try {
      setError('');
      await DocumentService.triggerIngestion(documentId);
      
      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId ? { ...doc, ingestion_status: IngestionStatus.PROCESSING } : doc
      ));
      setProcessingDocs(prev => new Set(prev).add(documentId));
      
      // Start checking status
      startIngestionStatusCheck();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start ingestion');
    }
  };

  return (
    <AppLayout>
      <div className="d-flex flex-column h-100">
        {/* Toolbar */}
        <div className="border-bottom bg-light px-4 py-2">
          <div className="d-flex align-items-center justify-content-between">
            <h5 className="mb-0">Knowledge Base</h5>
            
            <div className="d-flex align-items-center gap-3">
              {/* AI Search */}
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => setShowSearchModal(true)}
                title="Search with AI"
              >
                <i className="bi bi-robot me-2"></i>
                AI Search
              </button>
              {/* Search */}
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* View Toggle */}
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <i className="bi bi-list"></i>
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <i className="bi bi-grid-3x3-gap"></i>
                </button>
              </div>

              {/* Actions */}
              {selectedDocIds.size > 0 && (
                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleBulkDelete}
                >
                  Delete ({selectedDocIds.size})
                </button>
              )}

              {/* Upload */}
              <input
                ref={fileInputRef}
                type="file"
                className="d-none"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <button
                className="btn btn-sm btn-primary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show mx-4 mt-3 mb-0" role="alert">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-grow-1 d-flex overflow-hidden">
          {/* Document List/Grid */}
          <div className={`flex-grow-1 overflow-auto p-4 ${showDetails ? 'pe-0' : ''}`}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-folder2-open display-1 text-muted"></i>
                <p className="text-muted mt-3">
                  {searchQuery ? 'No documents match your search' : 'No documents uploaded yet'}
                </p>
              </div>
            ) : viewMode === 'list' ? (
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ width: '40px' }}></th>
                    <th 
                      className="cursor-pointer user-select-none"
                      onClick={() => handleSort('filename')}
                    >
                      Name
                      {sortField === 'filename' && (
                        <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer user-select-none"
                      onClick={() => handleSort('file_size')}
                    >
                      Size
                      {sortField === 'file_size' && (
                        <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th 
                      className="cursor-pointer user-select-none"
                      onClick={() => handleSort('created_at')}
                    >
                      Modified
                      {sortField === 'created_at' && (
                        <i className={`bi bi-chevron-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                      )}
                    </th>
                    <th style={{ width: '120px' }}>Status</th>
                    <th style={{ width: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className={selectedDoc?.id === doc.id ? 'table-active' : ''}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedDocIds.has(doc.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedDocIds);
                            if (e.target.checked) {
                              newSet.add(doc.id);
                            } else {
                              newSet.delete(doc.id);
                            }
                            setSelectedDocIds(newSet);
                          }}
                        />
                      </td>
                      <td>
                        <span className="fs-5">{getFileIcon(doc.file_type)}</span>
                      </td>
                      <td 
                        className="cursor-pointer"
                        onClick={() => handleDocClick(doc)}
                      >
                        {doc.filename}
                      </td>
                      <td>{formatFileSize(doc.file_size)}</td>
                      <td>{formatDate(doc.created_at)}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {getIngestionStatusIcon(doc.ingestion_status)} {getIngestionStatusText(doc.ingestion_status)}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {(doc.ingestion_status !== IngestionStatus.COMPLETED && 
                            doc.ingestion_status !== IngestionStatus.PROCESSING) && (
                            <button
                              className="btn btn-outline-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIngest(doc.id);
                              }}
                              title="Index for AI search"
                            >
                              <i className="bi bi-cpu"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc.id);
                            }}
                            title="Download"
                          >
                            <i className="bi bi-download"></i>
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="row g-3">
                {filteredDocuments.map(doc => (
                  <div key={doc.id} className="col-md-6 col-lg-4 col-xl-3">
                    <div 
                      className={`card h-100 cursor-pointer ${selectedDoc?.id === doc.id ? 'border-primary' : ''}`}
                      onClick={() => handleDocClick(doc)}
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-start justify-content-between mb-2">
                          <span className="fs-1">{getFileIcon(doc.file_type)}</span>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedDocIds.has(doc.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(selectedDocIds);
                              if (e.target.checked) {
                                newSet.add(doc.id);
                              } else {
                                newSet.delete(doc.id);
                              }
                              setSelectedDocIds(newSet);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <h6 className="card-title text-truncate">{doc.filename}</h6>
                        <p className="card-text text-muted small">
                          {formatFileSize(doc.file_size)}<br />
                          {formatDate(doc.created_at)}
                        </p>
                        <div className="mb-2">
                          <span className="badge bg-secondary">
                            {getIngestionStatusIcon(doc.ingestion_status)} {getIngestionStatusText(doc.ingestion_status)}
                          </span>
                        </div>
                        <div className="d-flex gap-2 mt-3">
                          {(doc.ingestion_status !== IngestionStatus.COMPLETED && 
                            doc.ingestion_status !== IngestionStatus.PROCESSING) && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleIngest(doc.id);
                              }}
                              title="Index"
                            >
                              <i className="bi bi-cpu"></i>
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary flex-grow-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(doc.id);
                            }}
                          >
                            <i className="bi bi-download"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.id);
                            }}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          {showDetails && selectedDoc && (
            <div className="border-start bg-light p-4" style={{ width: '350px' }}>
              <div className="d-flex justify-content-between align-items-start mb-4">
                <h6 className="mb-0">Document Details</h6>
                <button
                  className="btn-close"
                  onClick={() => {
                    setShowDetails(false);
                    setSelectedDoc(null);
                  }}
                />
              </div>
              
              <div className="text-center mb-4">
                <span className="display-1">{getFileIcon(selectedDoc.file_type)}</span>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Name</label>
                <p className="mb-0 text-break">{selectedDoc.filename}</p>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Type</label>
                <p className="mb-0">{selectedDoc.file_type}</p>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Size</label>
                <p className="mb-0">{formatFileSize(selectedDoc.file_size)}</p>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Uploaded</label>
                <p className="mb-0">{formatDate(selectedDoc.created_at)}</p>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Document ID</label>
                <p className="mb-0 text-muted small text-break">{selectedDoc.id}</p>
              </div>
              
              <div className="mb-3">
                <label className="text-muted small">Index Status</label>
                <p className="mb-0">
                  <span className="badge bg-secondary">
                    {getIngestionStatusIcon(selectedDoc.ingestion_status)} {getIngestionStatusText(selectedDoc.ingestion_status)}
                  </span>
                </p>
                {selectedDoc.ingestion_error && (
                  <small className="text-danger">{selectedDoc.ingestion_error}</small>
                )}
              </div>
              
              <div className="d-grid gap-2 mt-4">
                {(selectedDoc.ingestion_status !== IngestionStatus.COMPLETED && 
                  selectedDoc.ingestion_status !== IngestionStatus.PROCESSING) && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleIngest(selectedDoc.id)}
                  >
                    <i className="bi bi-cpu me-2"></i>
                    Index for AI Search
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(selectedDoc.id)}
                >
                  <i className="bi bi-download me-2"></i>
                  Download
                </button>
                <button
                  className="btn btn-outline-danger"
                  onClick={() => handleDelete(selectedDoc.id)}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <DocumentSearchModal 
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />
    </AppLayout>
  );
};

export default Documents;