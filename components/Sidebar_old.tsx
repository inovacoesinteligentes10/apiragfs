/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';
import { apiService } from '../services/apiService';

interface RecentChat {
    id: string;
    title: string;
    lastMessage: string;
    ragStoreName: string;
}

interface SidebarProps {
    currentView: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats';
    onNavigate: (view: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats') => void;
    hasActiveSession: boolean;
    hasDocuments: boolean;
    onOpenAuth?: () => void;
    onNewChat?: () => void;
    onResumeChat?: (sessionId: string, ragStoreName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onNavigate,
    hasActiveSession,
    hasDocuments,
    onOpenAuth,
    onNewChat,
    onResumeChat
}) => {
    const { user } = useAuth();
    const { config } = useSystemConfig();
    const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(false);

    // Carregar últimas 10 conversas
    useEffect(() => {
        const loadRecentChats = async () => {
            if (!user) {
                setRecentChats([]);
                return;
            }

            try {
                setIsLoadingChats(true);
                const sessions = await apiService.listChatSessions(0, 10);

                // Buscar stores disponíveis para validação
                const availableStores = await apiService.listRagStores();
                const validRagStoreNames = new Set(
                    availableStores
                        .filter(store => store.rag_store_name && store.document_count > 0)
                        .map(store => store.rag_store_name)
                );

                console.log('🔍 RAG Stores válidos:', Array.from(validRagStoreNames));

                // Coletar IDs de sessões órfãs para deletar
                const orphanedSessionIds: string[] = [];

                const chatsData: RecentChat[] = (await Promise.all(
                    sessions.map(async (session) => {
                        // Verificar se o RAG store ainda existe e tem documentos
                        if (!validRagStoreNames.has(session.rag_store_name)) {
                            console.warn(`⚠️ Sessão órfã detectada: ${session.id} (store: ${session.rag_store_name})`);
                            orphanedSessionIds.push(session.id);
                            return null; // Filtrar esta sessão
                        }

                        try {
                            const messages = await apiService.getSessionMessages(session.id);
                            const lastMessage = messages.length > 0
                                ? messages[messages.length - 1].content
                                : 'Sem mensagens';

                            return {
                                id: session.id,
                                title: `${session.rag_store_name.split('/').pop()?.substring(0, 15) || 'Chat'}`,
                                lastMessage: lastMessage.substring(0, 40),
                                ragStoreName: session.rag_store_name
                            };
                        } catch (err) {
                            console.error('Erro ao buscar mensagens:', err);
                            return null; // Filtrar sessões com erro
                        }
                    })
                )).filter((chat): chat is RecentChat => chat !== null);

                // Deletar sessões órfãs em background
                if (orphanedSessionIds.length > 0) {
                    console.log(`🗑️ Deletando ${orphanedSessionIds.length} sessões órfãs...`);
                    Promise.all(
                        orphanedSessionIds.map(id =>
                            apiService.deleteChatSession(id).catch(err =>
                                console.error(`Erro ao deletar sessão órfã ${id}:`, err)
                            )
                        )
                    );
                }

                setRecentChats(chatsData);
            } catch (err) {
                console.error('Erro ao carregar chats recentes:', err);
                setRecentChats([]);
            } finally {
                setIsLoadingChats(false);
            }
        };

        loadRecentChats();
    }, [user]);

    return (
        <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-700">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
                        {config.systemLogo}
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">{config.systemName}</h1>
                    </div>
                </div>

                {/* New Chat Button */}
                <button
                    onClick={onNewChat}
                    disabled={!user || !hasDocuments}
                    className={`
                        w-full py-2.5 px-4 rounded-lg font-semibold shadow-lg transition-all duration-200 flex items-center justify-center space-x-2
                        ${user && hasDocuments
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl hover:from-blue-700 hover:to-purple-700 cursor-pointer'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        }
                    `}
                    title={!user ? 'Faça login para iniciar um chat' : !hasDocuments ? 'Faça upload de documentos para iniciar um chat' : 'Iniciar novo chat'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Chat</span>
                </button>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* View All Chats Button */}
                <div className="mb-4">
                    <button
                        onClick={() => onNavigate('chats')}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <span>Ver todos os chats</span>
                    </button>
                </div>

                {/* Recent Chats Section */}
                {user && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                            Conversas Recentes
                        </h3>

                        {isLoadingChats ? (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : recentChats.length === 0 ? (
                            <p className="text-xs text-slate-500 px-2 py-2">Nenhuma conversa ainda</p>
                        ) : (
                            <div className="space-y-1">
                                {recentChats.map((chat) => (
                                    <button
                                        key={chat.id}
                                        onClick={() => onResumeChat?.(chat.id, chat.ragStoreName)}
                                        className="w-full px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
                                        title={chat.lastMessage}
                                    >
                                        <div className="flex items-start space-x-2">
                                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                                                    {chat.title}
                                                </p>
                                                <p className="text-xs text-slate-500 truncate">
                                                    {chat.lastMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer with User Menu */}
            <div className="p-4 border-t border-slate-700">
                <UserMenu
                    onOpenAuth={onOpenAuth}
                    onNavigate={onNavigate}
                    currentView={currentView}
                    hasDocuments={hasDocuments}
                />
            </div>
        </aside>
    );
};

export default Sidebar;
