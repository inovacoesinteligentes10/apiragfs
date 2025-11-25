/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RagStore } from '../services/apiService';

interface StoreSelectorProps {
    stores: RagStore[];
    selectedStore: RagStore | null;
    onSelectStore: (store: RagStore) => void;
    disabled?: boolean;
}

const StoreSelector: React.FC<StoreSelectorProps> = ({ stores, selectedStore, onSelectStore, disabled = false }) => {
    const getStoreIcon = (icon: string | null) => {
        switch (icon) {
            case 'folder':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                );
            case 'users':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            case 'shopping-cart':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'cpu':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                );
            case 'shield':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                );
            case 'dollar-sign':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                );
        }
    };

    const getColorClass = (color: string | null) => {
        switch (color) {
            case 'blue': return 'from-blue-500 to-blue-600';
            case 'purple': return 'from-purple-500 to-purple-600';
            case 'green': return 'from-green-500 to-green-600';
            case 'red': return 'from-red-500 to-red-600';
            case 'yellow': return 'from-yellow-500 to-yellow-600';
            case 'orange': return 'from-orange-500 to-orange-600';
            case 'pink': return 'from-pink-500 to-pink-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    if (stores.length === 0) {
        return null;
    }

    return (
        <div className="w-full bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-5xl mx-auto px-8 py-4">
                <div className="flex items-center space-x-3">
                    <label className="text-sm font-semibold text-slate-700 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        Contexto:
                    </label>
                    <div className="flex-1 flex flex-wrap gap-2">
                        {stores.map((store) => (
                            <button
                                key={store.id}
                                onClick={() => onSelectStore(store)}
                                disabled={disabled}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                    selectedStore?.id === store.id
                                        ? `bg-gradient-to-r ${getColorClass(store.color)} text-white shadow-md`
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                title={store.description || store.display_name}
                            >
                                <span className={selectedStore?.id === store.id ? 'text-white' : 'text-slate-600'}>
                                    {getStoreIcon(store.icon)}
                                </span>
                                <span className="text-sm">
                                    {store.display_name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    selectedStore?.id === store.id
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {store.document_count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoreSelector;
