import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../config/constants';
import type { AuthResponse, CurrentUser, Role } from '../types';

// ─── JWT decoder ──────────────────────────────────────────────────────────────

function decodeJwt(token: string): Record<string, unknown> {
    try {
        const payload = token.split('.')[1];
        const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return {};
    }
}

function getRoleFromToken(token: string): Role {
    const payload = decodeJwt(token);
    const role =
        (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] as string) ??
        (payload['role'] as string) ??
        'Worker';
    return role === 'Admin' ? 'Admin' : 'Worker';
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

export function loadUserFromStorage(): CurrentUser | null {
    try {
        const raw = localStorage.getItem(AUTH_USER_KEY);
        return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
        return null;
    }
}

function getUserIdFromToken(token: string): string {
    const payload = decodeJwt(token);
    return (payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string) ?? '';
}

export function saveUserToStorage(response: AuthResponse): CurrentUser {
    const user: CurrentUser = {
        id: getUserIdFromToken(response.token), // ← додай
        email: response.email,
        tenantId: response.tenantId,
        fullName: response.fullName,
        role: getRoleFromToken(response.token),
        token: response.token,
    };
    localStorage.setItem(AUTH_TOKEN_KEY, response.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    return user;
}

export function clearUserFromStorage(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function isAdmin(user: CurrentUser | null): boolean {
    return user?.role === 'Admin';
}

export function isAuthenticated(user: CurrentUser | null): boolean {
    return user !== null;
}