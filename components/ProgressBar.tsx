/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  fileName?: string;
  icon?: React.ReactNode;
  onCancel?: () => void;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  total,
  message,
  fileName,
  icon,
  onCancel
}) => {
  const percentage = total > 0 ? Math.min((progress / total) * 100, 100) : 0;
  const [startTime] = useState(Date.now());
  const [estimatedTime, setEstimatedTime] = useState<string>('Calculando...');

  // Calcular tempo estimado
  useEffect(() => {
    if (progress > 0 && progress < total) {
      const elapsed = (Date.now() - startTime) / 1000; // segundos
      const rate = progress / elapsed; // progresso por segundo
      const remaining = (total - progress) / rate; // segundos restantes

      if (remaining < 60) {
        setEstimatedTime(`${Math.round(remaining)}s restantes`);
      } else if (remaining < 3600) {
        setEstimatedTime(`${Math.round(remaining / 60)}min restantes`);
      } else {
        setEstimatedTime('Calculando...');
      }
    } else if (progress >= total) {
      setEstimatedTime('Completo!');
    }
  }, [progress, total, startTime]);

  // Determinar ícone e cor baseado no status
  const getStatusIcon = () => {
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('enviado') || normalizedMessage.includes('upload')) {
      return (
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      );
    } else if (normalizedMessage.includes('extraindo') || normalizedMessage.includes('extract')) {
      return (
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    } else if (normalizedMessage.includes('chunk') || normalizedMessage.includes('divid')) {
      return (
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
      );
    } else if (normalizedMessage.includes('embedding') || normalizedMessage.includes('gerando')) {
      return (
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      );
    } else if (normalizedMessage.includes('indexando') || normalizedMessage.includes('index')) {
      return (
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center animate-pulse">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
      );
    } else if (normalizedMessage.includes('completo') || normalizedMessage.includes('concluído')) {
      return (
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    }

    return icon || (
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    );
  };

  // Determinar cor da barra baseado no progresso
  const getBarColor = () => {
    if (percentage < 30) return 'from-blue-500 to-blue-600';
    if (percentage < 50) return 'from-purple-500 to-purple-600';
    if (percentage < 70) return 'from-orange-500 to-orange-600';
    if (percentage < 90) return 'from-green-500 to-green-600';
    return 'from-emerald-500 to-emerald-600';
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl w-full">
      {/* Ícone animado */}
      <div className="mb-6">
        {getStatusIcon()}
      </div>

      {/* Título */}
      <h2 className="text-3xl font-bold mb-2 text-slate-800">{message}</h2>

      {/* Nome do arquivo */}
      {fileName && (
        <p className="text-slate-600 mb-6 h-6 truncate max-w-full px-4 text-sm" title={fileName}>
          {fileName}
        </p>
      )}

      {/* Progress bar */}
      <div className="w-full mb-4">
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden shadow-inner relative">
          {/* Barra de progresso */}
          <div
            className={`bg-gradient-to-r ${getBarColor()} h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden`}
            style={{ width: `${percentage}%` }}
          >
            {/* Animação de stripes */}
            <div
              className="absolute inset-0 animate-progress-stripes"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                backgroundSize: '1rem 1rem'
              }}
            />

            {/* Shimmer effect */}
            <div
              className="absolute inset-0 animate-shimmer"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                backgroundSize: '200% 100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Informações de progresso */}
      <div className="flex items-center justify-between w-full mb-4">
        <div className="text-left">
          <p className="text-2xl font-bold text-slate-800">
            {Math.round(percentage)}%
          </p>
          <p className="text-xs text-slate-500">
            {progress} de {total}
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-slate-700">
            {estimatedTime}
          </p>
          <p className="text-xs text-slate-500">
            Tempo estimado
          </p>
        </div>
      </div>

      {/* Etapas de processamento */}
      <div className="w-full bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div className={`flex items-center space-x-1 ${percentage >= 10 ? 'text-blue-600 font-semibold' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${percentage >= 10 ? 'bg-blue-600' : 'bg-slate-300'}`} />
            <span>Upload</span>
          </div>

          <div className={`flex items-center space-x-1 ${percentage >= 30 ? 'text-purple-600 font-semibold' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${percentage >= 30 ? 'bg-purple-600' : 'bg-slate-300'}`} />
            <span>Extração</span>
          </div>

          <div className={`flex items-center space-x-1 ${percentage >= 50 ? 'text-orange-600 font-semibold' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${percentage >= 50 ? 'bg-orange-600' : 'bg-slate-300'}`} />
            <span>Chunks</span>
          </div>

          <div className={`flex items-center space-x-1 ${percentage >= 70 ? 'text-green-600 font-semibold' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${percentage >= 70 ? 'bg-green-600' : 'bg-slate-300'}`} />
            <span>Embeddings</span>
          </div>

          <div className={`flex items-center space-x-1 ${percentage >= 90 ? 'text-indigo-600 font-semibold' : ''}`}>
            <div className={`w-2 h-2 rounded-full ${percentage >= 90 ? 'bg-indigo-600' : 'bg-slate-300'}`} />
            <span>Indexação</span>
          </div>
        </div>
      </div>

      {/* Botão cancelar (se callback fornecido) */}
      {onCancel && percentage < 100 && (
        <button
          onClick={onCancel}
          className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Cancelar Upload</span>
        </button>
      )}
    </div>
  );
};

// Adicionar animações CSS customizadas
const style = document.createElement('style');
style.textContent = `
  @keyframes progress-stripes {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 1rem 0;
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .animate-progress-stripes {
    animation: progress-stripes 1s linear infinite;
  }

  .animate-shimmer {
    animation: shimmer 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default ProgressBar;
