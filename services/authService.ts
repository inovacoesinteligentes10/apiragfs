/**
 * AuthService - Gerencia autenticação JWT
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    name: string;
    password: string;
    role?: 'student' | 'professor' | 'admin';
}

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    last_login: string | null;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: AuthUser;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
}

class AuthService {
    private accessToken: string | null = null;
    private refreshToken: string | null = null;
    private user: AuthUser | null = null;

    constructor() {
        // Carregar tokens do localStorage ao inicializar
        this.loadFromStorage();
    }

    /**
     * Carrega tokens e usuário do localStorage
     */
    private loadFromStorage(): void {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
        const userJson = localStorage.getItem('user');
        if (userJson) {
            try {
                this.user = JSON.parse(userJson);
            } catch (e) {
                console.error('Error parsing user from localStorage', e);
                this.user = null;
            }
        }
    }

    /**
     * Salva tokens e usuário no localStorage
     */
    private saveToStorage(accessToken: string, refreshToken: string, user: AuthUser): void {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = user;
    }

    /**
     * Remove tokens e usuário do localStorage
     */
    private clearStorage(): void {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        this.accessToken = null;
        this.refreshToken = null;
        this.user = null;
    }

    /**
     * Registra novo usuário
     */
    async register(data: RegisterData): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                role: data.role || 'student',
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Registration failed');
        }

        const loginResponse: LoginResponse = await response.json();
        this.saveToStorage(loginResponse.access_token, loginResponse.refresh_token, loginResponse.user);
        return loginResponse;
    }

    /**
     * Faz login do usuário
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }

        const loginResponse: LoginResponse = await response.json();
        this.saveToStorage(loginResponse.access_token, loginResponse.refresh_token, loginResponse.user);
        return loginResponse;
    }

    /**
     * Faz logout do usuário
     */
    async logout(): Promise<void> {
        if (!this.refreshToken) {
            this.clearStorage();
            return;
        }

        try {
            await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`,
                },
                body: JSON.stringify({
                    refresh_token: this.refreshToken,
                }),
            });
        } catch (error) {
            console.error('Logout request failed', error);
        } finally {
            this.clearStorage();
        }
    }

    /**
     * Renova o access token usando refresh token
     */
    async refreshAccessToken(): Promise<string> {
        if (!this.refreshToken) {
            throw new Error('No refresh token available');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: this.refreshToken,
            }),
        });

        if (!response.ok) {
            this.clearStorage();
            throw new Error('Token refresh failed');
        }

        const tokenResponse: TokenResponse = await response.json();
        this.accessToken = tokenResponse.access_token;
        this.refreshToken = tokenResponse.refresh_token;
        localStorage.setItem('access_token', tokenResponse.access_token);
        localStorage.setItem('refresh_token', tokenResponse.refresh_token);

        return tokenResponse.access_token;
    }

    /**
     * Busca dados do usuário atual
     */
    async getCurrentUser(): Promise<AuthUser> {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expirado, tentar renovar
                try {
                    await this.refreshAccessToken();
                    // Tentar novamente com novo token
                    return this.getCurrentUser();
                } catch (error) {
                    this.clearStorage();
                    throw new Error('Authentication expired');
                }
            }
            throw new Error('Failed to get current user');
        }

        const user: AuthUser = await response.json();
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    }

    /**
     * Retorna o usuário atual (do cache)
     */
    getUser(): AuthUser | null {
        return this.user;
    }

    /**
     * Retorna o access token atual
     */
    getAccessToken(): string | null {
        return this.accessToken;
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isAuthenticated(): boolean {
        return !!this.accessToken && !!this.user;
    }

    /**
     * Faz uma requisição autenticada (com auto-refresh se necessário)
     */
    async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }

        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`,
        };

        let response = await fetch(url, { ...options, headers });

        // Se token expirou, tenta renovar e fazer requisição novamente
        if (response.status === 401) {
            try {
                await this.refreshAccessToken();
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(url, { ...options, headers });
            } catch (error) {
                this.clearStorage();
                throw new Error('Authentication expired');
            }
        }

        return response;
    }
}

// Exporta uma instância única (singleton)
export const authService = new AuthService();
