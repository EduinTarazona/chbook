import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import Login from './pages/Login';
import RegisterChurch from './pages/RegisterChurch';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Services from './pages/Services';

function Protected({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-carbon/50">
        Cargando…
      </div>
    );
  }
  if (!session) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/registro-iglesia"
        element={
          <Protected>
            <RegisterChurch />
          </Protected>
        }
      />
      <Route
        element={
          <Protected>
            <AppLayout />
          </Protected>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/miembros" element={<Members />} />
        <Route path="/cultos" element={<Services />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
