/**
 * Contexto global para configurações do sistema
 */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService, GeneralSettingsResponse } from '../services/apiService';
import { useAuth } from './AuthContext';

interface SystemConfig {
    systemName: string;
    systemDescription: string;
    systemLogo: string;
    language: string;
    theme: string;
    notifications: boolean;
    autoSave: boolean;
}

interface SystemConfigContextType {
    config: SystemConfig;
    loading: boolean;
    refreshConfig: () => Promise<void>;
}

const SystemConfigContext = createContext<SystemConfigContextType | undefined>(undefined);

export const useSystemConfig = () => {
    const context = useContext(SystemConfigContext);
    if (!context) {
        throw new Error('useSystemConfig must be used within SystemConfigProvider');
    }
    return context;
};

interface SystemConfigProviderProps {
    children: ReactNode;
}

interface SystemConfigProviderInternalProps extends SystemConfigProviderProps {
    userId: string | null;
}

const SystemConfigProviderInternal: React.FC<SystemConfigProviderInternalProps> = ({ children, userId }) => {
    const [config, setConfig] = useState<SystemConfig>({
        systemName: 'ApiRAGFS',
        systemDescription: 'Sistema RAG com Google Gemini File Search',
        systemLogo: '📚',
        language: 'pt-BR',
        theme: 'light',
        notifications: true,
        autoSave: true
    });
    const [loading, setLoading] = useState(true);

    const resetToDefaults = () => {
        setConfig({
            systemName: 'ApiRAGFS',
            systemDescription: 'Sistema RAG com Google Gemini File Search',
            systemLogo: '📚',
            language: 'pt-BR',
            theme: 'light',
            notifications: true,
            autoSave: true
        });
        document.title = 'ApiRAGFS';
        applyTheme('light');
    };

    const loadConfig = async () => {
        // Se não há usuário logado, usar valores padrão
        if (!userId) {
            resetToDefaults();
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await apiService.getGeneralSettings();
            setConfig({
                systemName: response.system_name,
                systemDescription: response.system_description,
                systemLogo: response.system_logo,
                language: response.language,
                theme: response.theme,
                notifications: response.notifications,
                autoSave: response.auto_save
            });

            // Atualizar título da página
            document.title = response.system_name;

            // Aplicar tema
            applyTheme(response.theme);
        } catch (error) {
            console.error('Erro ao carregar configurações do sistema:', error);
            // Em caso de erro, usar padrões
            resetToDefaults();
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (theme: string) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
        } else if (theme === 'auto') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    };

    // Recarregar quando userId mudar (login/logout)
    useEffect(() => {
        loadConfig();
    }, [userId]);

    const refreshConfig = async () => {
        await loadConfig();
    };

    return (
        <SystemConfigContext.Provider value={{ config, loading, refreshConfig }}>
            {children}
        </SystemConfigContext.Provider>
    );
};

// Wrapper que conecta com AuthContext
export const SystemConfigProvider: React.FC<SystemConfigProviderProps> = ({ children }) => {
    const { user } = useAuth();

    return (
        <SystemConfigProviderInternal userId={user?.id || null}>
            {children}
        </SystemConfigProviderInternal>
    );
};
