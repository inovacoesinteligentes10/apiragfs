// API service layer - Configure your backend URL here
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface Document {
  id: string;
  name: string;
  original_name: string;
  type: string;
  size: number;
  status: 'processing' | 'completed' | 'error';
  upload_date: string;
  text_length?: number;
  chunks?: number;
  processing_time?: number;
  error_message?: string;
}

export interface UploadResponse {
  id: string;
  message: string;
  document: Document;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async uploadDocument(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  async getDocuments(): Promise<Document[]> {
    const response = await fetch(`${this.baseUrl}/documents`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch documents');
    }

    return response.json();
  }

  async getDocument(id: string): Promise<Document> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch document');
    }

    return response.json();
  }

  async deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete document');
    }
  }

  async downloadDocument(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/documents/${id}/download`);
    
    if (!response.ok) {
      throw new Error('Failed to download document');
    }

    return response.blob();
  }
}

export const apiService = new ApiService();
