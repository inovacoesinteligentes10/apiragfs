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
    department: string | null;
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

export interface SystemPromptResponse {
    system_prompt: string;
    updated_at: string;
}

export interface SystemPromptUpdate {
    system_prompt: string;
}

export interface RagStore {
    id: string;
    user_id: string;
    name: string;
    display_name: string;
    description: string | null;
    icon: string | null;
    color: string | null;
    document_count: number;
    rag_store_name: string | null;
    created_at: string;
    updated_at: string;
}

export interface RagStoreCreate {
    name: string;
    display_name: string;
    description?: string;
    icon?: string;
    color?: string;
}

export interface AnalyticsDashboard {
    total_documents: number;
    completed_documents: number;
    total_chat_sessions: number;
    total_messages: number;
    documents_by_type: Array<{ type: string; count: number }>;
    activity_last_7_days: Array<{ date: string; count: number }>;
    timestamp: string;
}

export interface AnalyticsStats {
    total_storage_bytes: number;
    total_storage_mb: number;
    avg_processing_time_seconds: number;
    total_chunks: number;
    active_chat_sessions: number;
}

export interface AnalyticsActivity {
    period_days: number;
    start_date: string;
    end_date: string;
    activity: {
        [date: string]: Array<{
            event_type: string;
            count: number;
        }>;
    };
}

export interface TopQuery {
    query: string;
    frequency: number;
}

export interface TopQueriesResponse {
    top_queries: TopQuery[];
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    /**
     * Upload de documento com progress tracking
     */
    async uploadDocument(
        file: File,
        department?: string,
        onProgress?: (progress: number, status: string, statusMessage?: string) => void
    ): Promise<DocumentUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        // Adicionar department aos metadados se fornecido
        if (department) {
            const metadata = { department };
            formData.append('metadata', JSON.stringify(metadata));
        }

        // Iniciar upload
        const response = await fetch(`${this.baseUrl}/api/v1/documents/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao fazer upload');
        }

        const document = await response.json();

        // Se callback de progresso foi fornecido, fazer polling de status
        if (onProgress) {
            await this.pollDocumentStatus(document.id, onProgress);
        }

        return document;
    }

    /**
     * Faz polling do status do documento até completar ou falhar
     */
    private async pollDocumentStatus(
        documentId: string,
        onProgress: (progress: number, status: string, statusMessage?: string) => void
    ): Promise<void> {
        let attempts = 0;
        const maxAttempts = 60; // 5 minutos (5s * 60)
        const pollInterval = 5000; // 5 segundos

        while (attempts < maxAttempts) {
            try {
                await new Promise(resolve => setTimeout(resolve, pollInterval));

                const doc = await this.getDocument(documentId);

                // Calcular progresso baseado no status
                let progress = doc.progress_percent || 0;

                // Se não houver progress_percent, estimar baseado no status
                if (!doc.progress_percent) {
                    switch (doc.status) {
                        case 'uploaded':
                            progress = 10;
                            break;
                        case 'extracting':
                            progress = 30;
                            break;
                        case 'chunking':
                            progress = 50;
                            break;
                        case 'embedding':
                            progress = 70;
                            break;
                        case 'indexing':
                            progress = 90;
                            break;
                        case 'completed':
                            progress = 100;
                            break;
                        case 'error':
                            progress = 0;
                            break;
                    }
                }

                // Notificar progresso
                onProgress(progress, doc.status, doc.status_message || undefined);

                // Verificar se terminou (sucesso ou erro)
                if (doc.status === 'completed' || doc.status === 'error') {
                    break;
                }

                attempts++;
            } catch (error) {
                console.error('Erro ao verificar status do documento:', error);
                attempts++;
            }
        }

        if (attempts >= maxAttempts) {
            throw new Error('Timeout ao processar documento');
        }
    }

    /**
     * Listar documentos - Usa autenticação JWT
     * Admin vê todos os documentos, usuários regulares veem apenas dos stores com permissão
     */
    async listDocuments(skip: number = 0, limit: number = 100): Promise<DocumentUploadResponse[]> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(
            `${this.baseUrl}/api/v1/documents/?skip=${skip}&limit=${limit}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao listar documentos');
        }

