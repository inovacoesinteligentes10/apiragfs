/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { apiService, AnalyticsDashboard, AnalyticsStats } from '../services/apiService';

const Analytics: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<AnalyticsDashboard | null>(null);
    const [statsData, setStatsData] = useState<AnalyticsStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            const [dashboard, stats] = await Promise.all([
                apiService.getAnalyticsDashboard(),
                apiService.getAnalyticsStats()
            ]);

            setDashboardData(dashboard);
            setStatsData(stats);
        } catch (err: any) {
            console.error('Erro ao carregar analytics:', err);
            setError(err.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics</h1>
                        <p className="text-slate-600">Carregando métricas...</p>
                    </div>
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics</h1>
                        <p className="text-slate-600">Erro ao carregar dados</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <h3 className="text-red-800 font-semibold">Erro ao carregar analytics</h3>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        </div>
                        <button
                            onClick={loadAnalytics}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics</h1>
                        <p className="text-slate-600">Métricas e estatísticas de uso do ApiRAGFS</p>
                    </div>
                    <button
                        onClick={loadAnalytics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Atualizar
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Documents */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                            {dashboardData?.total_documents || 0}
                        </h3>
                        <p className="text-sm text-slate-600">Total de Documentos</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {dashboardData?.completed_documents || 0} processados
                        </div>
                    </div>

                    {/* Chat Sessions */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                            {dashboardData?.total_chat_sessions || 0}
                        </h3>
                        <p className="text-sm text-slate-600">Sessões de Chat</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {statsData?.active_chat_sessions || 0} ativas
                        </div>
                    </div>

                    {/* Total Messages */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                            {dashboardData?.total_messages || 0}
                        </h3>
                        <p className="text-sm text-slate-600">Total de Mensagens</p>
                    </div>

                    {/* Storage */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">
                            {statsData?.total_storage_mb.toFixed(2) || 0} MB
                        </h3>
                        <p className="text-sm text-slate-600">Armazenamento</p>
                        <div className="mt-2 text-xs text-slate-500">
                            {statsData?.total_chunks || 0} chunks
                        </div>
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Documents by Type */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Documentos por Tipo
                        </h3>
                        {dashboardData && dashboardData.documents_by_type.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.documents_by_type.map((item, index) => {
                                    const maxCount = Math.max(...dashboardData.documents_by_type.map(d => d.count), 1);
                                    const percentage = (item.count / maxCount) * 100;

                                    return (
                                        <div key={index}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-700">{item.type || 'Desconhecido'}</span>
                                                <span className="text-sm text-slate-600">{item.count}</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Nenhum documento ainda
                            </div>
                        )}
                    </div>

                    {/* Activity Last 7 Days */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Atividade (Últimos 7 Dias)
                        </h3>
                        {dashboardData && dashboardData.activity_last_7_days.length > 0 ? (
                            <div className="space-y-3">
                                {dashboardData.activity_last_7_days.map((item, index) => {
                                    const date = new Date(item.date);
                                    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });

                                    return (
                                        <div key={index} className="flex items-center space-x-3">
                                            <div className="flex-shrink-0 w-12 text-xs text-slate-600 font-medium">
                                                {dayName}
                                            </div>
                                            <div className="flex-1">
                                                <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-purple-500 to-blue-600 h-6 rounded-full flex items-center justify-end pr-2"
                                                        style={{ width: `${Math.min((item.count / 100) * 100, 100)}%` }}
                                                    >
                                                        {item.count > 0 && (
                                                            <span className="text-xs text-white font-semibold">{item.count}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                Sem atividade recente
                            </div>
                        )}
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Estatísticas de Performance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-800 mb-2">
                                {statsData?.avg_processing_time_seconds.toFixed(1) || 0}s
                            </div>
                            <div className="text-sm text-slate-600">Tempo Médio de Processamento</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-800 mb-2">
                                {statsData?.total_chunks.toLocaleString() || 0}
                            </div>
                            <div className="text-sm text-slate-600">Total de Chunks Indexados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-slate-800 mb-2">
                                {((statsData?.total_storage_mb || 0) / (dashboardData?.total_documents || 1)).toFixed(2)} MB
                            </div>
                            <div className="text-sm text-slate-600">Média por Documento</div>
                        </div>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="mt-4 text-center text-xs text-slate-500">
                    Última atualização: {dashboardData ? new Date(dashboardData.timestamp).toLocaleString('pt-BR') : '-'}
                </div>
            </div>
        </div>
    );
};

export default Analytics;
