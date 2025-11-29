/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import { AppStatus, ChatMessage, ProcessedDocument } from './types';
import * as geminiService from './services/geminiService';
import { apiService, RagStore } from './services/apiService';
import { showSuccess, showError, showInfo, showWarning } from './utils/toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SystemConfigProvider } from './contexts/SystemConfigContext';
import Spinner from './components/Spinner';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import DocumentsView from './components/DocumentsView';
import DocumentsTable from './components/DocumentsTable';
import ProgressBar from './components/ProgressBar';
import ChatInterface from './components/ChatInterface';
import Analytics from './components/Analytics';
import StatusView from './components/StatusView';
import Settings from './components/Settings';
import StoreManagement from './components/StoreManagement';
import UsersManagement from './components/UsersManagement';
import ChatsView from './components/ChatsView';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import AuthModal from './components/AuthModal';
import UserMenu from './components/UserMenu';

// DO: Define the AIStudio interface to resolve a type conflict where `window.aistudio` was being redeclared with an anonymous type.
// FIX: Moved the AIStudio interface definition inside the `declare global` block to resolve a TypeScript type conflict.
declare global {
    interface AIStudio {
        openSelectKey: () => Promise<void>;
        hasSelectedApiKey: () => Promise<boolean>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const AppContent: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentView, setCurrentView] = useState<'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings' | 'stores' | 'users' | 'chats'>('dashboard');
    const [status, setStatus] = useState<AppStatus>(AppStatus.Welcome);
    const [isApiKeySelected, setIsApiKeySelected] = useState(false);
    const [apiKeyError, setApiKeyError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ current: number, total: number, message?: string, fileName?: string } | null>(null);
    const [activeRagStoreName, setActiveRagStoreName] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [isQueryLoading, setIsQueryLoading] = useState(false);
    const [exampleQuestions, setExampleQuestions] = useState<string[]>([]);
    const [insights, setInsights] = useState<Array<{title: string, description: string, icon: string}>>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
    const [ragStores, setRagStores] = useState<RagStore[]>([]);
    const [selectedStore, setSelectedStore] = useState<RagStore | null>(null);
    const ragStoreNameRef = useRef(activeRagStoreName);
    const isManualChatStart = useRef(false); // Flag para controlar início manual do chat
    const isStartingChat = useRef(false); // Flag para evitar chamadas duplicadas

    // Estado para o modal de confirmação de exclusão
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        documentId: string | null;
        documentName: string | null;
        isDeleting: boolean;
    }>({
        isOpen: false,
        documentId: null,
        documentName: null,
        isDeleting: false
    });

    useEffect(() => {
        ragStoreNameRef.current = activeRagStoreName;
    }, [activeRagStoreName]);

    // Recarregar todos os dados quando o usuário mudar (login/logout)
    useEffect(() => {
        const reloadAllData = async () => {
            if (!user) {
                // Limpar todos os dados ao fazer logout
                setProcessedDocuments([]);
                setRagStores([]);
                setSelectedStore(null);
                setChatHistory([]);
                setActiveRagStoreName(null);
                setCurrentView('dashboard');
                return;
            }

            // Recarregar stores
            try {
                const stores = await apiService.listRagStores();
                console.log('📦 RAG Stores recarregados para usuário:', user.username);
                setRagStores(stores);

                if (stores.length > 0) {
                    const storeWithDocs = stores.find(s => s.document_count > 0) || stores[0];
                    setSelectedStore(storeWithDocs);
                }
            } catch (err) {
                console.error('Erro ao recarregar stores:', err);
            }

            // Recarregar documentos
            try {
                const docs = await apiService.listDocuments();
                const stores = await apiService.listRagStores();
                const storeMap = new Map(stores.map(s => [s.name, s.display_name]));

                const processedDocs: ProcessedDocument[] = docs.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    size: doc.size,
                    textLength: doc.text_length,
                    extractionMethod: doc.extraction_method,
                    department: doc.department || null,
                    departmentDisplayName: doc.department ? storeMap.get(doc.department) || doc.department : null,
                    chunks: doc.chunks,
                    processingTime: doc.processing_time,
                    status: doc.status,
                    progressPercent: doc.progress_percent,
                    statusMessage: doc.status_message,
                    errorMessage: doc.error_message,
                    uploadDate: doc.upload_date
                }));

                setProcessedDocuments(processedDocs);
                console.log('📄 Documentos recarregados:', processedDocs.length);
            } catch (err) {
                console.error('Erro ao recarregar documentos:', err);
            }

            // Navegar para o chat após login bem-sucedido
            console.log('✅ Login bem-sucedido, navegando para chat...');
            setCurrentView('chat');
        };

        reloadAllData();
    }, [user?.id]); // Observa mudanças no ID do usuário
    
    const checkApiKey = useCallback(async () => {
        if (window.aistudio?.hasSelectedApiKey) {
            try {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsApiKeySelected(hasKey);
            } catch (e) {
                console.error("Error checking for API key:", e);
                setIsApiKeySelected(false); // Assume no key on error
            }
        } else {
            // Running in local environment, check for API key in env
            const hasKey = !!(process.env.API_KEY && process.env.API_KEY !== 'PLACEHOLDER_API_KEY');
            setIsApiKeySelected(hasKey);
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            // This event fires when the user switches to or from the tab.
            if (document.visibilityState === 'visible') {
                checkApiKey();
            }
        };
        
        checkApiKey(); // Initial check when the component mounts.

        // Listen for visibility changes and window focus. This ensures that if the user
        // changes the API key in another tab (like the AI Studio settings),
        // the app's state will update automatically when they return to this tab.
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', checkApiKey);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', checkApiKey);
        };
    }, [checkApiKey]);

    useEffect(() => {
        const handleUnload = () => {
            if (ragStoreNameRef.current) {
                geminiService.deleteRagStore(ragStoreNameRef.current)
                    .catch(err => console.error("Error deleting RAG store on unload:", err));
            }
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, []);


    const handleError = (message: string, err: any) => {
        console.error(message, err);
        setError(`${message}${err ? `: ${err instanceof Error ? err.message : String(err)}` : ''}`);
        setStatus(AppStatus.Error);
    };

    const clearError = () => {
        setError(null);
        setStatus(AppStatus.Welcome);
    }

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    // Carregar documentos existentes ao iniciar
    useEffect(() => {
        const loadDocuments = async () => {
            try {
                const docs = await apiService.listDocuments();

                // Buscar stores para mapear department -> display_name
                const stores = ragStores.length > 0 ? ragStores : await apiService.listRagStores();
                const storeMap = new Map(stores.map(s => [s.name, s.display_name]));

                const processedDocs: ProcessedDocument[] = docs.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    size: doc.size,
                    textLength: doc.text_length,
                    extractionMethod: doc.extraction_method,
                    department: doc.department || null,
                    departmentDisplayName: doc.department ? storeMap.get(doc.department) || doc.department : null,
                    chunks: doc.chunks,
                    processingTime: doc.processing_time,
                    status: doc.status,
                    progressPercent: doc.progress_percent,
                    statusMessage: doc.status_message,
                    ragStoreName: doc.rag_store_name,
                    uploadDate: new Date(doc.upload_date),
                    error: doc.error_message || undefined
                }));
                setProcessedDocuments(processedDocs);
            } catch (err) {
                console.error('Erro ao carregar documentos:', err);
            }
        };

        loadDocuments();
    }, [ragStores]);

    // Carregar RAG stores disponíveis
    useEffect(() => {
        const loadStores = async () => {
            // Só carregar stores se o usuário estiver logado
            if (!user) {
                console.log('⏸️ Usuário não logado, aguardando autenticação...');
                return;
            }

            try {
                console.log('🔄 Carregando RAG Stores para usuário:', user.username);
                const stores = await apiService.listRagStores();
                console.log('📦 RAG Stores carregados:', stores);
                console.log('📊 Stores com documentos:', stores.filter(s => s.document_count > 0).map(s => `${s.display_name} (${s.document_count} docs)`));
                setRagStores(stores);

                // Selecionar o primeiro store com documentos por padrão
                if (stores.length > 0 && !selectedStore) {
                    const storeWithDocs = stores.find(s => s.document_count > 0) || stores[0];
                    console.log('✅ Store selecionado por padrão:', storeWithDocs.display_name);
                    setSelectedStore(storeWithDocs);
                }
            } catch (err) {
                console.error('❌ Erro ao carregar stores:', err);
            }
        };

        loadStores();
    }, [user]); // Recarregar quando o usuário logar/deslogar

    // Polling para atualizar status de documentos em processamento
    useEffect(() => {
        const pollDocuments = async () => {
            // Verificar se há documentos em processamento (qualquer status exceto completed e error)
            const processingDocs = processedDocuments.filter(doc =>
                doc.status !== 'completed' && doc.status !== 'error'
            );

            if (processingDocs.length === 0) return;

            let shouldRefreshStores = false;

            try {
                // Atualizar apenas os documentos em processamento
                for (const doc of processingDocs) {
                    const updatedDoc = await apiService.getDocument(doc.id);

                    // Verificar se o status mudou de qualquer estado de processamento para completed
                    const wasProcessing = doc.status !== 'completed' && doc.status !== 'error';
                    const isNowCompleted = updatedDoc.status === 'completed';

                    // Mapear department -> display_name
                    const storeMap = new Map(ragStores.map(s => [s.name, s.display_name]));
                    const departmentDisplayName = updatedDoc.department
                        ? storeMap.get(updatedDoc.department) || updatedDoc.department
                        : null;

                    setProcessedDocuments(prev => prev.map(d =>
                        d.id === doc.id ? {
                            ...d,
                            textLength: updatedDoc.text_length,
                            extractionMethod: updatedDoc.extraction_method,
                            department: updatedDoc.department || null,
                            departmentDisplayName: departmentDisplayName,
                            chunks: updatedDoc.chunks,
                            processingTime: updatedDoc.processing_time,
                            status: updatedDoc.status,
                            progressPercent: updatedDoc.progress_percent,
                            statusMessage: updatedDoc.status_message,
                            ragStoreName: updatedDoc.rag_store_name,
                            error: updatedDoc.error_message || undefined
                        } : d
                    ));

                    // Notificar usuário quando processamento for concluído
                    if (wasProcessing && isNowCompleted) {
                        console.log(`✅ Documento "${doc.name}" processado com sucesso!`);
                        shouldRefreshStores = true; // Marcar para atualizar stores
                    } else if (wasProcessing && updatedDoc.status === 'error') {
                        console.error(`❌ Erro ao processar documento "${doc.name}"`);
                    }
                }

                // Atualizar stores quando documentos forem concluídos
                if (shouldRefreshStores) {
                    console.log('🔄 Atualizando contagem de documentos nos stores...');
                    try {
                        const updatedStores = await apiService.listRagStores();
                        setRagStores(updatedStores);

                        // Atualizar o store selecionado com os dados mais recentes
                        if (selectedStore) {
                            const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                            if (updatedSelectedStore) {
                                setSelectedStore(updatedSelectedStore);
                            }
                        }
                        console.log('✅ Stores atualizados com sucesso!');
                    } catch (err) {
                        console.error('Erro ao atualizar stores:', err);
                    }
                }
            } catch (err) {
                console.error('Erro ao atualizar documentos:', err);
            }
        };

        // Polling a cada 2 segundos se houver documentos em processamento
        const hasProcessing = processedDocuments.some(doc =>
            doc.status !== 'completed' && doc.status !== 'error'
        );
        if (hasProcessing) {
            const interval = setInterval(pollDocuments, 2000);
            return () => clearInterval(interval);
        }
    }, [processedDocuments, ragStores, selectedStore]);

    // Auto-iniciar chat quando navegar para view de chat e houver documentos
    useEffect(() => {
        const autoStartChat = async () => {
            // Só executar as verificações se estiver na view correta
            if (currentView !== 'chat' || status !== AppStatus.Welcome || activeRagStoreName || isManualChatStart.current) {
                return;
            }

            // Verificar se há documentos disponíveis (em stores OU em processamento)
            // IMPORTANTE: Não exigir rag_store_name - ele pode ser criado durante o chat
            const hasStoresWithDocs = ragStores.some(store => store.document_count > 0);
            const hasCompletedDocs = processedDocuments.some(doc => doc.status === 'completed');
            const hasDocuments = hasStoresWithDocs || hasCompletedDocs;

            console.log('🔍 Verificação de documentos:', {
                hasStoresWithDocs,
                hasCompletedDocs,
                hasDocuments,
                storesCount: ragStores.length,
                storesWithDocs: ragStores.filter(s => s.document_count > 0).map(s => ({
                    name: s.display_name,
                    count: s.document_count,
                    hasRagStore: !!s.rag_store_name
                }))
            });

            // Só iniciar automaticamente se houver documentos
            if (hasDocuments) {
                console.log('🔄 Auto-iniciando chat...');
                await handleStartChat();
            }
        };

        autoStartChat();
    }, [currentView, status]); // IMPORTANTE: Apenas currentView e status para evitar loops

    const handleSelectKey = async () => {
        if (window.aistudio?.openSelectKey) {
            try {
                await window.aistudio.openSelectKey();
                await checkApiKey(); // Check right after the dialog promise resolves
            } catch (err) {
                console.error("Failed to open API key selection dialog", err);
            }
        } else {
            console.log('Running in local environment. API key should be configured in .env.local');
            showInfo('Modo local: Configure sua GEMINI_API_KEY no arquivo .env.local');
        }
    };

    const handleUploadAndStartChat = async () => {
        if (files.length === 0) return;

        setStatus(AppStatus.Uploading);
        const totalSteps = files.length;
        setUploadProgress({ current: 0, total: totalSteps, message: "Fazendo upload dos documentos..." });

        try {
            // Upload de cada arquivo para o backend
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                setUploadProgress(prev => ({
                    ...(prev!),
                    current: i + 1,
                    message: "Enviando documentos...",
                    fileName: `(${i + 1}/${files.length}) ${file.name}`
                }));

                try {
                    // Upload via API backend com department do store selecionado
                    const department = selectedStore?.name || 'geral';

                    // Callback de progresso real
                    const onProgress = (progress: number, status: string, statusMessage?: string) => {
                        const statusMessages: Record<string, string> = {
                            'uploaded': 'Arquivo enviado',
                            'extracting': 'Extraindo texto',
                            'chunking': 'Dividindo em chunks',
                            'embedding': 'Gerando embeddings',
                            'indexing': 'Indexando no RAG',
                            'completed': 'Processamento completo',
                            'error': 'Erro no processamento'
                        };

                        setUploadProgress({
                            current: Math.round(progress),
                            total: 100,
                            message: statusMessage || statusMessages[status] || 'Processando...',
                            fileName: `(${i + 1}/${files.length}) ${file.name}`
                        });
                    };

                    // Upload assíncrono - não aguarda processamento completo
                    const uploadedDoc = await apiService.uploadDocument(file, department, onProgress, false);

                    // Buscar display_name do department
                    const storeMap = new Map(ragStores.map(s => [s.name, s.display_name]));

                    // Criar documento processado para exibição (pode estar ainda processando)
                    const doc: ProcessedDocument = {
                        id: uploadedDoc.id,
                        name: uploadedDoc.name,
                        type: uploadedDoc.type,
                        size: uploadedDoc.size,
                        textLength: uploadedDoc.text_length,
                        extractionMethod: uploadedDoc.extraction_method,
                        department: uploadedDoc.department || department,
                        departmentDisplayName: storeMap.get(uploadedDoc.department || department) || department,
                        chunks: uploadedDoc.chunks,
                        processingTime: uploadedDoc.processing_time,
                        status: uploadedDoc.status,  // Provavelmente 'uploaded' ou 'processing'
                        progressPercent: uploadedDoc.progress_percent,
                        statusMessage: uploadedDoc.status_message || 'Processando em background',
                        ragStoreName: uploadedDoc.rag_store_name,
                        uploadDate: new Date(uploadedDoc.upload_date)
                    };

                    setProcessedDocuments(prev => [...prev, doc]);
                    showSuccess(`Documento ${file.name} enviado! Processamento em background.`);

                } catch (err) {
                    const doc: ProcessedDocument = {
                        id: `error-${Date.now()}-${i}`,
                        name: file.name,
                        type: file.type || file.name.split('.').pop()?.toUpperCase() || 'Unknown',
                        size: file.size,
                        textLength: null,
                        extractionMethod: null,
                        chunks: null,
                        processingTime: null,
                        status: 'error',
                        progressPercent: 0,
                        statusMessage: 'Erro no upload',
                        error: err instanceof Error ? err.message : 'Upload failed',
                        uploadDate: new Date()
                    };

                    setProcessedDocuments(prev => [...prev, doc]);
                    showError(`Erro ao processar ${file.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
                    handleError("Falha ao fazer upload", err);
                }
            }

            setUploadProgress({ current: totalSteps, total: totalSteps, message: "Upload concluído! Atualizando stores...", fileName: "" });
            showSuccess(`${files.length} documento(s) enviado(s)! Processamento continua em background.`);

            // Aguardar um pouco mais para o backend atualizar a contagem
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Recarregar stores para atualizar contagem de documentos
            try {
                console.log('🔄 Atualizando contagem de documentos nos stores após upload...');
                const updatedStores = await apiService.listRagStores();
                setRagStores(updatedStores);

                // Atualizar o store selecionado com os dados mais recentes
                if (selectedStore) {
                    const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                    if (updatedSelectedStore) {
                        setSelectedStore(updatedSelectedStore);
                        console.log(`✅ Store "${selectedStore.display_name}" atualizado: ${updatedSelectedStore.document_count} documentos`);
                    }
                }
            } catch (err) {
                console.error('Erro ao recarregar stores:', err);
            }

            // Limpar arquivos selecionados e voltar ao estado normal
            setFiles([]);
            setStatus(AppStatus.Welcome);
        } catch (err) {
            handleError("Falha ao fazer upload", err);
        } finally {
            setUploadProgress(null);
        }
    };

    // Função para atualizar lista de documentos (usada pelo auto-refresh)
    const refreshDocuments = useCallback(async () => {
        try {
            const docs = await apiService.listDocuments();
            const stores = await apiService.listRagStores();
            const storeMap = new Map(stores.map(s => [s.name, s.display_name]));

            const processedDocs: ProcessedDocument[] = docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.type,
                size: doc.size,
                textLength: doc.text_length,
                extractionMethod: doc.extraction_method,
                department: doc.department || null,
                departmentDisplayName: doc.department ? storeMap.get(doc.department) || doc.department : null,
                chunks: doc.chunks,
                processingTime: doc.processing_time,
                status: doc.status,
                progressPercent: doc.progress_percent,
                statusMessage: doc.status_message,
                errorMessage: doc.error_message,
                uploadDate: doc.upload_date,
                ragStoreName: doc.rag_store_name
            }));

            setProcessedDocuments(processedDocs);
            console.log('🔄 Documentos atualizados:', processedDocs.length);
        } catch (err) {
            console.error('Erro ao atualizar documentos:', err);
        }
    }, []);

    const handleDeleteDocument = (id: string) => {
        // Encontrar o documento para obter o nome
        const document = processedDocuments.find(doc => doc.id === id);

        // Abrir modal de confirmação
        setDeleteModal({
            isOpen: true,
            documentId: id,
            documentName: document?.name || 'Documento desconhecido',
            isDeleting: false
        });
    };

    const confirmDeleteDocument = async () => {
        if (!deleteModal.documentId) return;

        // Marcar como deletando
        setDeleteModal(prev => ({ ...prev, isDeleting: true }));

        try {
            await apiService.deleteDocument(deleteModal.documentId);
            setProcessedDocuments(prev => prev.filter(doc => doc.id !== deleteModal.documentId));

            showSuccess(`Documento "${deleteModal.documentName}" excluído com sucesso!`);

            // Recarregar stores para atualizar contagem
            try {
                const updatedStores = await apiService.listRagStores();
                setRagStores(updatedStores);

                if (selectedStore) {
                    const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                    if (updatedSelectedStore) {
                        setSelectedStore(updatedSelectedStore);
                    }
                }
            } catch (err) {
                console.error('Erro ao recarregar stores:', err);
            }

            // Fechar modal
            setDeleteModal({
                isOpen: false,
                documentId: null,
                documentName: null,
                isDeleting: false
            });
        } catch (err) {
            console.error('Erro ao deletar documento:', err);
            showError(`Erro ao excluir documento: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const cancelDeleteDocument = () => {
        setDeleteModal({
            isOpen: false,
            documentId: null,
            documentName: null,
            isDeleting: false
        });
    };

    const handleBulkDeleteDocuments = async (documentIds: string[]) => {
        if (documentIds.length === 0) return;

        const documentNames = documentIds
            .map(id => processedDocuments.find(doc => doc.id === id)?.name)
            .filter(Boolean)
            .join(', ');

        // Confirmar deleção em lote
        const confirmMessage = documentIds.length === 1
            ? `Deseja realmente deletar o documento "${documentNames}"?`
            : `Deseja realmente deletar ${documentIds.length} documentos?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        try {
            // Deletar todos os documentos em paralelo
            const deletePromises = documentIds.map(id => apiService.deleteDocument(id));
            await Promise.all(deletePromises);

            // Atualizar estado removendo todos os documentos deletados
            setProcessedDocuments(prev => prev.filter(doc => !documentIds.includes(doc.id)));

            showSuccess(`${documentIds.length} documento(s) excluído(s) com sucesso!`);

            // Recarregar stores para atualizar contagem
            try {
                const updatedStores = await apiService.listRagStores();
                setRagStores(updatedStores);

                if (selectedStore) {
                    const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                    if (updatedSelectedStore) {
                        setSelectedStore(updatedSelectedStore);
                    }
                }
            } catch (err) {
                console.error('Erro ao recarregar stores:', err);
            }
        } catch (err) {
            console.error('Erro ao deletar documentos:', err);
            showError(`Erro ao excluir documentos: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
        }
    };

    const handleMoveDocumentStore = async (documentId: string, targetStore: string) => {
        try {
            // Chamar API para mover documento
            await apiService.moveDocumentToStore(documentId, targetStore);

            // Atualizar documento localmente para mostrar status de reprocessamento
            // Resetar todos os campos de processamento
            setProcessedDocuments(prev => prev.map(doc =>
                doc.id === documentId
                    ? {
                        ...doc,
                        department: targetStore,
                        status: 'uploaded',
                        progressPercent: 0,
                        statusMessage: null,
                        error: null,
                        ragStoreName: null,
                        textLength: null,
                        chunks: null,
                        processingTime: null,
                        extractionMethod: null
                    }
                    : doc
            ));

            // Recarregar stores para atualizar contagens
            try {
                const updatedStores = await apiService.listRagStores();
                setRagStores(updatedStores);

                if (selectedStore) {
                    const updatedSelectedStore = updatedStores.find(s => s.id === selectedStore.id);
                    if (updatedSelectedStore) {
                        setSelectedStore(updatedSelectedStore);
                    }
                }
            } catch (err) {
                console.error('Erro ao recarregar stores:', err);
            }
        } catch (err) {
            console.error('Erro ao mover documento:', err);
            showError('Erro ao mover documento. Por favor, tente novamente.');
        }
    };

    const handleSelectStore = async (store: RagStore) => {
        console.log('🔄 Mudando para store:', store.display_name);

        // Se já está em chat, reiniciar com o novo store
        if (status === AppStatus.Chatting) {
            // Encerrar chat atual
            if (activeRagStoreName) {
                apiService.deleteChatSession(activeRagStoreName).catch(err => {
                    console.error("Falha ao deletar sessão de chat:", err);
                });
            }

            setActiveRagStoreName(null);
            setChatHistory([]);
            setExampleQuestions([]);
            setInsights([]);
            setStatus(AppStatus.Welcome);
        }

        // Atualizar store selecionado
        setSelectedStore(store);

        // Se estiver na view de chat, iniciar automaticamente com o novo store
        if (currentView === 'chat' && store.rag_store_name) {
            await handleStartChatWithStore(store);
        }
    };

    const handleStartChatWithStore = async (store: RagStore, forceNewSession: boolean = false) => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🔍 DEBUG: handleStartChatWithStore - Início');
        console.log('📦 Store recebido:', {
            id: store.id,
            name: store.name,
            display_name: store.display_name,
            document_count: store.document_count,
            rag_store_name: store.rag_store_name
        });
        console.log('🆕 Forçar nova sessão:', forceNewSession);
        console.log('🚧 isStartingChat atual:', isStartingChat.current);
        console.log('═══════════════════════════════════════════════════════');

        // Evitar chamadas duplicadas
        if (isStartingChat.current) {
            console.warn('⚠️ Chat já está sendo iniciado. Ignorando chamada duplicada.');
            return;
        }

        isStartingChat.current = true;

        // Verificar se o store tem documentos
        if (!store.rag_store_name || store.document_count === 0) {
            console.warn('⚠️ Store sem documentos ou rag_store_name vazio');
            console.warn('⚠️ rag_store_name:', store.rag_store_name);
            console.warn('⚠️ document_count:', store.document_count);
            showWarning('Este store ainda não possui documentos. Faça upload de documentos antes de iniciar o chat.');
            setCurrentView('documents');
            isStartingChat.current = false;
            return;
        }

        try {
            console.log('🚀 Iniciando chat com store:', store.display_name);
            console.log('📝 RAG Store Name que será usado:', store.rag_store_name);

            setStatus(AppStatus.Uploading);
            setUploadProgress({ current: 0, total: 3, message: "Verificando sessões existentes..." });

            let session;

            if (forceNewSession) {
                // Criar SEMPRE uma nova sessão (usado em "New Chat")
                console.log('🆕 Criando NOVA sessão (forçado)...');
                console.log('🆕 RAG Store Name para criação:', store.rag_store_name);

                try {
                    session = await apiService.createChatSession(store.rag_store_name);
                    console.log('✅ Nova sessão criada com sucesso!');
                    console.log('✅ Session ID:', session.id);
                    console.log('✅ Session RAG Store:', session.rag_store_name);
                } catch (createError) {
                    console.error('❌ Erro ao criar sessão:', createError);
                    console.error('❌ Erro detalhado:', {
                        message: createError instanceof Error ? createError.message : String(createError),
                        stack: createError instanceof Error ? createError.stack : undefined
                    });
                    throw createError;
                }
            } else {
                // Reutilizar sessão existente se houver (comportamento padrão)
                console.log('🔍 Buscando sessões existentes...');
                const existingSessions = await apiService.listChatSessions();
                console.log('📋 Sessões encontradas:', existingSessions.length);
                console.log('📋 Detalhes das sessões:', existingSessions.map(s => ({
                    id: s.id,
                    rag_store_name: s.rag_store_name,
                    message_count: s.message_count
                })));

                const existingSession = existingSessions.find(s => s.rag_store_name === store.rag_store_name);

                if (existingSession) {
                    console.log('♻️ Reutilizando sessão existente:', existingSession.id);
                    console.log('♻️ RAG Store da sessão:', existingSession.rag_store_name);
                    session = existingSession;
                } else {
                    console.log('🆕 Criando nova sessão de chat...');
                    console.log('🆕 RAG Store Name para criação:', store.rag_store_name);

                    try {
                        session = await apiService.createChatSession(store.rag_store_name);
                        console.log('✅ Sessão criada com sucesso!');
                        console.log('✅ Session ID:', session.id);
                        console.log('✅ Session RAG Store:', session.rag_store_name);
                        console.log('✅ Sessão completa:', session);
                    } catch (createError) {
                        console.error('❌ Erro ao criar sessão:', createError);
                        console.error('❌ Erro detalhado:', {
                            message: createError instanceof Error ? createError.message : String(createError),
                            stack: createError instanceof Error ? createError.stack : undefined
                        });
                        throw createError;
                    }
                }
            }

            setUploadProgress({ current: 1, total: 3, message: "Carregando histórico..." });

            // Buscar mensagens anteriores (histórico completo da sessão)
            const messages = await apiService.getSessionMessages(session.id);
            const formattedHistory: ChatMessage[] = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
                groundingChunks: msg.grounding_chunks ? msg.grounding_chunks.map((chunk: any) => ({
                    retrievedContext: { text: chunk.text || '' }
                })) : undefined
            }));

            console.log(`📜 Histórico carregado: ${formattedHistory.length} mensagens`);

            setUploadProgress({ current: 2, total: 3, message: "Preparando chat..." });

            // Configurar estado do chat
            setActiveRagStoreName(session.id);
            setChatHistory(formattedHistory);
            setExampleQuestions([]);

            setUploadProgress({ current: 3, total: 3, message: "Pronto!" });

            // Buscar insights dos documentos
            try {
                const sessionInsights = await apiService.getSessionInsights(session.id);
                setInsights(sessionInsights);
            } catch (err) {
                console.error('Erro ao buscar insights:', err);
                setInsights([]);
            }

            await new Promise(resolve => setTimeout(resolve, 500));

            // Mudar status para Chatting (view já deve estar configurada por quem chamou)
            setStatus(AppStatus.Chatting);
        } catch (err) {
            console.error('❌ Erro ao iniciar chat:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            showError(`Erro ao iniciar chat: ${errorMessage}`);
            setStatus(AppStatus.Welcome);
        } finally {
            setUploadProgress(null);
            isStartingChat.current = false; // Resetar flag
            console.log('🔓 isStartingChat resetado para false');
        }
    };

    const handleStartChat = async () => {
        try {
            console.log('🚀 Iniciando chat...');
            console.log('📦 Total de stores:', ragStores.length);
            console.log('📦 Stores disponíveis:', ragStores.map(s => ({
                name: s.name,
                display_name: s.display_name,
                document_count: s.document_count,
                rag_store_name: s.rag_store_name
            })));

            // Buscar stores com documentos disponíveis
            // IMPORTANTE: Não exigir rag_store_name - ele será criado durante a inicialização do chat
            const storesWithDocs = ragStores.filter(store => store.document_count > 0);

            console.log('📦 Stores com documentos:', storesWithDocs.length);
            console.log('📦 Detalhes dos stores:', storesWithDocs.map(s => ({
                name: s.display_name,
                count: s.document_count,
                hasRagStore: !!s.rag_store_name
            })));

            if (storesWithDocs.length === 0) {
                console.warn('⚠️ Nenhum store com documentos encontrado');
                console.warn('⚠️ ragStores:', ragStores);
                showWarning('Nenhum documento disponível para chat. Faça upload de documentos primeiro.');
                return;
            }

            // Usar selectedStore se tiver documentos, senão usar o primeiro disponível
            const storeToUse = (selectedStore && selectedStore.document_count > 0)
                ? selectedStore
                : storesWithDocs[0];

            console.log('📦 Iniciando chat com store:', storeToUse.display_name);

            // Delegar para handleStartChatWithStore (que não muda a view)
            await handleStartChatWithStore(storeToUse);
        } catch (err) {
            console.error('❌ Erro ao iniciar chat:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            showError(`Erro ao iniciar chat: ${errorMessage}`);
            setStatus(AppStatus.Welcome);
        }
    };

    const handleEndChat = () => {
        if (activeRagStoreName) {
            // Deletar sessão via API backend (activeRagStoreName é o session ID)
            apiService.deleteChatSession(activeRagStoreName).catch(err => {
                console.error("Falha ao deletar sessão de chat:", err);
            });
        }
        setActiveRagStoreName(null);
        setChatHistory([]);
        setExampleQuestions([]);
        setInsights([]);
        setFiles([]);
        setStatus(AppStatus.Welcome);
        setCurrentView('dashboard');
    };

    const handleNewChat = async () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('🆕 DEBUG: handleNewChat - Início');
        console.log('📦 RAG Stores disponíveis:', ragStores.length);
        console.log('📊 Stores com documentos:', ragStores.filter(s => s.document_count > 0).map(s => ({
            name: s.display_name,
            count: s.document_count,
            rag_store_name: s.rag_store_name
        })));
        console.log('═══════════════════════════════════════════════════════');

        // Marcar como início manual para evitar auto-start
        isManualChatStart.current = true;

        // Encerrar chat atual se existir
        if (activeRagStoreName) {
            console.log('🔚 Encerrando chat atual:', activeRagStoreName);
            try {
                await apiService.deleteChatSession(activeRagStoreName);
                console.log('✅ Sessão deletada com sucesso');
            } catch (err) {
                console.error("Falha ao deletar sessão de chat:", err);
            }
        }

        // Limpar estado do chat atual
        setActiveRagStoreName(null);
        setChatHistory([]);
        setExampleQuestions([]);
        setInsights([]);
        setStatus(AppStatus.Welcome);

        // Verificar se há stores com documentos disponíveis (não precisa ter um store selecionado)
        // IMPORTANTE: Não exigir rag_store_name - ele será criado durante o chat
        const storesWithDocs = ragStores.filter(store => store.document_count > 0);

        if (storesWithDocs.length > 0) {
            // Navegar para chat e iniciar nova sessão imediatamente
            setCurrentView('chat');

            // Aguardar um pouco para o estado ser atualizado E para o backend processar a deleção
            await new Promise(resolve => setTimeout(resolve, 500));

            // Iniciar nova sessão com o primeiro store disponível (ou selectedStore se existir)
            const storeToUse = (selectedStore && selectedStore.document_count > 0)
                ? selectedStore
                : storesWithDocs[0];

            // Passar flag para forçar criação de nova sessão
            await handleStartChatWithStore(storeToUse, true);

            // Resetar flag após iniciar o chat
            isManualChatStart.current = false;
        } else {
            // Sem documentos em nenhum store, redirecionar para documentos
            showInfo('Faça upload de documentos para iniciar um novo chat.');
            setCurrentView('documents');
            isManualChatStart.current = false;
        }
    };

    const handleResumeChat = async (sessionId: string, ragStoreName: string) => {
        try {
            console.log('🔄 Retomando chat:', sessionId);
            setStatus(AppStatus.Uploading);
            setUploadProgress({ current: 0, total: 2, message: "Carregando histórico..." });

            // Buscar mensagens anteriores
            const messages = await apiService.getSessionMessages(sessionId);
            const formattedHistory: ChatMessage[] = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
                groundingChunks: msg.grounding_chunks ? msg.grounding_chunks.map((chunk: any) => ({
                    retrievedContext: { text: chunk.text || '' }
                })) : undefined
            }));

            console.log(`📜 Histórico carregado: ${formattedHistory.length} mensagens`);

            setUploadProgress({ current: 1, total: 2, message: "Preparando chat..." });

            // Configurar estado do chat
            setActiveRagStoreName(sessionId);
            setChatHistory(formattedHistory);
            setExampleQuestions([]);

            // Buscar insights dos documentos
            try {
                const sessionInsights = await apiService.getSessionInsights(sessionId);
                setInsights(sessionInsights);
            } catch (err) {
                console.error('Erro ao buscar insights:', err);
                setInsights([]);
            }

            // Encontrar o store correspondente para selecionar
            const matchingStore = ragStores.find(s => s.rag_store_name === ragStoreName);
            if (matchingStore) {
                setSelectedStore(matchingStore);
            }

            setUploadProgress({ current: 2, total: 2, message: "Pronto!" });
            await new Promise(resolve => setTimeout(resolve, 500));

            // Navegar para o chat e mudar status
            setCurrentView('chat');
            setStatus(AppStatus.Chatting);
            showSuccess('Chat retomado com sucesso!');
        } catch (err) {
            console.error('❌ Erro ao retomar chat:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            showError(`Erro ao retomar chat: ${errorMessage}`);
            setStatus(AppStatus.Welcome);
        } finally {
            setUploadProgress(null);
        }
    };

    const handleSendMessage = async (message: string) => {
        console.log('═══════════════════════════════════════════════════════');
        console.log('💬 DEBUG: handleSendMessage - Início');
        console.log('📝 Mensagem do usuário:', message);
        console.log('🆔 Session ID ativo (activeRagStoreName):', activeRagStoreName);
        console.log('📦 Store selecionado:', selectedStore ? {
            id: selectedStore.id,
            name: selectedStore.name,
            display_name: selectedStore.display_name,
            rag_store_name: selectedStore.rag_store_name,
            document_count: selectedStore.document_count
        } : 'Nenhum');
        console.log('═══════════════════════════════════════════════════════');

        if (!activeRagStoreName) {
            console.error('❌ Nenhuma sessão ativa (activeRagStoreName é null)');
            return;
        }

        // VALIDAÇÃO PROATIVA: Verificar se a sessão ainda é válida antes de enviar
        try {
            console.log('🔍 Validando sessão antes de enviar mensagem...');
            const validation = await apiService.validateChatSession(activeRagStoreName);

            if (!validation.valid) {
                console.warn('⚠️ Sessão inválida detectada (validação proativa):', validation);

                // Limpar sessão localmente
                setActiveRagStoreName(null);
                setChatHistory([]);
                setExampleQuestions([]);
                setInsights([]);
                setFiles([]);
                setStatus(AppStatus.Welcome);
                setCurrentView('dashboard');

                // Deletar sessão do backend
                apiService.deleteChatSession(activeRagStoreName).catch(err => {
                    console.error("Falha ao deletar sessão inválida:", err);
                });

                // Mostrar mensagem apropriada ao usuário
                const userMessage = validation.reason === 'rag_store_not_found'
                    ? 'Esta conversa não está mais disponível porque os documentos foram removidos. Faça upload de novos documentos para iniciar uma nova sessão.'
                    : validation.message || 'Esta sessão não está mais disponível. Por favor, inicie uma nova sessão.';

                showWarning(userMessage, { duration: 6000 });
                return;
            }

            console.log('✅ Sessão válida. Prosseguindo com envio da mensagem...');
        } catch (err) {
            console.error('❌ Erro ao validar sessão:', err);
            showError('Erro ao validar sessão. Por favor, tente novamente.');
            return;
        }

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: message }] };
        setChatHistory(prev => [...prev, userMessage]);
        setIsQueryLoading(true);

        // Criar mensagem temporária do modelo que será atualizada com streaming
        const tempModelMessage: ChatMessage = {
            role: 'model',
            parts: [{ text: '' }],
            groundingChunks: []
        };
        setChatHistory(prev => [...prev, tempModelMessage]);

        try {
            console.log('🚀 Iniciando streaming para sessão:', activeRagStoreName);

            let streamedText = '';
            let groundingChunks: any[] = [];

            await apiService.sendChatQueryStream(
                activeRagStoreName,
                message,
                // onContent: Atualizar texto em tempo real
                (text: string) => {
                    console.log('📝 Chunk recebido:', text);
                    streamedText += text;
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastMessage = newHistory[newHistory.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            lastMessage.parts = [{ text: streamedText }];
                        }
                        return newHistory;
                    });
                },
                // onGrounding: Atualizar fontes
                (chunks: any[]) => {
                    console.log('📚 Grounding chunks recebidos:', chunks);
                    groundingChunks = chunks;
                },
                // onDone: Finalizar com texto completo e fontes
                (fullText: string, chunks: any[]) => {
                    console.log('✅ Stream concluído. Texto completo:', fullText);
                    console.log('📚 Grounding chunks finais:', chunks);
                    setChatHistory(prev => {
                        const newHistory = [...prev];
                        const lastMessage = newHistory[newHistory.length - 1];
                        if (lastMessage && lastMessage.role === 'model') {
                            lastMessage.parts = [{ text: fullText }];
                            lastMessage.groundingChunks = chunks.map(chunk => ({
                                retrievedContext: { text: chunk.text || '' }
                            }));
                            console.log('💾 Mensagem final salva:', lastMessage);
                        }
                        return newHistory;
                    });
                    setIsQueryLoading(false);
                },
                // onError: Tratar erros
                (error: string) => {
                    // Verificar se é erro de RAG store inválido/inexistente ou sessão não encontrada
                    const isRagStoreError = error.includes("RAG store não existe") ||
                                          error.includes("não está acessível") ||
                                          error.includes("Sessão não encontrada") ||
                                          error.includes("não encontrada") ||
                                          error.includes("INVALID_ARGUMENT") ||
                                          error.includes("PERMISSION_DENIED");

                    if (isRagStoreError) {
                        // RAG store inválido - limpar sessão e redirecionar
                        // Nota: Isso só deve acontecer em casos raros onde a validação proativa não pegou
                        console.warn("⚠️ RAG store inválido detectado (fallback - validação proativa não pegou)");

                        // Deletar sessão órfã do backend
                        if (activeRagStoreName) {
                            apiService.deleteChatSession(activeRagStoreName).catch(err => {
                                console.error("Falha ao deletar sessão órfã:", err);
                            });
                        }

                        setActiveRagStoreName(null);
                        setChatHistory([]);
                        setExampleQuestions([]);
                        setInsights([]);
                        setFiles([]);
                        setStatus(AppStatus.Welcome);
                        setCurrentView('dashboard');

                        // Mostrar mensagem informativa com toast
                        showWarning(
                            'Conversa não disponível: os documentos foram removidos. ' +
                            'Faça upload de novos documentos para iniciar uma nova sessão.',
                            { duration: 6000 }
                        );
                    } else {
                        // Erro genérico - mostrar no console e na UI
                        console.error("❌ Erro ao enviar mensagem:", error);
                        setChatHistory(prev => {
                            const newHistory = [...prev];
                            const lastMessage = newHistory[newHistory.length - 1];
                            if (lastMessage && lastMessage.role === 'model') {
                                lastMessage.parts = [{ text: `❌ ${error}` }];
                            }
                            return newHistory;
                        });
                    }

                    setIsQueryLoading(false);
                }
            );
        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
            setChatHistory(prev => {
                const newHistory = [...prev];
                const lastMessage = newHistory[newHistory.length - 1];
                if (lastMessage && lastMessage.role === 'model') {
                    lastMessage.parts = [{ text: "Desculpe, encontrei um erro. Por favor, tente novamente." }];
                }
                return newHistory;
            });
            setIsQueryLoading(false);
        }
    };
    
    const renderMainContent = () => {
        // Show upload progress overlay
        if (status === AppStatus.Uploading) {
            let icon = null;
            if (uploadProgress?.message === "Creating document index...") {
                icon = <img src="https://services.google.com/fh/files/misc/applet-upload.png" alt="Uploading files icon" className="h-64 w-64 rounded-lg object-cover" />;
            } else if (uploadProgress?.message === "Generating embeddings...") {
                icon = <img src="https://services.google.com/fh/files/misc/applet-creating-embeddings_2.png" alt="Creating embeddings icon" className="h-80 w-80 rounded-lg object-cover" />;
            } else if (uploadProgress?.message === "Generating suggestions...") {
                icon = <img src="https://services.google.com/fh/files/misc/applet-suggestions_2.png" alt="Generating suggestions icon" className="h-80 w-80 rounded-lg object-cover" />;
            } else if (uploadProgress?.message === "All set!") {
                icon = <img src="https://services.google.com/fh/files/misc/applet-completion_2.png" alt="Completion icon" className="h-80 w-80 rounded-lg object-cover" />;
            }

            return (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                    <ProgressBar
                        progress={uploadProgress?.current || 0}
                        total={uploadProgress?.total || 1}
                        message={uploadProgress?.message || "Preparing your chat..."}
                        fileName={uploadProgress?.fileName}
                        icon={icon}
                    />
                </div>
            );
        }

        // Show error overlay
        if (status === AppStatus.Error) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-red-900/20 text-red-300">
                    <h1 className="text-3xl font-bold mb-4">Application Error</h1>
                    <p className="max-w-md text-center mb-4">{error}</p>
                    <button onClick={clearError} className="px-4 py-2 rounded-md bg-gem-mist hover:bg-gem-mist/70 transition-colors" title="Return to the welcome screen">
                       Try Again
                    </button>
                </div>
            );
        }

        // Show main views
        switch(currentView) {
            case 'dashboard':
                return <Dashboard
                    onNavigateToDocuments={() => setCurrentView('documents')}
                    hasDocuments={!!activeRagStoreName}
                    stores={ragStores}
                    documents={processedDocuments}
                    onNavigateToStores={() => setCurrentView('stores')}
                    onNavigateToChat={() => setCurrentView('chat')}
                    onSelectStore={handleSelectStore}
                    isUserLoggedIn={!!user}
                />;
            case 'documents':
                return <DocumentsView
                    files={files}
                    setFiles={setFiles}
                    onUpload={handleUploadAndStartChat}
                    isApiKeySelected={isApiKeySelected}
                    onSelectKey={handleSelectKey}
                    apiKeyError={apiKeyError}
                    isUploading={status === AppStatus.Uploading}
                    processedDocuments={processedDocuments}
                    onDeleteDocument={handleDeleteDocument}
                    onBulkDeleteDocuments={handleBulkDeleteDocuments}
                    onMoveDocumentStore={handleMoveDocumentStore}
                    stores={ragStores}
                    selectedStore={selectedStore}
                    onSelectStore={handleSelectStore}
                    onRefreshDocuments={refreshDocuments}
                />;
            case 'chat':
                if (status === AppStatus.Chatting) {
                    // Filtrar apenas stores com documentos para o chat
                    const storesWithDocuments = ragStores.filter(store =>
                        store.document_count > 0 && store.rag_store_name
                    );

                    return <ChatInterface
                        history={chatHistory}
                        isQueryLoading={isQueryLoading}
                        onSendMessage={handleSendMessage}
                        onNewChat={handleNewChat}
                        exampleQuestions={exampleQuestions}
                        insights={insights}
                        stores={storesWithDocuments}
                        selectedStore={selectedStore}
                        onSelectStore={handleSelectStore}
                    />;
                } else {
                    // Verificar se há documentos disponíveis (em stores OU em processamento)
                    const hasStoresWithDocs = ragStores.some(store =>
                        store.document_count > 0 && store.rag_store_name
                    );
                    const hasCompletedDocs = processedDocuments.some(doc => doc.status === 'completed');
                    const hasDocuments = hasStoresWithDocs || hasCompletedDocs;

                    if (!hasDocuments) {
                        // Sem documentos, mostrar mensagem
                        return (
                            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
                                <div className="max-w-md text-center">
                                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-800 mb-4">
                                        Nenhum documento disponível
                                    </h2>
                                    <p className="text-slate-600 mb-8">
                                        Para iniciar uma conversa com IA, você precisa primeiro fazer upload de documentos.
                                    </p>
                                    <button
                                        onClick={() => setCurrentView('documents')}
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                                    >
                                        Ir para Documentos
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    // Tem documentos mas o chat ainda não iniciou (está iniciando automaticamente)
                    // Mostrar apenas um loader, pois o useEffect vai iniciar automaticamente
                    return (
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                            <div className="text-center">
                                <Spinner />
                                <p className="mt-4 text-slate-600">Preparando chat...</p>
                            </div>
                        </div>
                    );
                }
            case 'analytics':
                return <Analytics />;
            case 'status':
                return <StatusView />;
            case 'settings':
                return <Settings />;
            case 'stores':
                return <StoreManagement />;
            case 'users':
                return <UsersManagement />;
            case 'chats':
                return <ChatsView onResumeChat={handleResumeChat} />;
            default:
                return <Dashboard
                    onNavigateToDocuments={() => setCurrentView('documents')}
                    hasDocuments={!!activeRagStoreName}
                    stores={ragStores}
                    documents={processedDocuments}
                    onNavigateToStores={() => setCurrentView('stores')}
                    onNavigateToChat={() => setCurrentView('chat')}
                    onSelectStore={handleSelectStore}
                    isUserLoggedIn={!!user}
                />;
        }
    }

    // Verificar se há documentos processados disponíveis para chat em QUALQUER store acessível
    const hasDocumentsForChat = React.useMemo(() => {
        // Verificar se existe pelo menos um store com documentos
        const hasStoreWithDocs = ragStores.some(store =>
            store.document_count > 0 && store.rag_store_name
        );

        // Ou verificar se há documentos completados em processamento
        const hasCompletedDocs = processedDocuments.some(doc =>
            doc.status === 'completed'
        );

        return hasStoreWithDocs || hasCompletedDocs;
    }, [ragStores, processedDocuments]);

    return (
        <>
            <main className="h-screen flex bg-slate-900">
                <Sidebar
                    currentView={currentView}
                    onNavigate={setCurrentView}
                    hasActiveSession={status === AppStatus.Chatting || hasDocumentsForChat}
                    hasDocuments={hasDocumentsForChat}
                    onOpenAuth={() => setShowAuthModal(true)}
                    onNewChat={handleNewChat}
                    onResumeChat={handleResumeChat}
                />
                {renderMainContent()}
            </main>

            {/* Modal de confirmação de exclusão */}
            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={cancelDeleteDocument}
                onConfirm={confirmDeleteDocument}
                title="Excluir Documento"
                message="Tem certeza que deseja excluir este documento?"
                documentName={deleteModal.documentName || undefined}
                isDeleting={deleteModal.isDeleting}
            />

            {/* Toast notifications */}
            <Toaster position="top-right" />

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode="login"
            />
        </>
    );
};

// Wrapper principal com AuthProvider e SystemConfigProvider
const App: React.FC = () => {
    return (
        <AuthProvider>
            <SystemConfigProvider>
                <AppContent />
            </SystemConfigProvider>
        </AuthProvider>
    );
};

export default App;
