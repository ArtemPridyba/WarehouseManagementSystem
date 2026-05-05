import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { useAuth as useAuthContext } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { LoginRequest } from '../types';

export function useAuth() {
    return useAuthContext();
}

export function useLogin() {
    const { login } = useAuthContext();
    const navigate = useNavigate();

    const execute = useCallback(
        async (data: LoginRequest) => {
            const response = await authService.login(data);
            login(response);
            navigate('/dashboard', { replace: true });
        },
        [login, navigate],
    );

    return { execute };
}

export function useLogout() {
    const { logout } = useAuthContext();
    const navigate = useNavigate();

    const execute = useCallback(() => {
        logout();
        navigate('/login', { replace: true });
    }, [logout, navigate]);

    return { execute };
}

export function useRole() {
    const { user, isAdmin } = useAuthContext();

    return {
        role: user?.role ?? null,
        isAdmin,
        isWorker: user?.role === 'Worker',
        can: (action: 'edit' | 'delete' | 'adjust') => {
            if (['edit', 'delete', 'adjust'].includes(action)) return isAdmin;
            return true;
        },
    };
}