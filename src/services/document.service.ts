import type { 
  Document, 
  DocumentListResponse, 
  DocumentDownloadResponse,
  IngestionStatusResponse,
  DocumentSearchRequest,
  DocumentSearchResponse 
} from '../types/document';
import AuthService from './auth.service';

import { config } from '../config/env';

const API_BASE_URL = config.apiBaseUrl;

class DocumentService {
  static async uploadDocument(file: File): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        ...AuthService.getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
  }

  static async getDocuments(skip = 0, limit = 20): Promise<DocumentListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/documents?skip=${skip}&limit=${limit}`,
      {
        headers: {
          ...AuthService.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  static async getDocument(documentId: string): Promise<Document> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: {
        ...AuthService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.json();
  }

  static async getDownloadUrl(
    documentId: string,
    expiresHours = 1
  ): Promise<DocumentDownloadResponse> {
    const response = await fetch(
      `${API_BASE_URL}/documents/${documentId}/download?expires_hours=${expiresHours}`,
      {
        headers: {
          ...AuthService.getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get download URL');
    }

    return response.json();
  }

  static async deleteDocument(documentId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        ...AuthService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }

    return true;
  }

  static async downloadDocument(documentId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        headers: {
          ...AuthService.getAuthHeader(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Convert response to blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and click it
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Failed to download document');
    }
  }

  static async triggerIngestion(documentId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/ingest`, {
      method: 'POST',
      headers: {
        ...AuthService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start document ingestion');
    }
  }

  static async getIngestionStatus(documentId: string): Promise<IngestionStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/ingestion-status`, {
      headers: {
        ...AuthService.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get ingestion status');
    }

    return response.json();
  }

  static async searchDocuments(searchRequest: DocumentSearchRequest): Promise<DocumentSearchResponse> {
    const response = await fetch(`${API_BASE_URL}/documents/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AuthService.getAuthHeader(),
      },
      body: JSON.stringify(searchRequest),
    });

    if (!response.ok) {
      throw new Error('Failed to search documents');
    }

    return response.json();
  }
}

export default DocumentService;