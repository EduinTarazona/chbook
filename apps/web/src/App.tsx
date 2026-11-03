import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Directory from './pages/Directory';
import ChurchProfile from './pages/ChurchProfile';
import RegisterChurch from './pages/RegisterChurch';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Events from './pages/Events';
import Settings from './pages/Settings';

function Protected({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-carbon/50">
        Cargando…
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/directorio" element={<Directory />} />
      <Route path="/iglesia/:slug" element={<ChurchProfile />} />

      {/* Onboarding */}
      <Route
        path="/registro-iglesia"
        element={
          <Protected>
            <RegisterChurch />
          </Protected>
        }
      />

      {/* Panel del pastor */}
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
        <Route path="/cultos/:id" element={<ServiceDetail />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/configuracion" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
