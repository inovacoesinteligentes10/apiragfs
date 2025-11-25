/**
 * Serviço de integração com Backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DocumentUploadResponse {
    id: string;
    user_id: string;
    name: string;
    original_name: string;
    type: string;
    size: number;
    minio_url: string;
    minio_bucket: string;
    text_length: number | null;
    extraction_method: string | null;
    chunks: number | null;
    processing_time: number | null;
    status: 'uploaded' | 'extracting' | 'chunking' | 'embedding' | 'indexing' | 'completed' | 'error';
    progress_percent: number | null;
    status_message: string | null;
    error_message: string | null;
    rag_store_name: string | null;
    upload_date: string;
    created_at: string;
    updated_at: string;
}

export interface ChatSessionResponse {
    id: string;
    user_id: string;
    rag_store_name: string;
    started_at: string;
    message_count: number;
}

export interface MessageResponse {
    id: string;
    session_id: string;
    role: 'user' | 'model';
    content: string;
    grounding_chunks: any;
    created_at: string;
}

export interface ChatQueryResponse {
    message: string;
    grounding_chunks: Array<{
        chunk_id?: string;
        text?: string;
    }>;
}

export interface DocumentInsight {
    title: string;
    description: string;
    icon: 'document' | 'chart' | 'lightbulb';
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Upload de documento
     */
    async uploadDocument(file: File): Promise<DocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer upload');
        }

        return response.json();
    }

    /**
     * Listar documentos
     */
    async listDocuments(skip: number = 0, limit: number = 100): Promise<DocumentUploadResponse[]> {
        const response = await fetch(
            `${this.baseUrl}/api/v1/documents/?skip=${skip}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error('Erro ao listar documentos');
        }

        return response.json();
    }

    /**
     * Buscar documento por ID
     */
    async getDocument(documentId: string): Promise<DocumentUploadResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`);

        if (!response.ok) {
            throw new Error('Documento não encontrado');
        }

        return response.json();
    }

    /**
     * Deletar documento
     */
    async deleteDocument(documentId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar documento');
        }
    }

    /**
     * Criar sessão de chat
     */
    async createChatSession(ragStoreName: string): Promise<ChatSessionResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rag_store_name: ragStoreName,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao criar sessão');
        }

        return response.json();
    }

    /**
     * Listar sessões de chat
     */
    async listChatSessions(skip: number = 0, limit: number = 50): Promise<ChatSessionResponse[]> {
        const response = await fetch(
            `${this.baseUrl}/api/v1/chat/sessions?skip=${skip}&limit=${limit}`
        );

        if (!response.ok) {
            throw new Error('Erro ao listar sessões');
        }

        return response.json();
    }

    /**
     * Buscar sessão de chat
     */
    async getChatSession(sessionId: string): Promise<ChatSessionResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}`);

        if (!response.ok) {
            throw new Error('Sessão não encontrada');
        }

        return response.json();
    }

    /**
     * Buscar mensagens da sessão
     */
    async getSessionMessages(sessionId: string): Promise<MessageResponse[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}/messages`);

        if (!response.ok) {
            throw new Error('Erro ao buscar mensagens');
        }

        return response.json();
    }

    /**
     * Enviar query para o chat
     */
    async sendChatQuery(sessionId: string, message: string): Promise<ChatQueryResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao enviar mensagem');
        }

        return response.json();
    }

    /**
     * Enviar query para o chat com streaming (SSE)
     */
    async sendChatQueryStream(
        sessionId: string,
        message: string,
        onContent: (text: string) => void,
        onGrounding: (chunks: any[]) => void,
        onDone: (fullText: string, groundingChunks: any[]) => void,
        onError: (error: string) => void
    ): Promise<void> {
        console.log('🌐 Enviando request de streaming para:', `${this.baseUrl}/api/v1/chat/sessions/${sessionId}/query-stream`);

        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}/query-stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao enviar mensagem');
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Stream não disponível');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    console.log('🏁 Stream finalizado');
                    break;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Manter a última linha incompleta no buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        console.log('📦 Evento SSE recebido:', data);
                        try {
                            const event = JSON.parse(data);

                            switch (event.type) {
                                case 'content':
                                    onContent(event.text);
                                    break;
                                case 'grounding':
                                    onGrounding(event.grounding_chunks);
                                    break;
                                case 'done':
                                    onDone(event.full_text, event.grounding_chunks);
                                    break;
                                case 'error':
                                    onError(event.message);
                                    break;
                            }
                        } catch (e) {
                            console.error('❌ Erro ao parsear evento SSE:', e, 'Data:', data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Deletar sessão de chat
     */
    async deleteChatSession(sessionId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Erro ao deletar sessão');
        }
    }

    /**
     * Buscar insights da sessão
     */
    async getSessionInsights(sessionId: string): Promise<DocumentInsight[]> {
        const response = await fetch(`${this.baseUrl}/api/v1/chat/sessions/${sessionId}/insights`);

        if (!response.ok) {
            throw new Error('Erro ao buscar insights');
        }

        return response.json();
    }

    /**
     * Health check
     */
    async healthCheck(): Promise<any> {
        const response = await fetch(`${this.baseUrl}/health`);

        if (!response.ok) {
            throw new Error('API não está respondendo');
        }

        return response.json();
    }
}

// Instância global
export const apiService = new ApiService();
