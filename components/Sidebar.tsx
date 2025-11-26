/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import UserMenu from './UserMenu';
import { useAuth } from '../contexts/AuthContext';
import { useSystemConfig } from '../contexts/SystemConfigContext';

interface SidebarProps {
    currentView: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats';
    onNavigate: (view: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats') => void;
    hasActiveSession: boolean;
    onOpenAuth?: () => void;
    onNewChat?: () => void;
}

interface ChatHistoryItem {
    id: string;
    title: string;
    date: string;
}

const Sidebar: React.FC<SidebarProps> = ({
    currentView,
    onNavigate,
    hasActiveSession,
    onOpenAuth,
    onNewChat
}) => {
    const { user } = useAuth();
    const { config } = useSystemConfig();
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data - substituir com dados reais da API
    const recentChats: ChatHistoryItem[] = [
        { id: '1', title: 'Análise de Documentos PDF', date: 'Hoje' },
        { id: '2', title: 'Perguntas sobre o projeto', date: 'Ontem' },
        { id: '3', title: 'Resumo de relatórios', date: '2 dias atrás' },
    ];

    const filteredChats = recentChats.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Chat</span>
                </button>
            </div>

            {/* Chats Section */}
            <div className="flex-1 overflow-y-auto p-4">
                {/* Search */}
                <div className="mb-4">
                    <button
                        onClick={() => onNavigate('chats')}
                        className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span>Buscar chats...</span>
                    </button>
                </div>

                {/* Recents */}
                <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
                        Recentes
                    </h3>
                    <div className="space-y-1">
                        {filteredChats.length === 0 ? (
                            <p className="text-xs text-slate-500 px-2 py-4 text-center">
                                Nenhum chat recente
                            </p>
                        ) : (
                            filteredChats.map((chat) => (
                                <button
                                    key={chat.id}
                                    onClick={() => onNavigate('chat')}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left group"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-200 truncate">
                                                {chat.title}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {chat.date}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-600 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle delete
                                        }}
                                    >
                                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer with User Menu */}
            <div className="p-4 border-t border-slate-700">
                <UserMenu
                    onOpenAuth={onOpenAuth}
                    onNavigate={onNavigate}
                    currentView={currentView}
                />
            </div>
        </aside>
    );
};

export default Sidebar;
