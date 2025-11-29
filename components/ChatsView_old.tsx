/**
 * ChatsView - Página de visualização e busca de todos os chats
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { showSuccess, showError, showWarning } from '../utils/toast';

interface Chat {
    id: string;
    title: string;
    lastMessage: string;
    date: string;
    messageCount: number;
    ragStoreName: string;
}

interface ChatsViewProps {
    onResumeChat?: (sessionId: string, ragStoreName: string) => void;
}

const ChatsView: React.FC<ChatsViewProps> = ({ onResumeChat }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [allChats, setAllChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingChatId, setDeletingChatId] = useState<string | null>(null);

    // Carregar chats reais da API
    useEffect(() => {
        const loadChats = async () => {
            try {
                setIsLoading(true);
                const sessions = await apiService.listChatSessions();

                // Buscar stores disponíveis para validação
                const availableStores = await apiService.listRagStores();
                const validRagStoreNames = new Set(
                    availableStores
                        .filter(store => store.rag_store_name && store.document_count > 0)
                        .map(store => store.rag_store_name)
                );

                console.log('🔍 RAG Stores válidos (ChatsView):', Array.from(validRagStoreNames));

                // Coletar IDs de sessões órfãs para deletar
                const orphanedSessionIds: string[] = [];

                // Converter sessões para o formato de Chat
                const chatsData: Chat[] = (await Promise.all(
                    sessions.map(async (session) => {
                        // Verificar se o RAG store ainda existe e tem documentos
                        if (!validRagStoreNames.has(session.rag_store_name)) {
                            console.warn(`⚠️ Sessão órfã detectada (ChatsView): ${session.id} (store: ${session.rag_store_name})`);
                            orphanedSessionIds.push(session.id);
                            return null; // Filtrar esta sessão
                        }

                        // Buscar última mensagem
                        try {
                            const messages = await apiService.getSessionMessages(session.id);
                            const lastMessage = messages.length > 0
                                ? messages[messages.length - 1].content
                                : 'Sem mensagens';

                            // Formatar data
                            const date = new Date(session.started_at);
                            const now = new Date();
                            const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

                            let dateStr = '';
                            if (diffDays === 0) {
                                dateStr = `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                            } else if (diffDays === 1) {
                                dateStr = `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                            } else if (diffDays < 7) {
                                dateStr = `${diffDays} dias atrás`;
                            } else {
                                dateStr = date.toLocaleDateString('pt-BR');
                            }

                            return {
                                id: session.id,
                                title: `Chat - ${session.rag_store_name.split('/').pop()?.substring(0, 20) || 'Sem título'}`,
                                lastMessage: lastMessage.substring(0, 100),
                                date: dateStr,
                                messageCount: session.message_count,
                                ragStoreName: session.rag_store_name
                            };
                        } catch (err) {
                            console.error('Erro ao buscar mensagens da sessão:', err);
                            return null; // Filtrar sessões com erro
                        }
                    })
                )).filter((chat): chat is Chat => chat !== null);

                // Deletar sessões órfãs em background
                if (orphanedSessionIds.length > 0) {
                    console.log(`🗑️ Deletando ${orphanedSessionIds.length} sessões órfãs (ChatsView)...`);
                    Promise.all(
                        orphanedSessionIds.map(id =>
                            apiService.deleteChatSession(id).catch(err =>
                                console.error(`Erro ao deletar sessão órfã ${id}:`, err)
                            )
                        )
                    );
                }

                setAllChats(chatsData);
            } catch (err) {
                console.error('Erro ao carregar chats:', err);
                setAllChats([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadChats();
    }, []);

    const handleResumeChat = async (chatId: string, ragStoreName: string) => {
        try {
            console.log('🔄 Retomando chat:', chatId);

            if (onResumeChat) {
                onResumeChat(chatId, ragStoreName);
            } else {
                showWarning('Funcionalidade de retomar chat não disponível nesta view');
            }
        } catch (err) {
            console.error('Erro ao retomar chat:', err);
            showError('Erro ao retomar chat. Por favor, tente novamente.');
        }
    };

    const handleDeleteChat = async (chatId: string, chatTitle: string) => {
        if (!confirm(`Tem certeza que deseja deletar o chat "${chatTitle}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            setDeletingChatId(chatId);
            console.log('🗑️ Deletando chat:', chatId);

            await apiService.deleteChatSession(chatId);

            // Remover da lista local
            setAllChats(prev => prev.filter(chat => chat.id !== chatId));

            showSuccess(`Chat "${chatTitle}" deletado com sucesso!`);
        } catch (err) {
            console.error('Erro ao deletar chat:', err);
            showError('Erro ao deletar chat. Por favor, tente novamente.');
        } finally {
            setDeletingChatId(null);
        }
    };

    const filteredChats = allChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
            <div className="max-w-4xl mx-auto p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Seus Chats</h1>
                    <p className="text-slate-600">Encontre e retome suas conversas anteriores</p>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-3 pl-12 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Total de Chats</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">{allChats.length}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Mensagens</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">
                                    {allChats.reduce((sum, chat) => sum + chat.messageCount, 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-600">Média de Mensagens</p>
                                <p className="text-2xl font-bold text-slate-800 mt-1">
                                    {allChats.length > 0 ? Math.round(allChats.reduce((sum, chat) => sum + chat.messageCount, 0) / allChats.length) : 0}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-slate-200">
                            <div className="flex justify-center items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <p className="text-slate-500 text-lg mt-4">Carregando chats...</p>
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-slate-200">
                            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-slate-500 text-lg">Nenhum chat encontrado</p>
                            <p className="text-slate-400 text-sm mt-2">
                                {allChats.length === 0 ? 'Comece uma conversa na aba Chat!' : 'Tente ajustar sua busca'}
                            </p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <button
                                key={chat.id}
                                className="w-full bg-white rounded-lg p-5 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <h3 className="text-lg font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                                {chat.title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                                            {chat.lastMessage}
                                        </p>
                                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                                            <span className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>{chat.date}</span>
                                            </span>
                                            <span className="flex items-center space-x-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                </svg>
                                                <span>{chat.messageCount} mensagens</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleResumeChat(chat.id, chat.ragStoreName);
                                            }}
                                            title="Retomar chat"
                                            disabled={deletingChatId === chat.id}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                        <button
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChat(chat.id, chat.title);
                                            }}
                                            title="Deletar chat"
                                            disabled={deletingChatId === chat.id}
                                        >
                                            {deletingChatId === chat.id ? (
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatsView;
