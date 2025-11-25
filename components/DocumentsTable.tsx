/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ProcessedDocument } from '../types';

interface DocumentsTableProps {
    documents: ProcessedDocument[];
    onDelete?: (id: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onDelete }) => {
    console.log('📊 DocumentsTable renderizado com', documents.length, 'documentos');
    console.log('📄 Primeiro documento:', documents[0]);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<keyof ProcessedDocument>('uploadDate');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Ordenação
    const sortedDocuments = [...documents].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === undefined || bValue === undefined) return 0;

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Paginação
    const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentDocuments = sortedDocuments.slice(startIndex, endIndex);

    const handleSort = (field: keyof ProcessedDocument) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    };

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const getStatusBadge = (status: ProcessedDocument['status'], statusMessage?: string | null) => {
        console.log('🔍 Status recebido:', status, 'Mensagem:', statusMessage);

        // Mapeamento direto de status para cores e labels
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let borderColor = 'border-gray-300';
        let label = 'Desconhecido';

        switch(status) {
            case 'uploaded':
                bgColor = 'bg-blue-100';
                textColor = 'text-blue-800';
                borderColor = 'border-blue-300';
                label = 'Enviado';
                break;
            case 'extracting':
                bgColor = 'bg-purple-100';
                textColor = 'text-purple-800';
                borderColor = 'border-purple-300';
                label = 'Extraindo';
                break;
            case 'chunking':
                bgColor = 'bg-indigo-100';
                textColor = 'text-indigo-800';
                borderColor = 'border-indigo-300';
                label = 'Fragmentando';
                break;
            case 'embedding':
                bgColor = 'bg-violet-100';
                textColor = 'text-violet-800';
                borderColor = 'border-violet-300';
                label = 'Vetorizando';
                break;
            case 'indexing':
                bgColor = 'bg-cyan-100';
                textColor = 'text-cyan-800';
                borderColor = 'border-cyan-300';
                label = 'Indexando';
                break;
            case 'completed':
                bgColor = 'bg-green-100';
                textColor = 'text-green-800';
                borderColor = 'border-green-300';
                label = 'Completo';
                break;
            case 'error':
                bgColor = 'bg-red-100';
                textColor = 'text-red-800';
                borderColor = 'border-red-300';
                label = 'Erro';
                break;
            default:
                console.warn(`Status desconhecido: "${status}"`);
                label = status || 'Desconhecido';
        }

        const isProcessing = status !== 'completed' && status !== 'error';

        // Renderização super simples para debug
        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                <div
                    className={`${bgColor} ${textColor} ${borderColor}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid',
                        maxWidth: 'fit-content'
                    }}
                >
                    {isProcessing && (
                        <svg className="animate-spin" style={{width: '12px', height: '12px'}} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle style={{opacity: 0.25}} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path style={{opacity: 0.75}} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    <span style={{color: 'inherit'}}>{label}</span>
                </div>
                {statusMessage && (
                    <div style={{fontSize: '11px', color: '#64748b'}}>{statusMessage}</div>
                )}
            </div>
        );
    };

    const SortIcon = ({ field }: { field: keyof ProcessedDocument }) => {
        if (sortField !== field) {
            return (
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
            );
        }

        return sortDirection === 'asc' ? (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        ) : (
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        );
    };

    if (documents.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum documento processado</h3>
                <p className="text-slate-500">Faça upload de documentos para começar</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Documentos Processados</h2>
                    <p className="text-sm text-slate-600 mt-1">
                        {documents.length} {documents.length === 1 ? 'documento' : 'documentos'} no total
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <label className="text-sm text-slate-600">Itens por página:</label>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="border border-slate-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Documento</span>
                                    <SortIcon field="name" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('type')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Tipo</span>
                                    <SortIcon field="type" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('size')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Tamanho</span>
                                    <SortIcon field="size" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('textLength')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Texto</span>
                                    <SortIcon field="textLength" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Extração
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('chunks')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Chunks</span>
                                    <SortIcon field="chunks" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('processingTime')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Tempo</span>
                                    <SortIcon field="processingTime" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Status</span>
                                    <SortIcon field="status" />
                                </div>
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('uploadDate')}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>Data</span>
                                    <SortIcon field="uploadDate" />
                                </div>
                            </th>
                            {onDelete && (
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                    Ações
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {currentDocuments.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div>
                                            <div className="text-sm font-medium text-slate-900">{doc.name}</div>
                                            {doc.error && <div className="text-xs text-red-600">{doc.error}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                                        {doc.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {formatBytes(doc.size)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {doc.textLength ? `${doc.textLength.toLocaleString()} chars` : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {doc.extractionMethod || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {doc.chunks !== null && doc.chunks !== undefined ? doc.chunks : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {doc.processingTime ? formatTime(doc.processingTime) : '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2 min-w-[150px]">
                                        {getStatusBadge(doc.status, doc.statusMessage)}
                                        {doc.progressPercent !== null && doc.status !== 'completed' && doc.status !== 'error' && (
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${doc.progressPercent}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                    {formatDate(doc.uploadDate)}
                                </td>
                                {onDelete && (
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => onDelete(doc.id)}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                                            title="Deletar documento"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, documents.length)} de {documents.length} documentos
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Anterior
                        </button>

                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            // Show first, last, current, and adjacent pages
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return <span key={page} className="px-2 text-slate-400">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsTable;
