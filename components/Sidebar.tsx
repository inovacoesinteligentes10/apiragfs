/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface SidebarProps {
    currentView: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings';
    onNavigate: (view: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings') => void;
    hasActiveSession: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, hasActiveSession }) => {
    const menuSections = [
        {
            title: 'Principal',
            items: [
                {
                    id: 'dashboard' as const,
                    label: 'Dashboard',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    )
                },
                {
                    id: 'documents' as const,
                    label: 'Documentos',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )
                },
                {
                    id: 'chat' as const,
                    label: 'Chat IA',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    ),
                    disabled: !hasActiveSession
                }
            ]
        },
        {
            title: 'Ferramentas',
            items: [
                {
                    id: 'analytics' as const,
                    label: 'Analytics',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    )
                }
            ]
        },
        {
            title: 'Sistema',
            items: [
                {
                    id: 'status' as const,
                    label: 'Status dos Serviços',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                },
                {
                    id: 'settings' as const,
                    label: 'Configurações',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    )
                }
            ]
        }
    ];

    return (
        <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">ChatSUA</h1>
                        <p className="text-xs text-slate-400">UNIFESP Assistant</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {menuSections.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-4">
                            {section.title}
                        </h3>
                        <div className="space-y-1">
                            {section.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => !item.disabled && onNavigate(item.id)}
                                    disabled={item.disabled}
                                    className={`
                                        w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200
                                        ${currentView === item.id
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                                            : item.disabled
                                            ? 'text-slate-500 cursor-not-allowed opacity-50'
                                            : 'hover:bg-slate-700/50 hover:shadow-md'
                                        }
                                    `}
                                >
                                    <span className={currentView === item.id ? 'text-white' : 'text-slate-300'}>
                                        {item.icon}
                                    </span>
                                    <span className={`text-sm font-medium ${currentView === item.id ? 'text-white' : 'text-slate-300'}`}>
                                        {item.label}
                                    </span>
                                    {item.disabled && (
                                        <span className="ml-auto">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700">
                <div className="text-xs text-slate-400 space-y-1">
                    <p>Sistema Unificado de</p>
                    <p>Administração - UNIFESP</p>
                    <p className="mt-2 text-slate-500">v2.0.0</p>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
