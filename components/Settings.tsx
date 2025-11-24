/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

const Settings: React.FC = () => {
    const [settings, setSettings] = useState({
        apiKey: '••••••••••••••••••••',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        maxTokens: 2048,
        language: 'pt-BR',
        theme: 'light',
        notifications: true,
        autoSave: true,
        contextWindow: 8192
    });

    const handleSave = () => {
        console.log('Salvando configurações:', settings);
        alert('Configurações salvas com sucesso!');
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Configurações</h1>
                    <p className="text-slate-600">Personalize o ChatSUA de acordo com suas necessidades</p>
                </div>

                {/* API Configuration */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Configurações da API
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Chave da API Gemini</label>
                            <input
                                type="password"
                                value={settings.apiKey}
                                onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Sua chave de API do Google Gemini</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo</label>
                            <select
                                value={settings.model}
                                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Model Parameters */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        Parâmetros do Modelo
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700">Temperature</label>
                                <span className="text-sm font-semibold text-blue-600">{settings.temperature}</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.temperature}
                                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <p className="text-xs text-slate-500 mt-1">Controla a criatividade das respostas (0 = conservador, 2 = criativo)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Max Tokens</label>
                            <input
                                type="number"
                                value={settings.maxTokens}
                                onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">Número máximo de tokens por resposta</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Context Window</label>
                            <select
                                value={settings.contextWindow}
                                onChange={(e) => setSettings({ ...settings, contextWindow: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="4096">4K tokens</option>
                                <option value="8192">8K tokens</option>
                                <option value="16384">16K tokens</option>
                                <option value="32768">32K tokens</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Tamanho da janela de contexto</p>
                        </div>
                    </div>
                </div>

                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Configurações Gerais
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Idioma</label>
                            <select
                                value={settings.language}
                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="pt-BR">Português (Brasil)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Español</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="light">Claro</option>
                                <option value="dark">Escuro</option>
                                <option value="auto">Automático</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <h4 className="text-sm font-medium text-slate-700">Notificações</h4>
                                <p className="text-xs text-slate-500">Receber notificações sobre atualizações</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.notifications ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.notifications ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <h4 className="text-sm font-medium text-slate-700">Auto-save</h4>
                                <p className="text-xs text-slate-500">Salvar conversas automaticamente</p>
                            </div>
                            <button
                                onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    settings.autoSave ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                    <button className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all">
                        Restaurar Padrões
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        Salvar Configurações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
