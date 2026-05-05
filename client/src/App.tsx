import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import WarehousePage from './pages/WarehousePage';
import UsersPage from './pages/UsersPage';
import InboundPage from './pages/InboundPage';
import OutboundPage from './pages/OutboundPage';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/warehouse" element={<WarehousePage />} />
                            <Route path="/products" element={<ProductsPage />} />
                            <Route path="/inbound" element={<InboundPage />} />
                            <Route path="/outbound" element={<OutboundPage />} />
                        </Route>
                    </Route>

                    <Route element={<ProtectedRoute requiredRole="Admin" />}>
                        <Route element={<MainLayout />}>
                            <Route path="/users" element={<UsersPage />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

function Placeholder({ title }: { title: string }) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center">
                <p className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>{title}</p>
                <p className="text-sm" style={{ color: '#475569' }}>Сторінка в розробці</p>
            </div>
        </div>
    );
}