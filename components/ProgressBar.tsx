/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface ProgressBarProps {
  progress: number;
  total: number;
  message: string;
  fileName?: string;
  icon?: React.ReactNode;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, total, message, fileName, icon }) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-2xl w-full">
        {icon && <div className="mb-8 flex items-center justify-center">{icon}</div>}
        <h2 className="text-3xl font-bold mb-3 text-slate-800">{message}</h2>
        <p className="text-slate-600 mb-6 h-6 truncate max-w-full px-4" title={fileName}>{fileName || ''}</p>
        <div className="w-full bg-slate-300 rounded-full h-3 overflow-hidden shadow-inner">
            <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300 ease-in-out animate-progress-stripes"
                style={{
                    width: `${percentage}%`,
                    backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                    backgroundSize: '1rem 1rem'
                }}
            ></div>
        </div>
        <p className="mt-4 text-xl font-semibold text-slate-700">{`${progress} / ${total}`}</p>
    </div>
  );
};

export default ProgressBar;