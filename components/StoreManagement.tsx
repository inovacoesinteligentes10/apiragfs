/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { apiService, RagStore, RagStoreCreate } from '../services/apiService';

const StoreManagement: React.FC = () => {
    const [stores, setStores] = useState<RagStore[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<RagStore | null>(null);
    const [formData, setFormData] = useState<RagStoreCreate>({
        name: '',
        display_name: '',
        description: '',
        icon: 'folder',
        color: 'blue'
    });
    const [error, setError] = useState<string | null>(null);

    const iconOptions = [
        { value: 'folder', label: 'Pasta', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { value: 'users', label: 'Usuários', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { value: 'shopping-cart', label: 'Carrinho', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { value: 'cpu', label: 'CPU/TI', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
        { value: 'shield', label: 'Escudo', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
        { value: 'dollar-sign', label: 'Dinheiro', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { value: 'briefcase', label: 'Maleta', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { value: 'chart', label: 'Gráfico', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
    ];

    const colorOptions = [
        { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
        { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
        { value: 'green', label: 'Verde', class: 'bg-green-500' },
        { value: 'red', label: 'Vermelho', class: 'bg-red-500' },
        { value: 'yellow', label: 'Amarelo', class: 'bg-yellow-500' },
        { value: 'orange', label: 'Laranja', class: 'bg-orange-500' },
        { value: 'pink', label: 'Rosa', class: 'bg-pink-500' },
        { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
        { value: 'teal', label: 'Azul-esverdeado', class: 'bg-teal-500' },
        { value: 'gray', label: 'Cinza', class: 'bg-gray-500' }
    ];

    useEffect(() => {
        loadStores();
    }, []);

    const loadStores = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.listRagStores();
            setStores(data);
        } catch (err) {
            setError('Erro ao carregar stores: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (store?: RagStore) => {
        if (store) {
            setEditingStore(store);
            setFormData({
                name: store.name,
                display_name: store.display_name,
                description: store.description || '',
                icon: store.icon || 'folder',
                color: store.color || 'blue'
            });
        } else {
            setEditingStore(null);
            setFormData({
                name: '',
                display_name: '',
                description: '',
                icon: 'folder',
                color: 'blue'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStore(null);
        setFormData({
            name: '',
            display_name: '',
            description: '',
            icon: 'folder',
            color: 'blue'
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            if (editingStore) {
                await apiService.updateRagStore(editingStore.name, formData);
                await loadStores();
                handleCloseModal();
            } else {
                await apiService.createRagStore(formData);
                await loadStores();
                handleCloseModal();
            }
        } catch (err) {
            setError('Erro ao salvar store: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const handleDelete = async (storeName: string) => {
        if (!confirm(`Tem certeza que deseja deletar o store "${storeName}"? Esta ação não pode ser desfeita.`)) {
            return;
        }

        setError(null);
        try {
            await apiService.deleteRagStore(storeName);
            await loadStores();
        } catch (err) {
            setError('Erro ao deletar store: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    const getColorClass = (color: string | null) => {
        const option = colorOptions.find(o => o.value === color);
        return option?.class || 'bg-gray-500';
    };

    const renderIcon = (iconName: string | null) => {
        const icon = iconOptions.find(i => i.value === iconName);
        if (!icon) return null;

        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.icon} />
            </svg>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-slate-600">Carregando stores...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gerenciamento de Stores</h1>
                    <p className="text-slate-600 mt-2">Gerencie os stores/departamentos do sistema</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Novo Store</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-lg">
                    {error}
                </div>
            )}

            {/* Stores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <div
                        key={store.id}
                        className="bg-white rounded-xl shadow-lg border border-slate-200 hover:shadow-xl transition-all overflow-hidden"
                    >
                        {/* Store Header */}
                        <div className={`${getColorClass(store.color)} p-6 text-white`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-white/20 p-3 rounded-lg">
                                        {renderIcon(store.icon)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">{store.display_name}</h3>
                                        <p className="text-sm opacity-90">/{store.name}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Store Body */}
                        <div className="p-6">
                            {store.description && (
                                <p className="text-slate-600 text-sm mb-4">{store.description}</p>
                            )}

                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2 text-slate-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-semibold">{store.document_count}</span>
                                    <span>documentos</span>
                                </div>

                                {store.rag_store_name && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                        RAG Ativo
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
                                <button
                                    onClick={() => handleOpenModal(store)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar store"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDelete(store.name)}
                                    disabled={store.document_count > 0}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={store.document_count > 0 ? 'Não é possível deletar store com documentos' : 'Deletar store'}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {stores.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum store encontrado</h3>
                    <p className="text-slate-500">Clique em "Novo Store" para criar o primeiro</p>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={handleCloseModal}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-200">
                            <h2 className="text-2xl font-bold text-slate-800">
                                {editingStore ? 'Editar Store' : 'Novo Store'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nome (slug) *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') })}
                                    placeholder="ex: ti, rh, financeiro"
                                    required
                                    disabled={!!editingStore}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                                />
                                <p className="mt-1 text-xs text-slate-500">Apenas letras minúsculas, números, hífens e underscores</p>
                            </div>

                            {/* Display Name */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Nome de Exibição *
                                </label>
                                <input
                                    type="text"
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="ex: TI, Recursos Humanos, Financeiro"
                                    required
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Descrição opcional do store"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Ícone */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Ícone
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {iconOptions.map((icon) => (
                                        <button
                                            key={icon.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: icon.value })}
                                            className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
                                                formData.icon === icon.value
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.icon} />
                                            </svg>
                                            <span className="text-sm">{icon.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Cor */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Cor
                                </label>
                                <div className="grid grid-cols-5 gap-3">
                                    {colorOptions.map((color) => (
                                        <button
                                            key={color.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color.value })}
                                            className={`flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-all ${
                                                formData.color === color.value
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full ${color.class}`}></div>
                                            <span className="text-xs">{color.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                                >
                                    {editingStore ? 'Salvar' : 'Criar Store'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StoreManagement;
