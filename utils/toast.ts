/**
 * Toast notifications utility using react-hot-toast
 */
import toast from 'react-hot-toast';

/**
 * Show success toast
 */
export const showSuccess = (message: string) => {
    return toast.success(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#10B981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#10B981',
        },
    });
};

/**
 * Show error toast
 */
export const showError = (message: string) => {
    return toast.error(message, {
        duration: 5000,
        position: 'top-right',
        style: {
            background: '#EF4444',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
        },
    });
};

/**
 * Show info toast
 */
export const showInfo = (message: string) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#3B82F6',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        icon: 'ℹ️',
    });
};

/**
 * Show warning toast
 */
export const showWarning = (message: string) => {
    return toast(message, {
        duration: 4000,
        position: 'top-right',
        style: {
            background: '#F59E0B',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
        icon: '⚠️',
    });
};

/**
 * Show loading toast (returns toast id for dismissal)
 */
export const showLoading = (message: string) => {
    return toast.loading(message, {
        position: 'top-right',
        style: {
            background: '#6B7280',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
        },
    });
};

/**
 * Dismiss a specific toast
 */
export const dismissToast = (toastId: string) => {
    toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAllToasts = () => {
    toast.dismiss();
};

/**
 * Show promise toast (auto-updates based on promise state)
 */
export const showPromise = <T,>(
    promise: Promise<T>,
    messages: {
        loading: string;
        success: string;
        error: string;
    }
) => {
    return toast.promise(
        promise,
        {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
        },
        {
            position: 'top-right',
            style: {
                padding: '16px',
                borderRadius: '8px',
            },
        }
    );
};
