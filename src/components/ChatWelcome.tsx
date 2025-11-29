/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ProcessedDocument } from '../types';

interface ChatWelcomeProps {
    processedDocuments: ProcessedDocument[];
    onStartChat: () => void;
    onNavigateToDocuments: () => void;
}

const ChatWelcome: React.FC<ChatWelcomeProps> = ({
    processedDocuments,
    onStartChat,
    onNavigateToDocuments
}) => {
    console.log('📋 ChatWelcome - Documentos recebidos:', processedDocuments);

    // Filtrar apenas documentos completos
    const completedDocs = processedDocuments.filter(doc =>
        doc.status === 'completed'
    );

    console.log('✅ ChatWelcome - Documentos completados:', completedDocs);

    if (completedDocs.length === 0) {
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
                        onClick={onNavigateToDocuments}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                    >
                        Ir para Documentos
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-2xl text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-slate-800 mb-4">
                    Bem-vindo ao Chat
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                    Converse com todos os seus documentos usando inteligência artificial.
                    Faça perguntas e obtenha respostas baseadas no conteúdo dos seus arquivos.
                </p>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-slate-200">
                    <div className="flex items-center justify-center space-x-2 text-slate-700 mb-4">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-semibold">
                            {completedDocs.length} documento{completedDocs.length !== 1 ? 's' : ''} disponível{completedDocs.length !== 1 ? 'eis' : ''}
                        </span>
                    </div>
                    <div className="text-sm text-slate-600">
                        {completedDocs.slice(0, 3).map((doc, index) => (
                            <div key={doc.id} className="py-1">
                                • {doc.name}
                            </div>
                        ))}
                        {completedDocs.length > 3 && (
                            <div className="py-1 text-slate-500">
                                ... e mais {completedDocs.length - 3} documento{completedDocs.length - 3 !== 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>
                <button
                    onClick={onStartChat}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg"
                >
                    Iniciar Conversa
                </button>
            </div>
        </div>
    );
};

export default ChatWelcome;
