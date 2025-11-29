/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { StorePermission, User } from '../types';
import { showSuccess, showError } from '../utils/toast';

interface StorePermissionsModalProps {
    storeId: string;
    storeName: string;
    isOpen: boolean;
    onClose: () => void;
}

const StorePermissionsModal: React.FC<StorePermissionsModalProps> = ({
    storeId,
    storeName,
    isOpen,
    onClose
}) => {
    const [permissions, setPermissions] = useState<StorePermission[]>([]);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAddingUser, setIsAddingUser] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadPermissions();
            loadAvailableUsers();
        }
    }, [isOpen, storeId]);

    const loadPermissions = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getStorePermissions(storeId);
            setPermissions(data);
        } catch (error) {
            showError('Erro ao carregar permissões');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableUsers = async () => {
        try {
            const users = await apiService.listUsers();
            setAvailableUsers(users);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const handleAddUser = async () => {
        if (!selectedUserId) {
            showError('Selecione um usuário');
            return;
        }

        setIsAddingUser(true);
        try {
            await apiService.addStorePermission(storeId, selectedUserId);
            showSuccess('Permissão adicionada com sucesso');
            setSelectedUserId('');
            await loadPermissions();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Erro ao adicionar permissão');
        } finally {
            setIsAddingUser(false);
        }
    };

    const handleRemoveUser = async (userId: string, userName: string) => {
        if (!confirm(`Remover acesso de ${userName}?`)) {
            return;
        }

        try {
            await apiService.removeStorePermission(storeId, userId);
            showSuccess(`Acesso de ${userName} removido`);
            await loadPermissions();
        } catch (error) {
            showError(error instanceof Error ? error.message : 'Erro ao remover permissão');
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'professor':
                return 'bg-blue-100 text-blue-800';
            case 'student':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            admin: 'Admin',
            professor: 'Professor',
            student: 'Estudante'
        };
        return labels[role] || role;
    };

    // Filtrar usuários que já têm permissão
    const usersWithoutPermission = availableUsers.filter(
        user => !permissions.some(p => p.user_id === user.id)
    );

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                Gerenciar Permissões
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Store: <span className="font-semibold">{storeName}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Add User Section */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Adicionar Usuário</h3>
                    <div className="flex space-x-3">
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isAddingUser}
                        >
                            <option value="">Selecione um usuário...</option>
                            {usersWithoutPermission.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email}) - {getRoleLabel(user.role)}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAddUser}
                            disabled={!selectedUserId || isAddingUser}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            {isAddingUser ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Adicionando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Adicionar</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Permissions List */}
                <div className="p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                        Usuários com Acesso ({permissions.length})
                    </h3>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    ) : permissions.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            <p className="text-gray-500">Nenhum usuário com acesso</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {permissions.map((permission) => (
                                <div
                                    key={permission.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {permission.user_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-800">{permission.user_name}</p>
                                            <p className="text-sm text-gray-600">{permission.user_email}</p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(permission.user_role)}`}>
                                            {getRoleLabel(permission.user_role)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveUser(permission.user_id, permission.user_name)}
                                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover acesso"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StorePermissionsModal;
