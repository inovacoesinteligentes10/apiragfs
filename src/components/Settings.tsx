/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { apiService, GeneralSettingsResponse } from '../services/apiService';
import { useSystemConfig } from '../contexts/SystemConfigContext';

const DEFAULT_SYSTEM_PROMPT = `# ApiRAGFS - Assistente RAG com Google Gemini File Search

## IDENTIDADE
Voce e o **ApiRAGFS**, assistente especializado em busca e recuperacao de informacoes em documentos usando RAG (Retrieval-Augmented Generation).

## REGRA DE OURO - FIDELIDADE ABSOLUTA
**CRÍTICO**: Responda EXCLUSIVAMENTE com base nos documentos fornecidos pelo sistema RAG.

### Quando a informacao ESTÁ nos documentos:
- Cite LITERALMENTE, preservando formatacao, numeracao e estrutura
- Para dados estruturados (listas, objetivos, requisitos): forneça TODOS os itens SEM resumo
- Use **negrito** para termos-chave e titulos de secoes

### Quando a informacao NÃO ESTÁ nos documentos:
Declare explicitamente: "Nao encontrei essa informacao especifica nos documentos disponiveis. Voce pode reformular a pergunta ou fornecer mais contexto."

### PROIBIÇÕES ABSOLUTAS:
❌ NUNCA adicione conhecimento externo ou use treinamento previo
❌ NUNCA resuma dados estruturados (OE1, OE2, requisitos, etc)
❌ NUNCA invente informacoes ou "preencha lacunas"
❌ NUNCA use frases genericas como "busca desenvolver", "e fundamental", "visa integrar"

---
Responda seguindo rigorosamente estas diretrizes. Lembre-se: FIDELIDADE AO DOCUMENTO e prioridade maxima.`;

