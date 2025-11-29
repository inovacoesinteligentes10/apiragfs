/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useMemo } from 'react';
import { RagStore } from '../services/apiService';
import { ProcessedDocument } from '../types';
import { useSystemConfig } from '../contexts/SystemConfigContext';

interface DashboardProps {
    onNavigateToDocuments: () => void;
    hasDocuments: boolean;
    stores?: RagStore[];
    documents?: ProcessedDocument[];
    onNavigateToStores?: () => void;
    onNavigateToChat?: () => void;
    onSelectStore?: (store: RagStore) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
    onNavigateToDocuments,
    hasDocuments,
    stores = [],
    documents = [],
    onNavigateToStores,
    onNavigateToChat,
    onSelectStore
}) => {
    const { config } = useSystemConfig();

    // Calcular estatísticas
    const stats = useMemo(() => {
        const totalDocs = documents.length;
        const completedDocs = documents.filter(d => d.status === 'completed').length;
        const processingDocs = documents.filter(d => d.status !== 'completed' && d.status !== 'error').length;
        const errorDocs = documents.filter(d => d.status === 'error').length;
        const totalChunks = documents.reduce((sum, d) => sum + (d.chunks || 0), 0);
        const totalSize = documents.reduce((sum, d) => sum + d.size, 0);
        const activeStores = stores.filter(s => s.document_count > 0).length;

        // Documentos de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const docsToday = documents.filter(d => {
            const uploadDate = new Date(d.uploadDate);
            uploadDate.setHours(0, 0, 0, 0);
            return uploadDate.getTime() === today.getTime();
        }).length;

        return {
            totalDocs,
            completedDocs,
            processingDocs,
            errorDocs,
            totalChunks,
            totalSize,
            activeStores,
            docsToday
        };
    }, [documents, stores]);

    // Distribuição de documentos por store
    const storeDistribution = useMemo(() => {
        const distribution: Record<string, number> = {};
        documents.forEach(doc => {
            if (doc.department) {
                distribution[doc.department] = (distribution[doc.department] || 0) + 1;
            }
        });
        return distribution;
    }, [documents]);

    // Atividades recentes (últimos 5 documentos)
    const recentActivities = useMemo(() => {
        return [...documents]
            .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
            .slice(0, 5);
    }, [documents]);

    const handleStoreClick = (store: RagStore) => {
        if (store.document_count > 0 && onSelectStore && onNavigateToChat) {
            onSelectStore(store);
            onNavigateToChat();
        }
    };

    const getColorClass = (color: string | null) => {
        switch (color) {
            case 'blue': return 'from-blue-500 to-blue-600';
            case 'purple': return 'from-purple-500 to-purple-600';
            case 'green': return 'from-green-500 to-green-600';
            case 'red': return 'from-red-500 to-red-600';
            case 'yellow': return 'from-yellow-500 to-yellow-600';
            case 'orange': return 'from-orange-500 to-orange-600';
            case 'pink': return 'from-pink-500 to-pink-600';
            case 'indigo': return 'from-indigo-500 to-indigo-600';
            case 'teal': return 'from-teal-500 to-teal-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const renderIcon = (iconName: string | null) => {
        const icons: Record<string, string> = {
            'folder': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
            'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            'shopping-cart': 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
            'cpu': 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z',
            'shield': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
            'dollar-sign': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            'briefcase': 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
            'chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        };

        const path = icons[iconName || 'folder'] || icons['folder'];
        return (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
            </svg>
        );
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getStatusIcon = (status: ProcessedDocument['status']) => {
        if (status === 'completed') {
            return (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            );
        } else if (status === 'error') {
            return (
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            );
        } else {
            return (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            );
        }
    };

    const getStatusLabel = (status: ProcessedDocument['status']) => {
        const labels: Record<string, string> = {
            'uploaded': 'Enviado',
            'extracting': 'Extraindo',
            'chunking': 'Fragmentando',
            'embedding': 'Vetorizando',
            'indexing': 'Indexando',
            'completed': 'Completo',
            'error': 'Erro'
        };
        return labels[status] || status;
    };

    return (
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                    Bem-vindo ao {config.systemName}
                </h1>
                <p className="text-lg text-slate-600">
                    {config.systemDescription}
                </p>
            </div>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Documentos */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total de Documentos</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                {stats.totalDocs}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {stats.completedDocs} completos
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Stores Ativos */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Stores Ativos</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                {stats.activeStores}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                de {stores.length} total
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Chunks */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Total de Chunks</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                {stats.totalChunks.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {formatBytes(stats.totalSize)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 7v13a2 2 0 002 2h12a2 2 0 002-2V7M4 7L6 4h12l2 3m-6 4v6m-4-6v6" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Hoje */}
                <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-600 font-medium">Hoje</p>
                            <p className="text-3xl font-bold text-slate-800 mt-2">
                                {stats.docsToday}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                documentos novos
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats e Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Status de Processamento */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Status de Processamento</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-sm font-medium text-slate-700">Completos</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">{stats.completedDocs}</span>
                        </div>
                        {stats.processingDocs > 0 && (
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-slate-700">Processando</span>
                                </div>
                                <span className="text-lg font-bold text-yellow-600">{stats.processingDocs}</span>
                            </div>
                        )}
                        {stats.errorDocs > 0 && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm font-medium text-slate-700">Com Erro</span>
                                </div>
                                <span className="text-lg font-bold text-red-600">{stats.errorDocs}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Health Status dos Stores */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Saúde dos RAG Stores</h3>
                    <div className="space-y-3">
                        {stores.filter(s => s.document_count > 0).slice(0, 3).map(store => (
                            <div key={store.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${getColorClass(store.color)} text-white`}>
                                        {renderIcon(store.icon)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{store.display_name}</p>
                                        <p className="text-xs text-slate-500">{store.document_count} docs</p>
                                    </div>
                                </div>
                                {store.rag_store_name ? (
                                    <span className="flex items-center space-x-1 text-xs text-green-600">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Ativo</span>
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400">Inativo</span>
                                )}
                            </div>
                        ))}
                        {stores.filter(s => s.document_count > 0).length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">Nenhum store ativo</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Gráfico de Distribuição e Atividades Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Distribuição por Store */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Distribuição por Store</h3>
                    {Object.keys(storeDistribution).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(storeDistribution)
                                .sort(([, a], [, b]) => b - a)
                                .map(([storeName, count]) => {
                                    const store = stores.find(s => s.name === storeName);
                                    const percentage = (count / stats.totalDocs) * 100;
                                    return (
                                        <div key={storeName}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">
                                                    {store?.display_name || storeName}
                                                </span>
                                                <span className="text-sm text-slate-600">{count} ({percentage.toFixed(0)}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full bg-gradient-to-r ${getColorClass(store?.color || null)}`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">Nenhum documento ainda</p>
                    )}
                </div>

                {/* Atividades Recentes */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Atividades Recentes</h3>
                    {recentActivities.length > 0 ? (
                        <div className="space-y-3">
                            {recentActivities.map((doc) => (
                                <div key={doc.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                                    {getStatusIcon(doc.status)}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-slate-500">{getStatusLabel(doc.status)}</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(doc.uploadDate).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 text-center py-8">Nenhuma atividade ainda</p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Ações Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={onNavigateToDocuments}
                        className="group p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-800 text-lg">Upload de Documentos</h3>
                                <p className="text-sm text-slate-600 mt-1">Adicione seus documentos para análise com IA</p>
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => onNavigateToStores && onNavigateToStores()}
                        className="group p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-slate-800 text-lg">Gerenciar Stores</h3>
                                <p className="text-sm text-slate-600 mt-1">Organize seus documentos por departamentos</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            {/* Stores Section */}
            {stores.length > 0 && (
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Seus Stores</h2>
                            <p className="text-slate-600 mt-1">Documentos organizados por departamentos/contextos</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {stores.map((store) => (
                            <button
                                key={store.id}
                                onClick={() => handleStoreClick(store)}
                                disabled={store.document_count === 0}
                                className={`text-left p-5 rounded-xl border-2 transition-all ${
                                    store.document_count > 0
                                        ? 'border-slate-200 hover:border-blue-400 hover:shadow-lg cursor-pointer'
                                        : 'border-slate-100 opacity-60 cursor-not-allowed'
                                } bg-white`}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${getColorClass(store.color)} text-white`}>
                                        {renderIcon(store.icon)}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-bold text-slate-800">{store.document_count}</span>
                                        <span className="text-xs text-slate-500">docs</span>
                                    </div>
                                </div>
                                <h3 className="font-semibold text-slate-800 text-lg mb-1">{store.display_name}</h3>
                                {store.description && (
                                    <p className="text-sm text-slate-600 line-clamp-2">{store.description}</p>
                                )}
                                {store.rag_store_name && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <span className="inline-flex items-center space-x-1 text-xs text-green-600">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span>RAG Ativo</span>
                                        </span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
                    <h3 className="text-xl font-bold mb-3">Sobre o {config.systemName}</h3>
                    <p className="text-blue-100 mb-4">
                        {config.systemDescription}
                    </p>
                    <div className="flex items-center space-x-2 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Powered by Google Gemini 2.5 Flash</span>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Recursos</h3>
                    <ul className="space-y-3">
                        <li className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-700">Respostas baseadas em documentos oficiais</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-700">Citações literais e verificáveis</span>
                        </li>
                        <li className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-green-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-slate-700">Adaptado para diferentes perfis de usuário</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
