/**
 * ChatsView - Página de visualização e busca de todos os chats
 */
import React, { useState } from 'react';

interface Chat {
    id: string;
    title: string;
    lastMessage: string;
    date: string;
    messageCount: number;
}

const ChatsView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data - substituir com dados reais da API
    const allChats: Chat[] = [
        {
            id: '1',
            title: 'Análise de Documentos PDF',
            lastMessage: 'Pode resumir o documento sobre...',
            date: 'Hoje às 14:30',
            messageCount: 12
        },
        {
            id: '2',
            title: 'Perguntas sobre o projeto',
            lastMessage: 'Quais são os objetivos do projeto?',
            date: 'Ontem às 10:15',
            messageCount: 8
        },
        {
            id: '3',
            title: 'Resumo de relatórios',
            lastMessage: 'Me dê um resumo executivo',
            date: '2 dias atrás',
            messageCount: 5
        },
        {
            id: '4',
            title: 'Análise de Contratos',
            lastMessage: 'Quais são as cláusulas importantes?',
            date: '3 dias atrás',
            messageCount: 15
        },
        {
            id: '5',
            title: 'Pesquisa sobre IA',
            lastMessage: 'Explique sobre RAG',
            date: 'Semana passada',
            messageCount: 20
        },
    ];

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
                                    {Math.round(allChats.reduce((sum, chat) => sum + chat.messageCount, 0) / allChats.length)}
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
                    {filteredChats.length === 0 ? (
                        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-slate-200">
                            <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <p className="text-slate-500 text-lg">Nenhum chat encontrado</p>
                            <p className="text-slate-400 text-sm mt-2">Tente ajustar sua busca</p>
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
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle resume chat
                                            }}
                                            title="Retomar chat"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </button>
                                        <button
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Handle delete
                                            }}
                                            title="Deletar chat"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
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
