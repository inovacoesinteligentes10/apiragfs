/**
 * Loading skeleton components for better UX
 */
import React from 'react';

/**
 * Generic skeleton box
 */
export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

/**
 * Skeleton for documents table
 */
export const DocumentsTableSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {/* Table Header Skeleton */}
            <div className="flex items-center justify-between mb-4">
                <SkeletonBox className="h-8 w-48" />
                <SkeletonBox className="h-10 w-32" />
            </div>

            {/* Table Rows Skeleton */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="border-b border-slate-200 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <SkeletonBox className="h-10 w-10 rounded-lg" />
                                    <div className="flex-1">
                                        <SkeletonBox className="h-5 w-64 mb-2" />
                                        <SkeletonBox className="h-4 w-32" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <SkeletonBox className="h-6 w-20 rounded-full" />
                                <SkeletonBox className="h-8 w-8 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton for chat interface
 */
export const ChatSkeleton: React.FC = () => {
    return (
        <div className="space-y-4">
            {/* Chat Header Skeleton */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <SkeletonBox className="h-6 w-48 mb-3" />
                <SkeletonBox className="h-4 w-96" />
            </div>

            {/* Chat Messages Skeleton */}
            <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                    <div
                        key={index}
                        className={`flex ${index % 2 === 0 ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-2xl ${index % 2 === 0 ? 'bg-blue-50' : 'bg-white'} rounded-xl shadow-md p-4`}>
                            <SkeletonBox className="h-4 w-full mb-2" />
                            <SkeletonBox className="h-4 w-3/4 mb-2" />
                            <SkeletonBox className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Skeleton */}
            <div className="bg-white rounded-xl shadow-md p-4">
                <SkeletonBox className="h-12 w-full" />
            </div>
        </div>
    );
};

/**
 * Skeleton for analytics dashboard
 */
export const AnalyticsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <SkeletonBox className="h-8 w-48 mb-2" />
                    <SkeletonBox className="h-4 w-96" />
                </div>
                <SkeletonBox className="h-10 w-32" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <SkeletonBox className="h-12 w-12 rounded-lg mb-4" />
                        <SkeletonBox className="h-8 w-20 mb-2" />
                        <SkeletonBox className="h-4 w-32 mb-2" />
                        <SkeletonBox className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center mb-4">
                            <SkeletonBox className="h-5 w-5 mr-2" />
                            <SkeletonBox className="h-6 w-48" />
                        </div>
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-1">
                                        <SkeletonBox className="h-4 w-24" />
                                        <SkeletonBox className="h-4 w-12" />
                                    </div>
                                    <SkeletonBox className="h-2 w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Skeleton for dashboard cards
 */
export const DashboardSkeleton: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Welcome Card Skeleton */}
            <div className="bg-white rounded-xl shadow-md p-8 border border-slate-200">
                <SkeletonBox className="h-8 w-64 mb-3" />
                <SkeletonBox className="h-4 w-96 mb-6" />
                <div className="flex space-x-4">
                    <SkeletonBox className="h-10 w-32" />
                    <SkeletonBox className="h-10 w-32" />
                </div>
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, index) => (
                    <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <SkeletonBox className="h-12 w-12 rounded-lg" />
                        </div>
                        <SkeletonBox className="h-8 w-16 mb-2" />
                        <SkeletonBox className="h-4 w-32" />
                    </div>
                ))}
            </div>

            {/* Recent Activity Skeleton */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <SkeletonBox className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                    {[...Array(4)].map((_, index) => (
                        <div key={index} className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                            <SkeletonBox className="h-10 w-10 rounded-full" />
                            <div className="flex-1">
                                <SkeletonBox className="h-4 w-48 mb-2" />
                                <SkeletonBox className="h-3 w-32" />
                            </div>
                            <SkeletonBox className="h-8 w-20" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Skeleton for store cards
 */
export const StoreCardSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <SkeletonBox className="h-12 w-12 rounded-lg" />
                    <div>
                        <SkeletonBox className="h-5 w-32 mb-2" />
                        <SkeletonBox className="h-3 w-48" />
                    </div>
                </div>
                <SkeletonBox className="h-8 w-8 rounded-lg" />
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-8 w-20" />
            </div>
        </div>
    );
};

/**
 * Generic loading spinner
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`}></div>
    );
};

/**
 * Full page loading with spinner
 */
export const FullPageLoading: React.FC<{ message?: string }> = ({ message = 'Carregando...' }) => {
    return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
                <LoadingSpinner size="lg" className="mx-auto mb-4" />
                <p className="text-slate-600">{message}</p>
            </div>
        </div>
    );
};

/**
 * Error state component
 */
export const ErrorState: React.FC<{
    title: string;
    message: string;
    onRetry?: () => void;
    retryLabel?: string;
}> = ({ title, message, onRetry, retryLabel = 'Tentar Novamente' }) => {
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start">
                <svg className="w-6 h-6 text-red-600 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                    <h3 className="text-red-800 font-semibold mb-1">{title}</h3>
                    <p className="text-red-600 text-sm">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                            {retryLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * Empty state component
 */
export const EmptyState: React.FC<{
    icon?: React.ReactNode;
    title: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}> = ({ icon, title, message, action }) => {
    return (
        <div className="text-center py-12">
            {icon && (
                <div className="flex justify-center mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-600 mb-6">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
};
