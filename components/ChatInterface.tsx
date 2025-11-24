/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import Spinner from './Spinner';
import SendIcon from './icons/SendIcon';
import RefreshIcon from './icons/RefreshIcon';

interface ChatInterfaceProps {
    documentName: string;
    history: ChatMessage[];
    isQueryLoading: boolean;
    onSendMessage: (message: string) => void;
    onNewChat: () => void;
    exampleQuestions: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ documentName, history, isQueryLoading, onSendMessage, onNewChat, exampleQuestions }) => {
    const [query, setQuery] = useState('');
    const [currentSuggestion, setCurrentSuggestion] = useState('');
    const [modalContent, setModalContent] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (exampleQuestions.length === 0) {
            setCurrentSuggestion('');
            return;
        }

        setCurrentSuggestion(exampleQuestions[0]);
        let suggestionIndex = 0;
        const intervalId = setInterval(() => {
            suggestionIndex = (suggestionIndex + 1) % exampleQuestions.length;
            setCurrentSuggestion(exampleQuestions[suggestionIndex]);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [exampleQuestions]);
    
    const renderMarkdown = (text: string) => {
        if (!text) return { __html: '' };

        const lines = text.split('\n');
        let html = '';
        let listType: 'ul' | 'ol' | null = null;
        let paraBuffer = '';

        function flushPara() {
            if (paraBuffer) {
                html += `<p class="my-2">${paraBuffer}</p>`;
                paraBuffer = '';
            }
        }

        function flushList() {
            if (listType) {
                html += `</${listType}>`;
                listType = null;
            }
        }

        for (const rawLine of lines) {
            const line = rawLine
                .replace(/\*\*(.*?)\*\*|__(.*?)__/g, '<strong>$1$2</strong>')
                .replace(/\*(.*?)\*|_(.*?)_/g, '<em>$1$2</em>')
                .replace(/`([^`]+)`/g, '<code class="bg-gem-mist/50 px-1 py-0.5 rounded-sm font-mono text-sm">$1</code>');

            const isOl = line.match(/^\s*\d+\.\s(.*)/);
            const isUl = line.match(/^\s*[\*\-]\s(.*)/);

            if (isOl) {
                flushPara();
                if (listType !== 'ol') {
                    flushList();
                    html += '<ol class="list-decimal list-inside my-2 pl-5 space-y-1">';
                    listType = 'ol';
                }
                html += `<li>${isOl[1]}</li>`;
            } else if (isUl) {
                flushPara();
                if (listType !== 'ul') {
                    flushList();
                    html += '<ul class="list-disc list-inside my-2 pl-5 space-y-1">';
                    listType = 'ul';
                }
                html += `<li>${isUl[1]}</li>`;
            } else {
                flushList();
                if (line.trim() === '') {
                    flushPara();
                } else {
                    paraBuffer += (paraBuffer ? '<br/>' : '') + line;
                }
            }
        }

        flushPara();
        flushList();

        return { __html: html };
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSendMessage(query);
            setQuery('');
        }
    };

    const handleSourceClick = (text: string) => {
        setModalContent(text);
    };

    const closeModal = () => {
        setModalContent(null);
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isQueryLoading]);

    return (
        <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="px-8 py-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800" title={`Chat with ${documentName}`}>
                                Conversando com ChatSUA
                            </h1>
                            <p className="text-sm text-slate-600">Documento: {documentName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onNewChat}
                        className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                        title="Encerrar chat e iniciar nova sessão"
                    >
                        <RefreshIcon />
                        <span>Nova Sessão</span>
                    </button>
                </div>
            </header>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="max-w-5xl mx-auto space-y-6">
                    {history.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">Bem-vindo ao ChatSUA!</h2>
                            <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
                                Faça perguntas sobre os documentos do SUA. Receba respostas precisas baseadas em citações literais dos documentos oficiais.
                            </p>
                            {exampleQuestions.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto mt-8">
                                    {exampleQuestions.slice(0, 4).map((question, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setQuery(question)}
                                            className="p-4 bg-white rounded-xl shadow-md hover:shadow-lg border border-slate-200 hover:border-blue-300 transition-all text-left group"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm text-slate-700 group-hover:text-slate-900">{question}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {history.map((message, index) => (
                        <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start space-x-3 max-w-4xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                    message.role === 'user'
                                    ? 'bg-gradient-to-br from-green-500 to-teal-600'
                                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                }`}>
                                    {message.role === 'user' ? (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`flex-1 px-6 py-4 rounded-2xl shadow-md ${
                                    message.role === 'user'
                                    ? 'bg-gradient-to-br from-green-500 to-teal-600 text-white'
                                    : 'bg-white border border-slate-200'
                                }`}>
                                    <div className={message.role === 'user' ? 'text-white' : 'text-slate-800'}>
                                        <div dangerouslySetInnerHTML={renderMarkdown(message.parts[0].text)} />
                                    </div>

                                    {/* Sources */}
                                    {message.role === 'model' && message.groundingChunks && message.groundingChunks.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-slate-200">
                                            <h4 className="text-xs font-semibold text-slate-600 mb-3 flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Fontes Citadas:
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {message.groundingChunks.map((chunk, chunkIndex) => (
                                                    chunk.retrievedContext?.text && (
                                                        <button
                                                            key={chunkIndex}
                                                            onClick={() => handleSourceClick(chunk.retrievedContext!.text!)}
                                                            className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-lg border border-blue-200 transition-colors font-medium"
                                                            aria-label={`View source ${chunkIndex + 1}`}
                                                            title="Visualizar trecho do documento"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                            <span>Fonte {chunkIndex + 1}</span>
                                                        </button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loading State */}
                    {isQueryLoading && (
                        <div className="flex justify-start">
                            <div className="flex items-start space-x-3 max-w-4xl">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="flex-1 px-6 py-4 rounded-2xl bg-white border border-slate-200 shadow-md">
                                    <div className="flex items-center space-x-3">
                                        <Spinner />
                                        <span className="text-slate-600">Analisando documentos...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 shadow-lg">
                <div className="max-w-5xl mx-auto px-8 py-6">
                    {/* Suggestions */}
                    {!isQueryLoading && currentSuggestion && history.length > 0 && (
                        <div className="mb-4 flex justify-center">
                            <button
                                onClick={() => setQuery(currentSuggestion)}
                                className="flex items-center space-x-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 rounded-lg border border-slate-200"
                                title="Usar esta sugestão"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span>Sugestão: "{currentSuggestion}"</span>
                            </button>
                        </div>
                    )}

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Faça uma pergunta sobre o SUA..."
                                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-xl py-3.5 px-5 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-800 placeholder-slate-400"
                                disabled={isQueryLoading}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isQueryLoading || !query.trim()}
                            className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
                            title="Enviar mensagem"
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>

            {modalContent !== null && (
                <div 
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" 
                    onClick={closeModal} 
                    role="dialog" 
                    aria-modal="true"
                    aria-labelledby="source-modal-title"
                >
                    <div className="bg-gem-slate p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h3 id="source-modal-title" className="text-xl font-bold mb-4">Source Text</h3>
                        <div 
                            className="flex-grow overflow-y-auto pr-4 text-gem-offwhite/80 border-t border-b border-gem-mist py-4"
                            dangerouslySetInnerHTML={renderMarkdown(modalContent || '')}
                        >
                        </div>
                        <div className="flex justify-end mt-6">
                            <button onClick={closeModal} className="px-6 py-2 rounded-md bg-gem-blue hover:bg-blue-500 text-white transition-colors" title="Close source view">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
