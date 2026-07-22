import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';

export default function Login() {
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError('Credenciales incorrectas. Verifica e intenta de nuevo.');
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setNotice('Cuenta creada. Revisa tu correo para confirmarla.');
    }
    setBusy(false);
  }

  async function handleGoogle() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sage-light px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo />
          <p className="text-sm text-carbon/60">
            Organizando la iglesia. Un perfil a la vez.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pastor@iglesia.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          {notice && <p className="text-sm text-sage-dark">{notice}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-carbon/40">
          <div className="h-px flex-1 bg-carbon/10" />
          o
          <div className="h-px flex-1 bg-carbon/10" />
        </div>

        <button onClick={handleGoogle} className="btn-secondary w-full">
          Continuar con Google
        </button>

        <p className="mt-6 text-center text-sm text-carbon/60">
          {mode === 'login' ? (
            <>
              ¿Primera vez en ChBook?{' '}
              <button
                className="font-medium text-sage-dark"
                onClick={() => setMode('signup')}
              >
                Crea tu cuenta
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{' '}
              <button
                className="font-medium text-sage-dark"
                onClick={() => setMode('login')}
              >
                Inicia sesión
              </button>
            </>
          )}
        </p>

        <p className="mt-4 text-center text-xs text-carbon/40">
          ¿Tu iglesia aún no está en ChBook?{' '}
          <Link to="/registro-iglesia" className="text-sage-dark underline">
            Regístrala aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
