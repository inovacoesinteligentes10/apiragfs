/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import DocumentsTable from './DocumentsTable';
import { ProcessedDocument } from '../types';
import { RagStore } from '../services/apiService';

interface DocumentsViewProps {
    files: File[];
    setFiles: (files: File[]) => void;
    onUpload: () => void;
    isApiKeySelected: boolean;
    onSelectKey: () => void;
    apiKeyError: string | null;
    isUploading: boolean;
    processedDocuments: ProcessedDocument[];
    onDeleteDocument: (id: string) => void;
    onMoveDocumentStore?: (documentId: string, targetStore: string) => void;
    stores?: RagStore[];
    selectedStore?: RagStore | null;
    onSelectStore?: (store: RagStore) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({
    files,
    setFiles,
    onUpload,
    isApiKeySelected,
    onSelectKey,
    apiKeyError,
    isUploading,
    processedDocuments,
    onDeleteDocument,
    onMoveDocumentStore,
    stores = [],
    selectedStore = null,
    onSelectStore
}) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            setFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    return (
        <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-800 mb-2">
                    Gerenciar Documentos
                </h1>
                <p className="text-lg text-slate-600">
                    Faça upload de seus documentos para análise com IA
                </p>
            </div>

            {/* Store Selector */}
            {stores.length > 0 && onSelectStore && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-3">
                                Selecione o Store/Departamento para Upload
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {stores.map((store) => {
                                    const getColorClass = (color: string | null) => {
                                        switch (color) {
                                            case 'blue': return 'from-blue-500 to-blue-600';
                                            case 'purple': return 'from-purple-500 to-purple-600';
                                            case 'green': return 'from-green-500 to-green-600';
                                            case 'red': return 'from-red-500 to-red-600';
                                            case 'yellow': return 'from-yellow-500 to-yellow-600';
                                            case 'orange': return 'from-orange-500 to-orange-600';
                                            case 'pink': return 'from-pink-500 to-pink-600';
                                            default: return 'from-gray-500 to-gray-600';
                                        }
                                    };

                                    return (
                                        <button
                                            key={store.id}
                                            onClick={() => onSelectStore(store)}
                                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                                selectedStore?.id === store.id
                                                    ? `bg-gradient-to-r ${getColorClass(store.color)} text-white shadow-md`
                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                        >
                                            <span>{store.display_name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedStore && (
                                <p className="mt-3 text-sm text-slate-600">
                                    Os documentos serão enviados para: <span className="font-semibold text-slate-800">{selectedStore.display_name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* API Error Warning */}
            {apiKeyError && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-md">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-red-800">Erro</h3>
                            <p className="text-red-700 mt-1">{apiKeyError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-3 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                >
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.txt,.doc,.docx"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-xl font-semibold text-slate-800 mb-2">
                            Arraste arquivos aqui ou clique para selecionar
                        </p>
                        <p className="text-sm text-slate-600">
                            Suporta PDF, TXT, DOC, DOCX
                        </p>
                    </label>
                </div>

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">
                            Arquivos Selecionados ({files.length})
                        </h3>
                        <div className="space-y-2">
                            {files.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                                >
                                    <div className="flex items-center space-x-3">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-slate-800">{file.name}</p>
                                            <p className="text-sm text-slate-500">
                                                {(file.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Upload Button */}
                        <button
                            onClick={onUpload}
                            disabled={isUploading}
                            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {isUploading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processando...
                                </span>
                            ) : (
                                `Processar ${files.length} ${files.length === 1 ? 'Documento' : 'Documentos'}`
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-8">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Como Funciona</h3>
                <ol className="space-y-2 text-blue-800">
                    <li className="flex items-start">
                        <span className="font-bold mr-2">1.</span>
                        <span>Faça upload de seus documentos (PDF, TXT, DOC, DOCX)</span>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2">2.</span>
                        <span>O sistema processará e criará embeddings do conteúdo</span>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2">3.</span>
                        <span>A IA indexará os documentos usando Google Gemini</span>
                    </li>
                    <li className="flex items-start">
                        <span className="font-bold mr-2">4.</span>
                        <span>Você poderá conversar com a IA sobre os documentos</span>
                    </li>
                </ol>
            </div>

            {/* Processed Documents Table */}
            {processedDocuments.length > 0 && (
                <>
                    {processedDocuments.some(doc => doc.status !== 'completed' && doc.status !== 'error') && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
                            <div className="flex items-start">
                                <svg className="w-6 h-6 text-blue-600 mt-0.5 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-blue-900">Processamento em andamento</h3>
                                    <p className="text-blue-800 mt-1">
                                        Seus documentos estão sendo processados em segundo plano.
                                        A tabela será atualizada automaticamente quando o processamento for concluído.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DocumentsTable
                        documents={processedDocuments}
                        onDelete={onDeleteDocument}
                        availableStores={stores.map(s => ({ name: s.name, display_name: s.display_name }))}
                        onMoveStore={onMoveDocumentStore}
                    />
                </>
            )}
        </div>
    );
};

export default DocumentsView;
