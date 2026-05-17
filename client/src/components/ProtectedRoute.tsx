import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface Props {
    requiredRole?: Role | Role[];
}

export default function ProtectedRoute({ requiredRole }: Props) {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    if (requiredRole) {
        const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (!user?.role || !allowed.includes(user.role)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
}