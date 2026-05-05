import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { AuthResponse, CurrentUser } from '../types';
import {
    loadUserFromStorage,
    saveUserToStorage,
    clearUserFromStorage,
    isAdmin,
    isAuthenticated,
} from '../store/authStore';


interface AuthContextValue {
    user: CurrentUser | null;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (response: AuthResponse) => void;
    logout: () => void;
}


const AuthContext = createContext<AuthContextValue | null>(null);


export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<CurrentUser | null>(loadUserFromStorage);

    // Слухаємо 401 від Axios interceptor
    useEffect(() => {
        const handler = () => setUser(null);
        window.addEventListener('auth:unauthorized', handler);
        return () => window.removeEventListener('auth:unauthorized', handler);
    }, []);

    const login = useCallback((response: AuthResponse) => {
        const user = saveUserToStorage(response);
        setUser(user);
    }, []);

    const logout = useCallback(() => {
        clearUserFromStorage();
        setUser(null);
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: isAuthenticated(user),
            isAdmin: isAdmin(user),
            login,
            logout,
        }),
        [user, login, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}