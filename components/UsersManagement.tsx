/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { User, UserFormData } from '../types';
import { showSuccess, showError, showWarning } from '../utils/toast';
import Spinner from './Spinner';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface UsersManagementProps {}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const UsersManagement: React.FC<UsersManagementProps> = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        userId: string | null;
        userName: string | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        userId: null,
        userName: null,
        isDeleting: false
    });

    const [formData, setFormData] = useState<UserFormData>({
        email: '',
        name: '',
        role: 'student',
        password: '',
        is_active: true
    });

    const [stats, setStats] = useState<{
        total_users: number;
        active_users: number;
        inactive_users: number;
        admin_count: number;
        professor_count: number;
        student_count: number;
        new_users_week: number;
        active_users_week: number;
    } | null>(null);

    // Carregar usuários
    const loadUsers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                showError('Você precisa estar autenticado');
                return;
            }

            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (roleFilter !== 'all') params.append('role', roleFilter);
            if (statusFilter !== 'all') params.append('is_active', statusFilter);

            const response = await fetch(`${API_BASE_URL}/api/v1/users?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro ao carregar usuários');
            }

            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            showError(`Erro ao carregar usuários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Carregar estatísticas
    const loadStats = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/v1/users/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    };

    useEffect(() => {
        loadUsers();
        loadStats();
    }, [searchTerm, roleFilter, statusFilter]);

    // Criar/Atualizar usuário
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                showError('Você precisa estar autenticado');
                return;
            }

            const url = editingUser
                ? `${API_BASE_URL}/api/v1/users/${editingUser.id}`
                : `${API_BASE_URL}/api/v1/users`;

            const method = editingUser ? 'PUT' : 'POST';

            // Se estiver editando e não alterou a senha, não enviar o campo password
            const payload = { ...formData };
            if (editingUser && !payload.password) {
                delete payload.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro ao salvar usuário');
            }

            showSuccess(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
            setShowModal(false);
            setEditingUser(null);
            resetForm();
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            showError(`Erro ao salvar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };

    // Deletar usuário
    const handleDelete = async () => {
        if (!deleteModal.userId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                showError('Você precisa estar autenticado');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/users/${deleteModal.userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro ao deletar usuário');
            }

            showSuccess(`Usuário "${deleteModal.userName}" deletado com sucesso!`);
            setDeleteModal({ isOpen: false, userId: null, userName: null, isDeleting: false });
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Erro ao deletar usuário:', error);
            showError(`Erro ao deletar usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    // Alternar status ativo/inativo
    const handleToggleStatus = async (userId: string) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                showError('Você precisa estar autenticado');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/v1/users/${userId}/toggle-status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Erro ao alterar status');
            }

            showSuccess('Status do usuário alterado com sucesso!');
            loadUsers();
            loadStats();
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            showError(`Erro ao alterar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            name: '',
            role: 'student',
            password: '',
            is_active: true
        });
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name,
            role: user.role,
            password: '',
            is_active: user.is_active
        });
        setShowModal(true);
    };

    const handleNew = () => {
        setEditingUser(null);
        resetForm();
        setShowModal(true);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'professor':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrador';
            case 'professor':
                return 'Professor';
            case 'student':
                return 'Estudante';
            default:
                return role;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Gerenciamento de Usuários</h1>
                    <p className="text-slate-600">Gerencie usuários, permissões e acessos do sistema</p>
                </div>

                {/* Estatísticas */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Total de Usuários</p>
                                    <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total_users}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Usuários Ativos</p>
                                    <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_users}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Novos (7 dias)</p>
                                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.new_users_week}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-600">Ativos (7 dias)</p>
                                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats.active_users_week}</p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros e Ações */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-4 flex-1 w-full">
                            {/* Busca */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Buscar por nome ou email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Filtro Role */}
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todas as funções</option>
                                <option value="admin">Admin</option>
                                <option value="professor">Professor</option>
                                <option value="student">Estudante</option>
                            </select>

                            {/* Filtro Status */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos os status</option>
                                <option value="true">Ativos</option>
                                <option value="false">Inativos</option>
                            </select>
                        </div>

                        {/* Botão Novo Usuário */}
                        <button
                            onClick={handleNew}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-semibold whitespace-nowrap"
                        >
                            + Novo Usuário
                        </button>
                    </div>
                </div>

                {/* Tabela de Usuários */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Estatísticas</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Último Acesso</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum usuário encontrado
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-800">{user.name}</div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                                user.is_active
                                                    ? 'bg-green-100 text-green-800 border-green-200'
                                                    : 'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                                {user.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">
                                                <div>{user.stats?.total_documents || 0} docs</div>
                                                <div className="text-xs text-slate-400">{user.stats?.total_sessions || 0} sessões</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600">
                                                {user.last_login
                                                    ? new Date(user.last_login).toLocaleString('pt-BR')
                                                    : 'Nunca'
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium"
                                                    title="Editar usuário"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user.id)}
                                                    className={`px-3 py-1 rounded-md transition-colors text-sm font-medium ${
                                                        user.is_active
                                                            ? 'text-orange-600 hover:bg-orange-50'
                                                            : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                                                >
                                                    {user.is_active ? 'Desativar' : 'Ativar'}
                                                </button>
                                                <button
                                                    onClick={() => setDeleteModal({
                                                        isOpen: true,
                                                        userId: user.id,
                                                        userName: user.name,
                                                        isDeleting: false
                                                    })}
                                                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm font-medium"
                                                    title="Deletar usuário"
                                                >
                                                    Deletar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Criação/Edição */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Função</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'professor' | 'admin' })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="student">Estudante</option>
                                    <option value="professor">Professor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Senha {editingUser && '(deixe em branco para não alterar)'}
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required={!editingUser}
                                    minLength={6}
                                    placeholder={editingUser ? 'Nova senha (opcional)' : 'Senha (mínimo 6 caracteres)'}
                                />
                            </div>

                            {editingUser && (
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                                        Usuário ativo
                                    </label>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingUser(null);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-semibold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md font-semibold"
                                >
                                    {editingUser ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Confirmação de Exclusão */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, userId: null, userName: null, isDeleting: false })}
                onConfirm={handleDelete}
                title="Excluir Usuário"
                message="Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
                documentName={deleteModal.userName || undefined}
                isDeleting={deleteModal.isDeleting}
            />
        </div>
    );
};

export default UsersManagement;