        return response.json();
    }

    /**
     * Buscar documento por ID - Usa autenticação JWT
     */
    async getDocument(documentId: string): Promise<DocumentUploadResponse> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Documento não encontrado');
        }

        return response.json();
    }

    /**
     * Deletar documento - Usa autenticação JWT
     */
    async deleteDocument(documentId: string): Promise<void> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
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

    /**
     * Buscar system prompt atual
     */
    async getSystemPrompt(userId: string = 'default-user'): Promise<SystemPromptResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/settings/system-prompt?user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar system prompt');
        }

        return response.json();
    }

    /**
     * Atualizar system prompt
     */
    async updateSystemPrompt(systemPrompt: string, userId: string = 'default-user'): Promise<SystemPromptResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/settings/system-prompt?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ system_prompt: systemPrompt }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao atualizar system prompt');
        }

        return response.json();
    }

    /**
     * Resetar system prompt para o padrão
     */
    async resetSystemPrompt(userId: string = 'default-user'): Promise<SystemPromptResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/settings/reset-system-prompt?user_id=${userId}`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Erro ao resetar system prompt');
        }

        return response.json();
    }

    /**
     * Listar RAG Stores (Departments) - Agora usa autenticação JWT
     */
    async listRagStores(): Promise<import('../types').StoreWithPermissions[]> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao listar stores');
        }

        return response.json();
    }

    /**
     * Buscar RAG Store por ID - Agora usa autenticação JWT
     */
    async getRagStore(storeId: string): Promise<import('../types').StoreWithPermissions> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Store não encontrado');
        }

        return response.json();
    }

    /**
     * Criar novo RAG Store - Agora usa autenticação JWT
     */
    async createRagStore(storeData: RagStoreCreate): Promise<RagStore> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(storeData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao criar store');
        }

        return response.json();
    }

    /**
     * Atualizar RAG Store - Agora usa autenticação JWT e ID ao invés de nome
     */
    async updateRagStore(storeId: string, storeData: RagStoreCreate): Promise<RagStore> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(storeData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao atualizar store');
        }

        return response.json();
    }

    /**
     * Deletar RAG Store - Agora usa autenticação JWT e ID ao invés de nome
     */
    async deleteRagStore(storeId: string): Promise<void> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao deletar store');
        }
    }

    // ===== Store Permissions Methods =====

    /**
     * Listar permissões de um store
     */
    async getStorePermissions(storeId: string): Promise<import('../types').StorePermission[]> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}/permissions`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao listar permissões do store');
        }

        return response.json();
    }

    /**
     * Adicionar permissão de usuário a um store
     */
    async addStorePermission(storeId: string, userId: string): Promise<void> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}/permissions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ user_id: userId }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao adicionar permissão');
        }
    }

    /**
     * Remover permissão de usuário de um store
     */
    async removeStorePermission(storeId: string, userId: string): Promise<void> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/stores/${storeId}/permissions/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao remover permissão');
        }
    }

    /**
     * Mover documento para outro store
     */
    async moveDocumentToStore(documentId: string, targetStore: string, userId: string = 'default-user'): Promise<{ message: string; old_store: string; new_store: string }> {
        const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}/move-store?target_store=${targetStore}&user_id=${userId}`, {
            method: 'PATCH',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erro ao mover documento');
        }

        return response.json();
    }

    /**
     * Analytics - Dashboard metrics
     */
    async getAnalyticsDashboard(userId: string): Promise<AnalyticsDashboard> {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/dashboard?user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar métricas do dashboard');
        }

        return response.json();
    }

    /**
     * Analytics - General stats
     */
    async getAnalyticsStats(userId: string): Promise<AnalyticsStats> {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/stats?user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar estatísticas');
        }

        return response.json();
    }

    /**
     * Analytics - Activity over time
     */
    async getAnalyticsActivity(days: number, userId: string): Promise<AnalyticsActivity> {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/activity?days=${days}&user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar atividade');
        }

        return response.json();
    }

    /**
     * Analytics - Top queries
     */
    async getTopQueries(limit: number, userId: string): Promise<TopQueriesResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/queries?limit=${limit}&user_id=${userId}`);

        if (!response.ok) {
            throw new Error('Erro ao buscar top queries');
        }

        return response.json();
    }

    /**
     * Analytics - Track event
     */
    async trackEvent(eventType: string, eventData: any, userId: string): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.baseUrl}/api/v1/analytics/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event_type: eventType,
                event_data: eventData,
                user_id: userId,
            }),
        });

        if (!response.ok) {
            throw new Error('Erro ao registrar evento');
        }

        return response.json();
    }

    // ===== User Management Methods =====

    /**
     * Listar todos os usuários
     */
    async listUsers(): Promise<import('../types').User[]> {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${this.baseUrl}/api/v1/users/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Erro ao listar usuários');
        }

        return response.json();
    }
}

// Instância global
export const apiService = new ApiService();
