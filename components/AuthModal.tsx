/**
 * AuthModal - Modal para Login e Register
 */
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);

    if (!isOpen) return null;

    const handleSuccess = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-md">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Forms */}
                    {mode === 'login' ? (
                        <LoginForm
                            onSuccess={handleSuccess}
                            onSwitchToRegister={() => setMode('register')}
                        />
                    ) : (
                        <RegisterForm
                            onSuccess={handleSuccess}
                            onSwitchToLogin={() => setMode('login')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
