/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppStatus, ChatMessage, ProcessedDocument } from './types';
import * as geminiService from './services/geminiService';
import { apiService } from './services/apiService';
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

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'documents' | 'chat' | 'analytics' | 'status' | 'settings'>('dashboard');
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
    const ragStoreNameRef = useRef(activeRagStoreName);

    useEffect(() => {
        ragStoreNameRef.current = activeRagStoreName;
    }, [activeRagStoreName]);
    
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
                const processedDocs: ProcessedDocument[] = docs.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    size: doc.size,
                    textLength: doc.text_length,
                    extractionMethod: doc.extraction_method,
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
    }, []);

    // Polling para atualizar status de documentos em processamento
    useEffect(() => {
        const pollDocuments = async () => {
            // Verificar se há documentos em processamento (qualquer status exceto completed e error)
            const processingDocs = processedDocuments.filter(doc =>
                doc.status !== 'completed' && doc.status !== 'error'
            );

            if (processingDocs.length === 0) return;

            try {
                // Atualizar apenas os documentos em processamento
                for (const doc of processingDocs) {
                    const updatedDoc = await apiService.getDocument(doc.id);

                    // Verificar se o status mudou de processing para completed
                    const wasProcessing = doc.status === 'processing';
                    const isNowCompleted = updatedDoc.status === 'completed';

                    setProcessedDocuments(prev => prev.map(d =>
                        d.id === doc.id ? {
                            ...d,
                            textLength: updatedDoc.text_length,
                            extractionMethod: updatedDoc.extraction_method,
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
                    } else if (wasProcessing && updatedDoc.status === 'error') {
                        console.error(`❌ Erro ao processar documento "${doc.name}"`);
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
    }, [processedDocuments]);

    // Auto-iniciar chat quando navegar para view de chat e houver documentos
    useEffect(() => {
        const autoStartChat = async () => {
            // Só iniciar automaticamente se:
            // 1. Estiver na view de chat
            // 2. Não houver sessão ativa (status não é Chatting)
            // 3. Houver documentos completados
            // 4. Não estiver fazendo upload ou com erro
            if (
                currentView === 'chat' &&
                status !== AppStatus.Chatting &&
                status !== AppStatus.Uploading &&
                status !== AppStatus.Error &&
                processedDocuments.some(doc => doc.status === 'completed')
            ) {
                await handleStartChat();
            }
        };

        autoStartChat();
    }, [currentView, status]); // Executar quando mudar a view ou status

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
            alert('Running in local mode. Please configure your GEMINI_API_KEY in the .env.local file.');
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
                    // Upload via API backend
                    const uploadedDoc = await apiService.uploadDocument(file);

                    // Criar documento processado para exibição
                    const doc: ProcessedDocument = {
                        id: uploadedDoc.id,
                        name: uploadedDoc.name,
                        type: uploadedDoc.type,
                        size: uploadedDoc.size,
                        textLength: uploadedDoc.text_length,
                        extractionMethod: uploadedDoc.extraction_method,
                        chunks: uploadedDoc.chunks,
                        processingTime: uploadedDoc.processing_time,
                        status: uploadedDoc.status,
                        progressPercent: uploadedDoc.progress_percent,
                        statusMessage: uploadedDoc.status_message,
                        ragStoreName: uploadedDoc.rag_store_name,
                        uploadDate: new Date(uploadedDoc.upload_date)
                    };

                    setProcessedDocuments(prev => [...prev, doc]);

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
                    handleError("Falha ao fazer upload", err);
                }
            }

            setUploadProgress({ current: totalSteps, total: totalSteps, message: "Upload concluído!", fileName: "" });
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Limpar arquivos selecionados e voltar ao estado normal
            setFiles([]);
            setStatus(AppStatus.Welcome);
        } catch (err) {
            handleError("Falha ao fazer upload", err);
        } finally {
            setUploadProgress(null);
        }
    };

    const handleDeleteDocument = async (id: string) => {
        try {
            await apiService.deleteDocument(id);
            setProcessedDocuments(prev => prev.filter(doc => doc.id !== id));
        } catch (err) {
            console.error('Erro ao deletar documento:', err);
            alert('Erro ao deletar documento. Por favor, tente novamente.');
        }
    };

    const handleStartChat = async () => {
        try {
            console.log('🚀 Iniciando chat...');

            // Verificar se há documentos completados
            const completedDocs = processedDocuments.filter(doc => doc.status === 'completed');
            console.log('📄 Documentos completados:', completedDocs);

            if (completedDocs.length === 0) {
                alert('Nenhum documento disponível para chat. Faça upload de documentos primeiro.');
                return;
            }

            setStatus(AppStatus.Uploading);
            setUploadProgress({ current: 0, total: 3, message: "Criando sessão de chat..." });

            // Buscar o RAG store global do primeiro documento (todos documentos usam o mesmo RAG store global)
            const firstDoc = completedDocs[0];
            console.log('📌 Primeiro documento:', firstDoc);

            const fullDocument = await apiService.getDocument(firstDoc.id);
            console.log('📦 Documento completo do backend:', fullDocument);

            if (!fullDocument.rag_store_name) {
                console.error('❌ Documento não possui RAG Store:', fullDocument);
                throw new Error("Documento não possui RAG Store. Faça upload novamente.");
            }

            console.log('🏪 RAG Store Name:', fullDocument.rag_store_name);

            // Criar sessão de chat no backend (sem vincular a documento específico)
            const session = await apiService.createChatSession(fullDocument.rag_store_name);
            console.log('✅ Sessão criada:', session);

            setUploadProgress({ current: 1, total: 3, message: "Carregando histórico..." });

            // Buscar mensagens anteriores (se existir histórico)
            const messages = await apiService.getSessionMessages(session.id);
            const formattedHistory: ChatMessage[] = messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }],
                groundingChunks: msg.grounding_chunks ? msg.grounding_chunks.map((chunk: any) => ({
                    retrievedContext: { text: chunk.text || '' }
                })) : undefined
            }));

            setUploadProgress({ current: 2, total: 3, message: "Preparando chat..." });

            // Configurar estado do chat
            setActiveRagStoreName(session.id);
            setChatHistory(formattedHistory);
            setExampleQuestions([]); // TODO: Buscar perguntas exemplo do backend

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

            // Mudar para view de chat
            setStatus(AppStatus.Chatting);
            setCurrentView('chat');
        } catch (err) {
            console.error('❌ Erro ao iniciar chat:', err);
            console.error('Stack trace:', err instanceof Error ? err.stack : 'N/A');

            const errorMessage = err instanceof Error ? err.message : String(err);
            alert(`Erro ao iniciar chat: ${errorMessage}\n\nVerifique o console do navegador para mais detalhes.`);
            setStatus(AppStatus.Welcome);
        } finally {
            setUploadProgress(null);
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

    const handleSendMessage = async (message: string) => {
        if (!activeRagStoreName) return;

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
                    console.error("❌ Erro ao enviar mensagem:", error);
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
                />;
            case 'chat':
                if (status === AppStatus.Chatting) {
                    return <ChatInterface
                        history={chatHistory}
                        isQueryLoading={isQueryLoading}
                        onSendMessage={handleSendMessage}
                        onNewChat={handleEndChat}
                        exampleQuestions={exampleQuestions}
                        insights={insights}
                    />;
                } else {
                    // Verificar se há documentos disponíveis
                    const hasCompletedDocs = processedDocuments.some(doc => doc.status === 'completed');

                    if (!hasCompletedDocs) {
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
            default:
                return <Dashboard
                    onNavigateToDocuments={() => setCurrentView('documents')}
                    hasDocuments={!!activeRagStoreName}
                />;
        }
    }

    // Verificar se há documentos processados disponíveis para chat
    const hasDocumentsForChat = processedDocuments.some(doc => doc.status === 'completed');

    return (
        <main className="h-screen flex bg-slate-900">
            <Sidebar
                currentView={currentView}
                onNavigate={setCurrentView}
                hasActiveSession={status === AppStatus.Chatting || hasDocumentsForChat}
            />
            {renderMainContent()}
        </main>
    );
};

export default App;
