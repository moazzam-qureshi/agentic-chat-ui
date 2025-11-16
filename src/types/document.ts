export const IngestionStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type IngestionStatus = typeof IngestionStatus[keyof typeof IngestionStatus];

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  content_type: string;
  bucket_name: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  ingestion_status?: IngestionStatus;
  ingestion_error?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
}

export interface DocumentDownloadResponse {
  download_url: string;
  expires_in: number;
  filename: string;
  content_type: string;
}

export interface DocumentUploadData {
  file: File;
}

// File type restrictions
export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const getFileIcon = (fileType: string): string => {
  if (fileType === '.pdf' || fileType === 'application/pdf') return '📄';
  if (fileType === '.txt' || fileType === 'text/plain') return '📝';
  if (fileType === '.md' || fileType === 'text/markdown') return '📑';
  if (fileType === '.doc' || fileType === '.docx' || 
      fileType === 'application/msword' || 
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return '📋';
  return '📎';
};

export interface IngestionStatusResponse {
  document_id: string;
  status: IngestionStatus;
  error_message?: string;
  chunks_count?: number;
  total_tokens?: number;
}

export interface DocumentSearchRequest {
  query: string;
  k?: number;
  score_threshold?: number;
  document_ids?: string[];
}

export interface DocumentSearchResult {
  chunk_id: string;
  document_id: string;
  filename: string;
  chunk_text: string;
  chunk_index: number;
  similarity_score: number;
  metadata?: Record<string, any>;
}

export interface DocumentSearchResponse {
  query: string;
  results: DocumentSearchResult[];
  total_results: number;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getIngestionStatusIcon = (status?: IngestionStatus): string => {
  switch (status) {
    case IngestionStatus.COMPLETED:
      return '✅';
    case IngestionStatus.PROCESSING:
      return '⏳';
    case IngestionStatus.FAILED:
      return '❌';
    default:
      return '⚪';
  }
};

export const getIngestionStatusText = (status?: IngestionStatus): string => {
  switch (status) {
    case IngestionStatus.COMPLETED:
      return 'Indexed';
    case IngestionStatus.PROCESSING:
      return 'Processing...';
    case IngestionStatus.FAILED:
      return 'Failed';
    default:
      return 'Not indexed';
  }
};