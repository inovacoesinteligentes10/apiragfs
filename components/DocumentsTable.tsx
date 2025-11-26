/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo } from 'react';
import { ProcessedDocument } from '../types';

interface DocumentsTableProps {
    documents: ProcessedDocument[];
    onDelete?: (id: string) => void;
    availableStores?: Array<{ name: string; display_name: string }>;
    onMoveStore?: (documentId: string, targetStore: string) => void;
}

type ViewMode = 'list' | 'grid';

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onDelete, availableStores, onMoveStore }) => {
    console.log('📊 DocumentsTable renderizado com', documents.length, 'documentos');
    console.log('📄 Primeiro documento:', documents[0]);

    // Estados básicos
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof ProcessedDocument>('uploadDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [movingDocument, setMovingDocument] = useState<string | null>(null);

    // Novos estados para filtros e seleção
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [storeFilter, setStoreFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [previewDocument, setPreviewDocument] = useState<ProcessedDocument | null>(null);

    // Filtros aplicados
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            // Filtro de busca
            if (searchTerm && !doc.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            // Filtro de status
            if (statusFilter !== 'all' && doc.status !== statusFilter) {
                return false;
            }
            // Filtro de store
            if (storeFilter !== 'all' && doc.department !== storeFilter) {
                return false;
            }
            // Filtro de tipo
            if (typeFilter !== 'all' && doc.type !== typeFilter) {
                return false;
            }
            return true;
        });
    }, [documents, searchTerm, statusFilter, storeFilter, typeFilter]);

    // Ordenação
    const sortedDocuments = useMemo(() => {
        return [...filteredDocuments].sort((a, b) => {
            const aValue = a[sortField];
            const bValue = b[sortField];

            if (aValue === undefined || bValue === undefined) return 0;

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [filteredDocuments, sortField, sortDirection]);

    // Paginação
    const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDocuments = sortedDocuments.slice(startIndex, endIndex);

    // Obter valores únicos para filtros
    const uniqueStatuses = useMemo(() => {
        return Array.from(new Set(documents.map(d => d.status)));
    }, [documents]);

    const uniqueStores = useMemo(() => {
        return Array.from(new Set(documents.map(d => d.department).filter(Boolean)));
    }, [documents]);

    const uniqueTypes = useMemo(() => {
        return Array.from(new Set(documents.map(d => d.type)));
    }, [documents]);

    const handleSort = (field: keyof ProcessedDocument) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleMoveStore = async (documentId: string, targetStore: string) => {
        if (!onMoveStore) return;

        setMovingDocument(documentId);
        try {
            await onMoveStore(documentId, targetStore);
        } finally {
            setMovingDocument(null);
        }
    };

    // Seleção múltipla
    const handleSelectAll = () => {
        if (selectedDocuments.size === currentDocuments.length) {
            setSelectedDocuments(new Set());
        } else {
            setSelectedDocuments(new Set(currentDocuments.map(d => d.id)));
        }
    };

    const handleSelectDocument = (id: string) => {
        const newSelected = new Set(selectedDocuments);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDocuments(newSelected);
    };

    // Ações em massa
    const handleBulkDelete = async () => {
        if (!onDelete || selectedDocuments.size === 0) return;

        if (confirm(`Deseja realmente deletar ${selectedDocuments.size} documento(s)?`)) {
            for (const id of selectedDocuments) {
                await onDelete(id);
            }
            setSelectedDocuments(new Set());
        }
    };

    const handleBulkMove = async (targetStore: string) => {
        if (!onMoveStore || selectedDocuments.size === 0) return;

        for (const id of selectedDocuments) {
            await handleMoveStore(id, targetStore);
        }
        setSelectedDocuments(new Set());
    };

    // Exportar CSV
    const handleExportCSV = () => {
        const headers = ['Nome', 'Tipo', 'Tamanho', 'Store', 'Status', 'Chunks', 'Data Upload'];
        const rows = filteredDocuments.map(doc => [
            doc.name,
            doc.type,
            formatBytes(doc.size),
            doc.departmentDisplayName || doc.department || '-',
            getStatusLabel(doc.status),
            doc.chunks?.toString() || '-',
            new Date(doc.uploadDate).toLocaleString('pt-BR')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `documentos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

    const getStatusColor = (status: ProcessedDocument['status']) => {
        const colors: Record<string, string> = {
            'uploaded': 'bg-blue-100 text-blue-800',
            'extracting': 'bg-yellow-100 text-yellow-800',
            'chunking': 'bg-orange-100 text-orange-800',
            'embedding': 'bg-purple-100 text-purple-800',
            'indexing': 'bg-indigo-100 text-indigo-800',
            'completed': 'bg-green-100 text-green-800',
            'error': 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-4">
            {/* Barra de Ferramentas */}
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
                {/* Busca e Ações */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Barra de Busca */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar documentos por nome..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Exportar CSV</span>
                        </button>

                        {/* Toggle View */}
                        <div className="flex border border-slate-300 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
                                title="Visualização em lista"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}
                                title="Visualização em grade"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Filtro de Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Status</option>
                        {uniqueStatuses.map(status => (
                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                        ))}
                    </select>

                    {/* Filtro de Store */}
                    <select
                        value={storeFilter}
                        onChange={(e) => setStoreFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Stores</option>
                        {uniqueStores.map(store => {
                            const storeInfo = availableStores?.find(s => s.name === store);
                            return (
                                <option key={store} value={store}>
                                    {storeInfo?.display_name || store}
                                </option>
                            );
                        })}
                    </select>

                    {/* Filtro de Tipo */}
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos os Tipos</option>
                        {uniqueTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>

                    {/* Limpar Filtros */}
                    {(searchTerm || statusFilter !== 'all' || storeFilter !== 'all' || typeFilter !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('all');
                                setStoreFilter('all');
                                setTypeFilter('all');
                            }}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Limpar Filtros
                        </button>
                    )}
                </div>

                {/* Ações em Massa */}
                {selectedDocuments.size > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-900">
                            {selectedDocuments.size} documento(s) selecionado(s)
                        </span>
                        <div className="flex gap-2">
                            {onMoveStore && availableStores && availableStores.length > 0 && (
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkMove(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="text-sm border border-blue-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Mover para...</option>
                                    {availableStores.map(store => (
                                        <option key={store.name} value={store.name}>
                                            {store.display_name}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {onDelete && (
                                <button
                                    onClick={handleBulkDelete}
                                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                >
                                    Deletar Selecionados
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedDocuments(new Set())}
                                className="px-3 py-1 text-slate-600 hover:bg-slate-200 text-sm rounded transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contador de Resultados */}
            <div className="text-sm text-slate-600">
                Mostrando {startIndex + 1}-{Math.min(endIndex, sortedDocuments.length)} de {sortedDocuments.length} documentos
                {filteredDocuments.length !== documents.length && ` (${documents.length} no total)`}
            </div>

            {/* Visualização Lista */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedDocuments.size === currentDocuments.length && currentDocuments.length > 0}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Nome</span>
                                            {sortField === 'name' && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                        onClick={() => handleSort('type')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Tipo</span>
                                            {sortField === 'type' && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                        onClick={() => handleSort('size')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Tamanho</span>
                                            {sortField === 'size' && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Store
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                        onClick={() => handleSort('status')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Status</span>
                                            {sortField === 'status' && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                        Chunks
                                    </th>
                                    <th
                                        className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                        onClick={() => handleSort('uploadDate')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Data Upload</span>
                                            {sortField === 'uploadDate' && (
                                                <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    {(onDelete || onMoveStore) && (
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {currentDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.has(doc.id)}
                                                onChange={() => handleSelectDocument(doc.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setPreviewDocument(doc)}
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline text-left"
                                            >
                                                {doc.name}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                                                {doc.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {formatBytes(doc.size)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            {doc.departmentDisplayName || doc.department || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                                                {getStatusLabel(doc.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {doc.chunks?.toLocaleString() || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                            {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                                        </td>
                                        {(onDelete || onMoveStore) && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center space-x-2">
                                                    {onMoveStore && availableStores && availableStores.length > 1 && (
                                                        <div className="relative group">
                                                            <select
                                                                value={doc.department || ''}
                                                                onChange={(e) => handleMoveStore(doc.id, e.target.value)}
                                                                disabled={movingDocument === doc.id || doc.status !== 'completed'}
                                                                className="text-xs border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-blue-50 transition-colors"
                                                                title="Mover para outro store"
                                                            >
                                                                <option value="" disabled>Mover para...</option>
                                                                {availableStores
                                                                    .filter(store => store.name !== doc.department)
                                                                    .map(store => (
                                                                        <option key={store.name} value={store.name}>
                                                                            {store.display_name}
                                                                        </option>
                                                                    ))}
                                                            </select>
                                                            {movingDocument === doc.id && (
                                                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                                                                    <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={() => onDelete(doc.id)}
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                                            title="Deletar documento"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Visualização em Grid */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {currentDocuments.map((doc) => (
                        <div key={doc.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow relative">
                            <input
                                type="checkbox"
                                checked={selectedDocuments.has(doc.id)}
                                onChange={() => handleSelectDocument(doc.id)}
                                className="absolute top-3 left-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="pt-6">
                                <button
                                    onClick={() => setPreviewDocument(doc)}
                                    className="w-full text-left"
                                >
                                    <div className="flex items-center justify-center w-full h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-3">
                                        <svg className="w-16 h-16 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-slate-800 truncate mb-2">{doc.name}</h3>
                                </button>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Tipo:</span>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">{doc.type}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Tamanho:</span>
                                        <span className="text-slate-700">{formatBytes(doc.size)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Store:</span>
                                        <span className="text-slate-700 truncate max-w-[50%]">{doc.departmentDisplayName || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Status:</span>
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                                            {getStatusLabel(doc.status)}
                                        </span>
                                    </div>
                                    {doc.chunks !== null && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-500">Chunks:</span>
                                            <span className="text-slate-700">{doc.chunks.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-slate-700">Itens por página:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <span className="text-sm text-slate-700">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Preview */}
            {previewDocument && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-800">Detalhes do Documento</h2>
                            <button
                                onClick={() => setPreviewDocument(null)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Nome</label>
                                    <p className="text-slate-900 mt-1">{previewDocument.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Tipo</label>
                                        <p className="text-slate-900 mt-1">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-sm">{previewDocument.type}</span>
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Tamanho</label>
                                        <p className="text-slate-900 mt-1">{formatBytes(previewDocument.size)}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Store/Departamento</label>
                                        <p className="text-slate-900 mt-1">{previewDocument.departmentDisplayName || previewDocument.department || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-600">Status</label>
                                        <p className="mt-1">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(previewDocument.status)}`}>
                                                {getStatusLabel(previewDocument.status)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                {previewDocument.status === 'completed' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Chunks</label>
                                                <p className="text-slate-900 mt-1">{previewDocument.chunks?.toLocaleString() || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Tamanho do Texto</label>
                                                <p className="text-slate-900 mt-1">{previewDocument.textLength?.toLocaleString() || '-'} caracteres</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Método de Extração</label>
                                                <p className="text-slate-900 mt-1">{previewDocument.extractionMethod || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-slate-600">Tempo de Processamento</label>
                                                <p className="text-slate-900 mt-1">
                                                    {previewDocument.processingTime ? `${(previewDocument.processingTime / 1000).toFixed(2)}s` : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label className="text-sm font-medium text-slate-600">Data de Upload</label>
                                    <p className="text-slate-900 mt-1">
                                        {new Date(previewDocument.uploadDate).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                {previewDocument.error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <label className="text-sm font-medium text-red-800">Erro</label>
                                        <p className="text-red-700 mt-1 text-sm">{previewDocument.error}</p>
                                    </div>
                                )}
                                {previewDocument.statusMessage && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <label className="text-sm font-medium text-blue-800">Mensagem de Status</label>
                                        <p className="text-blue-700 mt-1 text-sm">{previewDocument.statusMessage}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
                            <button
                                onClick={() => setPreviewDocument(null)}
                                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {sortedDocuments.length === 0 && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum documento encontrado</h3>
                    <p className="text-slate-500">
                        {searchTerm || statusFilter !== 'all' || storeFilter !== 'all' || typeFilter !== 'all'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Faça upload de documentos para começar'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default DocumentsTable;
