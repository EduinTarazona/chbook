import { useRef, useState, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

/* Tonos oscuros de la paleta oficial: el texto blanco del panel necesita contraste (R-19) */
const approvedThemes = [
  { hex: '#4A6E4A', name: 'Sage oscuro' },
  { hex: '#6B5344', name: 'Marrón' },
  { hex: '#2E2E2E', name: 'Carbón' },
];

export default function Settings() {
  const { church, refreshChurch } = useAuth();
  const qrRef = useRef<HTMLDivElement>(null);

  const [name, setName] = useState(church?.name ?? '');
  const [pastorName, setPastorName] = useState(church?.pastor_name ?? '');
  const [city, setCity] = useState(church?.city ?? '');
  const [address, setAddress] = useState(church?.address ?? '');
  const [capacity, setCapacity] = useState(
    church?.capacity ? String(church.capacity) : ''
  );
  const [foundedYear, setFoundedYear] = useState(
    church?.founded_year ? String(church.founded_year) : ''
  );
  const [themeColor, setThemeColor] = useState(
    church?.theme_color ?? '#4A6E4A'
  );
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!church) return null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!church) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    const { error: updateError } = await supabase
      .from('churches')
      .update({
        name,
        pastor_name: pastorName || null,
        city: city || null,
        address: address || null,
        capacity: capacity ? Number(capacity) : null,
        founded_year: foundedYear ? Number(foundedYear) : null,
        theme_color: themeColor,
      })
      .eq('id', church.id);
    if (updateError) setError(updateError.message);
    else {
      await refreshChurch();
      setSaved(true);
    }
    setBusy(false);
  }

  function updateGps() {
    if (!church) return;
    setGpsStatus('Obteniendo ubicación…');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error: gpsError } = await supabase
          .from('churches')
          .update({
            location: `POINT(${pos.coords.longitude} ${pos.coords.latitude})`,
          })
          .eq('id', church.id);
        setGpsStatus(
          gpsError
            ? `Error: ${gpsError.message}`
            : `Ubicación actualizada: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        );
      },
      () => setGpsStatus('No se pudo obtener la ubicación.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg || !church) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: 'image/svg+xml',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chbook-qr-${church.code ?? church.slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-3xl">Configuración</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Nombre de la iglesia</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Pastor principal</label>
              <input
                className="input"
                value={pastorName}
                onChange={(e) => setPastorName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Ciudad</label>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Dirección</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
              />
            </div>
            <div>
              <label className="label">Año de fundación</label>
              <input
                className="input"
                type="number"
                min={1800}
                max={new Date().getFullYear()}
                value={foundedYear}
                onChange={(e) => setFoundedYear(e.target.value)}
              />
            </div>
          </div>

          <div>
            <p className="label">Color del tema</p>
            <div className="flex gap-3">
              {approvedThemes.map((t) => (
                <button
                  key={t.hex}
                  type="button"
                  title={t.name}
                  onClick={() => setThemeColor(t.hex)}
                  className={`h-10 w-10 rounded-full transition ${
                    themeColor === t.hex
                      ? 'ring-2 ring-carbon ring-offset-2'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: t.hex }}
                  aria-label={t.name}
                />
              ))}
            </div>
            <p className="mt-1.5 text-xs text-carbon/50">
              Solo combinaciones aprobadas de la paleta oficial. Se aplica al
              panel de administración.
            </p>
          </div>

          <div className="card">
            <p className="mb-2 text-sm font-medium">Ubicación GPS del templo</p>
            <button type="button" onClick={updateGps} className="btn-secondary">
              📍 Actualizar con mi ubicación actual
            </button>
            {gpsStatus && (
              <p className="mt-2 text-xs text-carbon/60">{gpsStatus}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}
          {saved && (
            <p className="text-sm text-sage-dark">✓ Cambios guardados</p>
          )}

          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>

        <div className="card h-fit text-center">
          <p className="text-sm font-medium">Código de tu iglesia</p>
          <p className="mt-1 font-mono text-xl font-medium text-sage-dark">
            {church.code ?? '—'}
          </p>
          {church.code && (
            <>
              <div
                ref={qrRef}
                className="mx-auto mt-4 inline-block rounded-lg bg-white p-3"
              >
                <QRCodeSVG value={church.code} size={160} fgColor="#2E2E2E" />
              </div>
              <button
                onClick={downloadQr}
                className="btn-secondary mt-4 w-full text-sm"
              >
                Descargar QR
              </button>
              <p className="mt-2 text-xs text-carbon/50">
                Imprímelo y pégalo en la entrada del templo para que los
                nuevos se registren.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
