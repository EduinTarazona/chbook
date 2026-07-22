import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { generateChurchCode, slugify, toWktPoint } from '@chbook/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Logo';

interface Coords {
  lat: number;
  lng: number;
}

export default function RegisterChurch() {
  const { user, church, refreshChurch } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [plan, setPlan] = useState('semilla');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  if (church && !createdCode) return <Navigate to="/dashboard" replace />;

  function captureGps() {
    setGpsStatus('Obteniendo ubicación…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsStatus(null);
      },
      () => setGpsStatus('No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!coords) {
      setError('Fija la ubicación GPS del templo antes de continuar.');
      return;
    }
    setError(null);
    setBusy(true);

    const code = generateChurchCode();
    const { error: insertError } = await supabase.from('churches').insert({
      name,
      slug: `${slugify(name)}-${code.slice(-4)}`,
      code,
      denomination: denomination || null,
      country,
      city: city || null,
      address: address || null,
      pastor_name: pastorName || null,
      capacity: capacity ? Number(capacity) : null,
      plan,
      location: toWktPoint(coords.lat, coords.lng),
      owner_id: user.id,
    });

    if (insertError) {
      setError(`No se pudo registrar la iglesia: ${insertError.message}`);
      setBusy(false);
      return;
    }

    await refreshChurch();
    setCreatedCode(code);
    setBusy(false);
  }

  if (createdCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage-light px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-2 text-2xl">¡Iglesia registrada!</h1>
          <p className="mb-6 text-sm text-carbon/60">
            Comparte este código o el QR con tu congregación para que se
            registren como miembros.
          </p>
          <div className="card mb-6 inline-block bg-cream p-6">
            <QRCodeSVG value={createdCode} size={180} fgColor="#2E2E2E" />
          </div>
          <p className="mb-6 font-mono text-2xl font-medium text-sage-dark">
            {createdCode}
          </p>
          <button
            className="btn-primary w-full"
            onClick={() => navigate('/dashboard')}
          >
            Ir al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-light px-4 py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <Logo size="sm" />
          <span className="text-sm text-carbon/50">Registro de iglesia</span>
        </div>
        <h1 className="mb-6 text-2xl">Datos de tu iglesia</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nombre de la iglesia *</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Iglesia Cristiana Nueva Vida"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Denominación</label>
              <input
                className="input"
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                placeholder="Pentecostal, Bautista…"
              />
            </div>
            <div>
              <label className="label">Pastor principal</label>
              <input
                className="input"
                value={pastorName}
                onChange={(e) => setPastorName(e.target.value)}
                placeholder="Nombre del pastor"
              />
            </div>
            <div>
              <label className="label">País *</label>
              <input
                className="input"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Bucaramanga"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección del templo</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle 45 #23-10"
              />
            </div>
            <div>
              <label className="label">Capacidad del templo</label>
              <input
                className="input"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="150"
              />
            </div>
            <div>
              <label className="label">Plan</label>
              <select
                className="input"
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
              >
                <option value="semilla">🌱 Semilla — hasta 100</option>
                <option value="crecimiento">📈 Crecimiento — hasta 500</option>
                <option value="iglesia_mayor">⛪ Iglesia Mayor — hasta 2.000</option>
              </select>
            </div>
          </div>

          <div className="card">
            <p className="mb-3 text-sm font-medium">
              Ubicación GPS del templo *
            </p>
            <p className="mb-3 text-xs text-carbon/60">
              La asistencia por GPS se valida contra este punto (radio de 100
              m). Fija la ubicación estando en el templo, o ingresa las
              coordenadas manualmente.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={captureGps}
                className="btn-secondary"
              >
                📍 Usar mi ubicación actual
              </button>
              <input
                className="input w-36"
                type="number"
                step="any"
                placeholder="Latitud"
                value={coords?.lat ?? ''}
                onChange={(e) =>
                  setCoords({
                    lat: Number(e.target.value),
                    lng: coords?.lng ?? 0,
                  })
                }
              />
              <input
                className="input w-36"
                type="number"
                step="any"
                placeholder="Longitud"
                value={coords?.lng ?? ''}
                onChange={(e) =>
                  setCoords({
                    lat: coords?.lat ?? 0,
                    lng: Number(e.target.value),
                  })
                }
              />
            </div>
            {gpsStatus && (
              <p className="mt-2 text-xs text-carbon/60">{gpsStatus}</p>
            )}
            {coords && !gpsStatus && (
              <p className="mt-2 font-mono text-xs text-sage-dark">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Registrando…' : 'Registrar iglesia'}
          </button>
        </form>
      </div>
    </div>
  );
}
