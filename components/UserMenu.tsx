/**
 * UserMenu - Menu do usuário com informações, navegação e logout
 */
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess } from '../utils/toast';

interface UserMenuProps {
    onOpenAuth?: () => void;
    onNavigate?: (view: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats') => void;
    currentView?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ onOpenAuth, onNavigate, currentView }) => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fechar menu ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Se não estiver autenticado, mostrar botão de login
    if (!user) {
        return (
            <button
                onClick={onOpenAuth}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Fazer Login</span>
            </button>
        );
    }

    const handleLogout = async () => {
        await logout();
        showSuccess('Logout realizado com sucesso!');
        setIsOpen(false);
    };

    const handleNavigation = (view: 'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats') => {
        if (onNavigate) {
            onNavigate(view);
        }
        setIsOpen(false);
    };

    const getRoleLabel = (role: string) => {
        const roles: Record<string, string> = {
            student: 'Estudante',
            professor: 'Professor',
            admin: 'Administrador',
        };
        return roles[role] || role;
    };

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const isAdmin = user.role === 'admin';

    return (
        <div className="relative" ref={menuRef}>
            {/* User Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(user.name)}
                </div>
                <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400">{getRoleLabel(user.role)}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-700 bg-slate-750">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                                {getInitials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-900/50 text-blue-300 rounded-full border border-blue-700">
                                {getRoleLabel(user.role)}
                            </span>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        {/* Dashboard */}
                        <button
                            onClick={() => handleNavigation('dashboard')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                currentView === 'dashboard' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Dashboard</span>
                        </button>

                        {/* Documentos */}
                        <button
                            onClick={() => handleNavigation('documents')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                currentView === 'documents' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Documentos</span>
                        </button>

                        {/* Analytics */}
                        <button
                            onClick={() => handleNavigation('analytics')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                currentView === 'analytics' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Analytics</span>
                        </button>

                        {/* Divider - Admin only section */}
                        {isAdmin && (
                            <>
                                <div className="my-2 border-t border-slate-700"></div>
                                <div className="px-4 py-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Administração
                                    </p>
                                </div>

                                {/* Gerenciar Stores */}
                                <button
                                    onClick={() => handleNavigation('stores')}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                        currentView === 'stores' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                    </svg>
                                    <span>Gerenciar Stores</span>
                                </button>

                                {/* Gerenciar Usuários */}
                                <button
                                    onClick={() => handleNavigation('users')}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                        currentView === 'users' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    <span>Gerenciar Usuários</span>
                                </button>

                                {/* Status dos Serviços */}
                                <button
                                    onClick={() => handleNavigation('status')}
                                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                        currentView === 'status' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Status dos Serviços</span>
                                </button>
                            </>
                        )}

                        {/* Divider */}
                        <div className="my-2 border-t border-slate-700"></div>

                        {/* Configurações */}
                        <button
                            onClick={() => handleNavigation('settings')}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700/50 transition-colors flex items-center space-x-3 ${
                                currentView === 'settings' ? 'bg-slate-700/50 text-blue-400' : 'text-slate-300'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>Configurações</span>
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors flex items-center space-x-3"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Sair</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
