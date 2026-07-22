import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Service } from '@chbook/types';
import { generateOnlineCode } from '@chbook/utils';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface AttendanceCounts {
  [serviceId: string]: { presential: number; online: number };
}

export default function Services() {
  const { church } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [counts, setCounts] = useState<AttendanceCounts>({});
  const [name, setName] = useState('Culto dominical');
  const [radius, setRadius] = useState('100');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!church) return;
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const list = (data as Service[]) ?? [];
    setServices(list);

    if (list.length > 0) {
      const { data: att } = await supabase
        .from('attendance')
        .select('service_id, type')
        .in(
          'service_id',
          list.map((s) => s.id)
        );
      const next: AttendanceCounts = {};
      for (const row of (att as { service_id: string; type: string }[]) ?? []) {
        next[row.service_id] ??= { presential: 0, online: 0 };
        if (row.type === 'online') next[row.service_id].online++;
        else next[row.service_id].presential++;
      }
      setCounts(next);
    }
  }, [church]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAndStart(e: FormEvent) {
    e.preventDefault();
    if (!church) return;
    setBusy(true);
    await supabase.from('services').insert({
      church_id: church.id,
      name,
      starts_at: new Date().toISOString(),
      status: 'active',
      online_code: generateOnlineCode(),
      gps_radius: Number(radius) || 100,
    });
    setBusy(false);
    await load();
  }

  async function endService(service: Service) {
    await supabase
      .from('services')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', service.id);
    await load();
  }

  const active = services.find((s) => s.status === 'active');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl">Cultos</h1>
        <p className="mt-1 text-sm text-carbon/60">
          Al iniciar un servicio se abre la ventana de check-in GPS y se genera
          el código para asistentes online.
        </p>
      </div>

      {active ? (
        <div className="card mb-8 border-2 border-sage-dark">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-sage-dark">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage-dark opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sage-dark" />
                </span>
                Culto en curso
              </p>
              <p className="mt-1 text-xl font-medium">{active.name}</p>
              <p className="mt-1 text-sm text-carbon/60">
                Radio GPS: {active.gps_radius} m · Código online:{' '}
                <span className="font-mono font-medium text-sage-dark">
                  {active.online_code}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-medium text-sage-dark">
                {(counts[active.id]?.presential ?? 0) +
                  (counts[active.id]?.online ?? 0)}
              </p>
              <p className="text-xs text-carbon/60">
                asistentes ({counts[active.id]?.online ?? 0} online)
              </p>
              <button
                className="btn-secondary mt-3"
                onClick={() => endService(active)}
              >
                Finalizar culto
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={createAndStart}
          className="card mb-8 flex flex-wrap items-end gap-4"
        >
          <div className="min-w-56 flex-1">
            <label className="label">Nombre del culto</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="w-36">
            <label className="label">Radio GPS (m)</label>
            <input
              className="input"
              type="number"
              min={20}
              max={1000}
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary">
            ▶ Iniciar servicio
          </button>
        </form>
      )}

      <h2 className="mb-3 text-xl">Historial</h2>
      {services.length === 0 ? (
        <p className="py-8 text-center text-carbon/50">
          Aún no hay cultos registrados.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-carbon/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-carbon/70">
              <tr>
                <th className="px-4 py-3 font-medium">Culto</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Presencial</th>
                <th className="px-4 py-3 font-medium">Online</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const c = counts[s.id] ?? { presential: 0, online: 0 };
                return (
                  <tr key={s.id} className="border-t border-carbon/5">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-carbon/60">
                      {s.starts_at
                        ? new Date(s.starts_at).toLocaleString('es-CO', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          s.status === 'active'
                            ? 'bg-sage-dark/15 text-sage-dark'
                            : s.status === 'ended'
                              ? 'bg-carbon/10 text-carbon/60'
                              : 'bg-brown/15 text-brown'
                        }`}
                      >
                        {s.status === 'active'
                          ? 'En curso'
                          : s.status === 'ended'
                            ? 'Finalizado'
                            : 'Programado'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.presential}</td>
                    <td className="px-4 py-3">{c.online}</td>
                    <td className="px-4 py-3 font-medium">
                      {c.presential + c.online}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
