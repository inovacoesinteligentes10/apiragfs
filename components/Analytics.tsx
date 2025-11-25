/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

const Analytics: React.FC = () => {
    const analyticsData = {
        totalQueries: 1247,
        avgResponseTime: '2.3s',
        successRate: '98.5%',
        totalDocuments: 156,
        topQueries: [
            { query: 'Como acessar o SUA?', count: 89 },
            { query: 'Requisitos para matrícula', count: 67 },
            { query: 'Documentos necessários', count: 54 },
            { query: 'Prazo de inscrição', count: 42 },
            { query: 'Status do processo', count: 38 }
        ],
        queryTrend: [
            { month: 'Jan', queries: 156 },
            { month: 'Fev', queries: 198 },
            { month: 'Mar', queries: 234 },
            { month: 'Abr', queries: 289 },
            { month: 'Mai', queries: 370 }
        ],
        activityOverTime: [
            { day: 'Seg', users: 45, queries: 156, documents: 12 },
            { day: 'Ter', users: 52, queries: 198, documents: 8 },
            { day: 'Qua', users: 48, queries: 187, documents: 15 },
            { day: 'Qui', users: 67, queries: 234, documents: 19 },
            { day: 'Sex', users: 71, queries: 289, documents: 23 },
            { day: 'Sáb', users: 38, queries: 142, documents: 7 },
            { day: 'Dom', users: 29, queries: 98, documents: 4 }
        ],
        modelUsage: [
            { model: 'Gemini 2.0 Flash', requests: 892, percentage: 71.5, color: 'from-blue-500 to-blue-600' },
            { model: 'Gemini 1.5 Pro', requests: 256, percentage: 20.5, color: 'from-purple-500 to-purple-600' },
            { model: 'Gemini 1.5 Flash', requests: 99, percentage: 8.0, color: 'from-green-500 to-green-600' }
        ]
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Analytics</h1>
                    <p className="text-slate-600">Métricas e estatísticas de uso do ApiRAGFS</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">{analyticsData.totalQueries}</h3>
                        <p className="text-sm text-slate-600">Total de Consultas</p>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +12% este mês
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">{analyticsData.avgResponseTime}</h3>
                        <p className="text-sm text-slate-600">Tempo Médio de Resposta</p>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            -8% mais rápido
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">{analyticsData.successRate}</h3>
                        <p className="text-sm text-slate-600">Taxa de Sucesso</p>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +2.1% melhoria
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-1">{analyticsData.totalDocuments}</h3>
                        <p className="text-sm text-slate-600">Documentos Indexados</p>
                        <div className="mt-2 flex items-center text-xs text-green-600">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                            </svg>
                            +23 novos docs
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Query Trend Chart */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            Tendência de Consultas
                        </h3>
                        <div className="space-y-3">
                            {analyticsData.queryTrend.map((item, index) => (
                                <div key={index}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-slate-700">{item.month}</span>
                                        <span className="text-sm text-slate-600">{item.queries}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(item.queries / 400) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Queries */}
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Perguntas Mais Frequentes
                        </h3>
                        <div className="space-y-3">
                            {analyticsData.topQueries.map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-800 truncate">{item.query}</p>
                                        <p className="text-xs text-slate-500">{item.count} consultas</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activity Over Time Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        Atividade ao Longo do Tempo (Última Semana)
                    </h3>
                    <div className="relative" style={{ height: '300px' }}>
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-slate-500 pr-2">
                            <span>300</span>
                            <span>225</span>
                            <span>150</span>
                            <span>75</span>
                            <span>0</span>
                        </div>

                        {/* Chart area */}
                        <div className="absolute left-12 right-0 top-0 bottom-8">
                            {/* Grid lines */}
                            <div className="absolute inset-0 flex flex-col justify-between">
                                {[0, 1, 2, 3, 4].map((i) => (
                                    <div key={i} className="border-t border-slate-200"></div>
                                ))}
                            </div>

                            {/* SVG for lines */}
                            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                                {/* Queries line (purple) */}
                                <polyline
                                    points={analyticsData.activityOverTime.map((item, index) => {
                                        const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                        const y = 100 - (item.queries / 300) * 100;
                                        return `${x}%,${y}%`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="url(#gradient-purple)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Users line (blue) */}
                                <polyline
                                    points={analyticsData.activityOverTime.map((item, index) => {
                                        const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                        const y = 100 - (item.users / 300) * 100;
                                        return `${x}%,${y}%`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="url(#gradient-blue)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Documents line (green) */}
                                <polyline
                                    points={analyticsData.activityOverTime.map((item, index) => {
                                        const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                        const y = 100 - ((item.documents * 10) / 300) * 100;
                                        return `${x}%,${y}%`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="url(#gradient-green)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Data points for Queries */}
                                {analyticsData.activityOverTime.map((item, index) => {
                                    const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                    const y = 100 - (item.queries / 300) * 100;
                                    return (
                                        <circle
                                            key={`q-${index}`}
                                            cx={`${x}%`}
                                            cy={`${y}%`}
                                            r="5"
                                            fill="#9333ea"
                                            className="hover:r-7 transition-all cursor-pointer"
                                        >
                                            <title>{item.day}: {item.queries} consultas</title>
                                        </circle>
                                    );
                                })}

                                {/* Data points for Users */}
                                {analyticsData.activityOverTime.map((item, index) => {
                                    const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                    const y = 100 - (item.users / 300) * 100;
                                    return (
                                        <circle
                                            key={`u-${index}`}
                                            cx={`${x}%`}
                                            cy={`${y}%`}
                                            r="5"
                                            fill="#3b82f6"
                                            className="hover:r-7 transition-all cursor-pointer"
                                        >
                                            <title>{item.day}: {item.users} usuários</title>
                                        </circle>
                                    );
                                })}

                                {/* Data points for Documents */}
                                {analyticsData.activityOverTime.map((item, index) => {
                                    const x = (index / (analyticsData.activityOverTime.length - 1)) * 100;
                                    const y = 100 - ((item.documents * 10) / 300) * 100;
                                    return (
                                        <circle
                                            key={`d-${index}`}
                                            cx={`${x}%`}
                                            cy={`${y}%`}
                                            r="5"
                                            fill="#10b981"
                                            className="hover:r-7 transition-all cursor-pointer"
                                        >
                                            <title>{item.day}: {item.documents} documentos</title>
                                        </circle>
                                    );
                                })}

                                {/* Gradient definitions */}
                                <defs>
                                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#2563eb" />
                                    </linearGradient>
                                    <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#a855f7" />
                                        <stop offset="100%" stopColor="#9333ea" />
                                    </linearGradient>
                                    <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* X-axis labels */}
                        <div className="absolute left-12 right-0 bottom-0 flex justify-between text-xs font-medium text-slate-700">
                            {analyticsData.activityOverTime.map((item, index) => (
                                <span key={index} className="text-center">{item.day}</span>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center space-x-6 mt-8 pt-4 border-t border-slate-200">
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-xs text-slate-600">Usuários Ativos</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-xs text-slate-600">Consultas Realizadas</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-slate-600">Documentos Processados</span>
                        </div>
                    </div>
                </div>

                {/* Model Usage Chart */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Uso de Modelos LLM
                    </h3>
                    <div className="space-y-4">
                        {analyticsData.modelUsage.map((item, index) => (
                            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-800">{item.model}</h4>
                                            <p className="text-xs text-slate-500">{item.requests.toLocaleString()} requisições</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-800">{item.percentage}%</p>
                                    </div>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                    <div
                                        className={`bg-gradient-to-r ${item.color} h-3 rounded-full transition-all shadow-sm`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Total Summary */}
                    <div className="mt-6 pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-600">Total de Requisições</span>
                            <span className="text-lg font-bold text-slate-800">
                                {analyticsData.modelUsage.reduce((sum, item) => sum + item.requests, 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Export Section */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Exportar Dados
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Exportar CSV</span>
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Exportar Excel</span>
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Exportar PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
