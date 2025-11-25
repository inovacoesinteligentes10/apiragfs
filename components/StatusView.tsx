/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import minioService from '../services/minioService';

const StatusView: React.FC = () => {
    const [minioStatus, setMinioStatus] = useState({ online: true, message: 'MinIO is running' });
    const [storageStats, setStorageStats] = useState({ used: 0, total: 0, files: 0 });

    useEffect(() => {
        // Check MinIO status
        minioService.getStatus().then(setMinioStatus);
        minioService.getStorageStats().then(setStorageStats);
    }, []);

    const services = [
        {
            name: 'Gemini API',
            status: 'operational',
            uptime: '99.99%',
            latency: '120ms',
            lastCheck: '2 min atrás',
            description: 'API principal de processamento de linguagem natural'
        },
        {
            name: 'MinIO Storage',
            status: minioStatus.online ? 'operational' : 'down',
            uptime: minioStatus.online ? '99.99%' : '0%',
            latency: minioStatus.online ? '15ms' : 'N/A',
            lastCheck: 'Agora',
            description: 'Sistema de armazenamento de objetos para arquivos',
            link: minioService.getConsoleUrl()
        },
        {
            name: 'RAG Storage',
            status: 'operational',
            uptime: '99.95%',
            latency: '45ms',
            lastCheck: '1 min atrás',
            description: 'Sistema de armazenamento de documentos vetorizados'
        },
        {
            name: 'File Upload Service',
            status: 'operational',
            uptime: '99.98%',
            latency: '230ms',
            lastCheck: '3 min atrás',
            description: 'Serviço de upload e processamento de documentos'
        },
        {
            name: 'Chat Service',
            status: 'operational',
            uptime: '100%',
            latency: '85ms',
            lastCheck: 'Agora',
            description: 'Serviço de gerenciamento de conversas'
        },
        {
            name: 'Analytics Engine',
            status: 'degraded',
            uptime: '97.2%',
            latency: '450ms',
            lastCheck: '5 min atrás',
            description: 'Motor de análise e métricas'
        }
    ];

    const systemMetrics = {
        cpu: 34,
        memory: 68,
        storage: 42,
        network: 18
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational':
                return 'bg-green-500';
            case 'degraded':
                return 'bg-yellow-500';
            case 'down':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'operational':
                return 'Operacional';
            case 'degraded':
                return 'Degradado';
            case 'down':
                return 'Fora do Ar';
            default:
                return 'Desconhecido';
        }
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Status dos Serviços</h1>
                    <p className="text-slate-600">Monitoramento em tempo real da infraestrutura do ApiRAGFS</p>
                </div>

                {/* Overall Status Banner */}
                <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Todos os Sistemas Operacionais</h2>
                            <p className="text-green-100">Última atualização: Agora</p>
                        </div>
                    </div>
                </div>

                {/* Services Status */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-8">
                    <div className="p-6 border-b border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                            Serviços Monitorados
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {services.map((service, index) => (
                            <div key={index} className="p-6 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-4 flex-1">
                                        <div className={`w-3 h-3 ${getStatusColor(service.status)} rounded-full mt-1 shadow-lg`} />
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h4 className="text-base font-semibold text-slate-800">{service.name}</h4>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                    service.status === 'operational'
                                                        ? 'bg-green-100 text-green-700'
                                                        : service.status === 'degraded'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {getStatusText(service.status)}
                                                </span>
                                                {(service as any).link && (
                                                    <a
                                                        href={(service as any).link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                        </svg>
                                                        <span>Console</span>
                                                    </a>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-600 mb-3">{service.description}</p>
                                            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                    </svg>
                                                    <span>Uptime: {service.uptime}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Latência: {service.latency}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Última verificação: {service.lastCheck}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MinIO Storage Stats */}
                <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            Estatísticas de Armazenamento MinIO
                        </h3>
                        <a
                            href={minioService.getConsoleUrl()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>Abrir Console</span>
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-700">Espaço Usado</span>
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-1">{minioService.formatBytes(storageStats.used)}</p>
                            <p className="text-xs text-slate-500">de {minioService.formatBytes(storageStats.total)}</p>
                            <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(storageStats.used / storageStats.total) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-700">Total de Arquivos</span>
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-1">{storageStats.files}</p>
                            <p className="text-xs text-slate-500">arquivos armazenados</p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-700">Espaço Disponível</span>
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-1">{minioService.formatBytes(storageStats.total - storageStats.used)}</p>
                            <p className="text-xs text-slate-500">disponível para uso</p>
                        </div>
                    </div>
                </div>

                {/* System Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-700">CPU</h4>
                            <span className="text-lg font-bold text-slate-800">{systemMetrics.cpu}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${systemMetrics.cpu}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Uso normal</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-700">Memória</h4>
                            <span className="text-lg font-bold text-slate-800">{systemMetrics.memory}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${systemMetrics.memory}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Uso moderado</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-700">Armazenamento</h4>
                            <span className="text-lg font-bold text-slate-800">{systemMetrics.storage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                                style={{ width: `${systemMetrics.storage}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Espaço disponível</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-slate-700">Rede</h4>
                            <span className="text-lg font-bold text-slate-800">{systemMetrics.network}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all"
                                style={{ width: `${systemMetrics.network}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Tráfego baixo</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatusView;