const Settings: React.FC = () => {
    const { refreshConfig } = useSystemConfig();
    const [settings, setSettings] = useState({
        apiKey: '••••••••••••••••••••',
        model: 'gemini-2.5-flash', // Valor real usado no backend (settings.py)
        temperature: 1.0, // Padrão do Gemini (não customizado no código)
        maxTokens: 8192, // Padrão do Gemini 2.5 Flash
        language: 'pt-BR',
        theme: 'light',
        notifications: true,
        autoSave: true,
        systemName: 'ApiRAGFS',
        systemDescription: 'Sistema RAG com Google Gemini File Search',
        systemLogo: '📚',
        contextWindow: 1000000, // Context window do Gemini 2.5 Flash
        systemPrompt: DEFAULT_SYSTEM_PROMPT
    });

    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [generalSettingsSaveStatus, setGeneralSettingsSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [isAdmin, setIsAdmin] = useState(false);

    // Carregar configurações do backend ao montar o componente
    useEffect(() => {
        loadSystemPrompt();
        loadGeneralSettings();
    }, []);

    const loadSystemPrompt = async () => {
        try {
            setLoading(true);
            const response = await apiService.getSystemPrompt();
            setSettings(prev => ({
                ...prev,
                systemPrompt: response.system_prompt
            }));
        } catch (error) {
            console.error('Erro ao carregar system prompt:', error);
            // Manter o padrão se falhar
        } finally {
            setLoading(false);
        }
    };

    const loadGeneralSettings = async () => {
        try {
            const response = await apiService.getGeneralSettings();
            setIsAdmin(response.is_admin);
            setSettings(prev => ({
                ...prev,
                language: response.language,
                theme: response.theme,
                notifications: response.notifications,
                autoSave: response.auto_save,
                systemName: response.system_name,
                systemDescription: response.system_description,
                systemLogo: response.system_logo
            }));
        } catch (error) {
            console.error('Erro ao carregar configurações gerais:', error);
            // Manter os padrões se falhar
        }
    };

    const handleSave = async () => {
        try {
            setSaveStatus('saving');
            await apiService.updateSystemPrompt(settings.systemPrompt);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    const handleReset = async () => {
        if (!confirm('Tem certeza que deseja restaurar o system prompt para o padrão?')) {
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.resetSystemPrompt();
            setSettings(prev => ({
                ...prev,
                systemPrompt: response.system_prompt
            }));
            // Mensagem de sucesso será exibida via toast no handleSave
        } catch (error) {
            console.error('Erro ao resetar system prompt:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGeneralSettings = async () => {
        try {
            setGeneralSettingsSaveStatus('saving');
            await apiService.updateGeneralSettings({
                language: settings.language as 'pt-BR' | 'en-US' | 'es-ES',
                theme: settings.theme as 'light' | 'dark' | 'auto',
                notifications: settings.notifications,
                auto_save: settings.autoSave,
                system_name: settings.systemName,
                system_description: settings.systemDescription,
                system_logo: settings.systemLogo
            });
            setGeneralSettingsSaveStatus('success');
            setTimeout(() => setGeneralSettingsSaveStatus('idle'), 3000);

            // Atualizar contexto global e aplicar tema
            await refreshConfig();
        } catch (error) {
            console.error('Erro ao salvar configurações gerais:', error);
            setGeneralSettingsSaveStatus('error');
            setTimeout(() => setGeneralSettingsSaveStatus('idle'), 3000);
        }
    };

    const handleResetGeneralSettings = async () => {
        if (!confirm('Tem certeza que deseja restaurar as configurações gerais para o padrão?')) {
            return;
        }

        try {
            const response = await apiService.resetGeneralSettings();
            setSettings(prev => ({
                ...prev,
                language: response.language,
                theme: response.theme,
                notifications: response.notifications,
                autoSave: response.auto_save,
                systemName: response.system_name,
                systemDescription: response.system_description,
                systemLogo: response.system_logo
            }));

            // Atualizar contexto global
            await refreshConfig();

            setGeneralSettingsSaveStatus('success');
            setTimeout(() => setGeneralSettingsSaveStatus('idle'), 3000);
        } catch (error) {
            console.error('Erro ao resetar configurações gerais:', error);
            setGeneralSettingsSaveStatus('error');
            setTimeout(() => setGeneralSettingsSaveStatus('idle'), 3000);
        }
    };

    const applyTheme = (theme: string) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else if (theme === 'auto') {
            // Detectar preferência do sistema
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Configurações</h1>
                    <p className="text-slate-600">Personalize o sistema de acordo com suas necessidades</p>
                </div>

                {/* API Configuration */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            Configurações da API
                        </h3>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                            Somente leitura
                        </span>
                    </div>
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-700">
                            ℹ️ Estas configurações são definidas no backend (arquivo .env). Os valores abaixo refletem a configuração atual em uso.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Chave da API Gemini</label>
                            <input
                                type="password"
                                value={settings.apiKey}
                                disabled
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Configurada via variável de ambiente GEMINI_API_KEY</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Modelo em Uso</label>
                            <input
                                type="text"
                                value={settings.model}
                                disabled
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed font-mono text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">Configurado via variável GEMINI_MODEL no backend</p>
                        </div>
                    </div>
                </div>

                {/* Model Parameters */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                            Parâmetros do Modelo
                        </h3>
                        <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full">
                            Informativo
                        </span>
                    </div>
                    <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-xs text-purple-700">
                            ℹ️ Estes são os parâmetros padrão do modelo {settings.model}. Atualmente não são customizados no código.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-slate-700">Temperature</label>
                                <span className="text-sm font-semibold text-purple-600">{settings.temperature} (padrão)</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={settings.temperature}
                                disabled
                                className="w-full opacity-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Padrão do Gemini - não customizado</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Max Output Tokens</label>
                            <input
                                type="text"
                                value={settings.maxTokens.toLocaleString()}
                                disabled
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Limite padrão do modelo Gemini 2.5 Flash</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Context Window</label>
                            <input
                                type="text"
                                value={`${(settings.contextWindow / 1000).toFixed(0)}K tokens (1M)`}
                                disabled
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Janela de contexto do Gemini 2.5 Flash</p>
                        </div>
                    </div>
                </div>

                {/* System Prompt Configuration - Apenas para Admin */}
                {isAdmin && (
                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            System Prompt do RAG
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Prompt do Sistema
                                    {loading && (
                                        <span className="ml-2 text-xs text-blue-600">Carregando...</span>
                                    )}
                                </label>
                                <textarea
                                    value={settings.systemPrompt}
                                    onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                                    rows={15}
                                    disabled={loading}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Digite o prompt do sistema..."
                                />
                                <p className="text-xs text-slate-500 mt-2">
                                    Este prompt define o comportamento do assistente RAG. Ele será usado em todas as consultas aos documentos.
                                </p>
                            </div>
                            <div className="flex items-start space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Atenção</h4>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Alterar o prompt do sistema pode afetar significativamente a qualidade e o comportamento das respostas.
                                        Mantenha instruções claras sobre fidelidade aos documentos fornecidos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Configurações Gerais
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Ativo
                        </span>
                    </div>
                    <div className="space-y-4">
                        {/* Configurações de Sistema - Apenas para Admin */}
                        {isAdmin && (
                            <>
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800 font-medium">
                                        🔐 Configurações de Sistema (Apenas Administrador)
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Sistema</label>
                                    <input
                                        type="text"
                                        value={settings.systemName}
                                        onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                                        maxLength={50}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="ApiRAGFS"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Nome exibido no cabeçalho e título da aplicação</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Descrição do Sistema</label>
                                    <input
                                        type="text"
                                        value={settings.systemDescription}
                                        onChange={(e) => setSettings({ ...settings, systemDescription: e.target.value })}
                                        maxLength={200}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="Sistema RAG com Google Gemini File Search"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Descrição exibida na tela de boas-vindas</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Logotipo (Emoji)</label>
                                    <input
                                        type="text"
                                        value={settings.systemLogo}
                                        onChange={(e) => setSettings({ ...settings, systemLogo: e.target.value })}
                                        maxLength={4}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-2xl"
                                        placeholder="📚"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Emoji ou ícone exibido no cabeçalho (máx: 4 caracteres)</p>
                                </div>
                                <div className="border-t border-slate-200 my-6"></div>
                            </>
                        )}

                        {/* Configurações Pessoais - Todos os usuários */}
                        {!isAdmin && (
                            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800 font-medium">
                                    👤 Configuração de Usuário
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Você pode personalizar apenas o tema da interface. Outras configurações são gerenciadas pelo administrador.
                                </p>
                            </div>
                        )}
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Idioma</label>
                                <select
                                    value={settings.language}
                                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="en-US">English (US)</option>
                                    <option value="es-ES">Español</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">Idioma da interface do usuário</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tema</label>
                            <select
                                value={settings.theme}
                                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="light">Claro</option>
                                <option value="dark">Escuro</option>
                                <option value="auto">Automático</option>
                            </select>
                            <p className="text-xs text-slate-500 mt-1">Aparência da interface</p>
                        </div>
                        {isAdmin && (
                            <>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-700">Notificações</h4>
                                        <p className="text-xs text-slate-500">Receber notificações sobre eventos importantes</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            settings.notifications ? 'bg-green-600' : 'bg-slate-300'
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
                                        <p className="text-xs text-slate-500">Salvar automaticamente alterações</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            settings.autoSave ? 'bg-green-600' : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                settings.autoSave ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="mt-6 flex justify-between items-center">
                        {isAdmin && (
                            <button
                                onClick={handleResetGeneralSettings}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all text-sm"
                            >
                                Restaurar Padrões
                            </button>
                        )}
                        {!isAdmin && <div></div>}
                        <button
                            onClick={handleSaveGeneralSettings}
                            disabled={generalSettingsSaveStatus === 'saving'}
                            className={`px-6 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl ${
                                generalSettingsSaveStatus === 'success'
                                    ? 'bg-green-600 text-white'
                                    : generalSettingsSaveStatus === 'error'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {generalSettingsSaveStatus === 'saving' && 'Salvando...'}
                            {generalSettingsSaveStatus === 'success' && '✓ Salvo!'}
                            {generalSettingsSaveStatus === 'error' && '✗ Erro'}
                            {generalSettingsSaveStatus === 'idle' && (isAdmin ? 'Salvar' : 'Salvar Tema')}
                        </button>
                    </div>
                </div>

                {/* Action Buttons - Apenas para Admin */}
                {isAdmin && (
                    <div className="flex justify-between items-center">
                        <button
                            onClick={handleReset}
                            disabled={loading}
                            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Carregando...' : 'Restaurar Padrões'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saveStatus === 'saving'}
                            className={`px-6 py-2 rounded-lg transition-all shadow-lg hover:shadow-xl ${
                                saveStatus === 'success'
                                    ? 'bg-green-600 text-white'
                                    : saveStatus === 'error'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {saveStatus === 'saving' && 'Salvando...'}
                            {saveStatus === 'success' && '✓ Salvo com sucesso!'}
                            {saveStatus === 'error' && '✗ Erro ao salvar'}
                            {saveStatus === 'idle' && 'Salvar Configurações'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settings;
