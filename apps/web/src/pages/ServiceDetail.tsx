import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Service } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface AttendeeRow {
  id: string;
  type: string;
  checked_at: string;
  members: { full_name: string; role: string } | null;
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { church } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [attendees, setAttendees] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !church) return;
    (async () => {
      const [{ data: s }, { data: a }] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('id', id)
          .eq('church_id', church.id)
          .maybeSingle(),
        supabase
          .from('attendance')
          .select('id, type, checked_at, members(full_name, role)')
          .eq('service_id', id)
          .order('checked_at', { ascending: true }),
      ]);
      setService(s as Service | null);
      setAttendees((a as unknown as AttendeeRow[]) ?? []);
      setLoading(false);
    })();
  }, [id, church]);

  if (loading) return <p className="text-carbon/50">Cargando culto…</p>;

  if (!service) {
    return (
      <div>
        <p className="text-carbon/60">Este culto no existe.</p>
        <Link to="/cultos" className="btn-secondary mt-4 inline-block">
          Volver a cultos
        </Link>
      </div>
    );
  }

  const online = attendees.filter((a) => a.type === 'online').length;

  return (
    <div>
      <Link
        to="/cultos"
        className="text-sm font-medium text-sage-dark hover:underline"
      >
        ← Cultos
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">{service.name}</h1>
          <p className="mt-1 text-sm text-carbon/60">
            {service.starts_at
              ? new Date(service.starts_at).toLocaleString('es-CO', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })
              : 'Sin fecha'}
            {service.online_code && (
              <>
                {' '}
                · Código online:{' '}
                <span className="font-mono text-sage-dark">
                  {service.online_code}
                </span>
              </>
            )}
          </p>
        </div>
        <div className="card px-6 py-3 text-center">
          <p className="text-3xl font-medium text-sage-dark">
            {attendees.length}
          </p>
          <p className="text-xs text-carbon/60">
            asistentes · {attendees.length - online} presencial · {online}{' '}
            online
          </p>
        </div>
      </div>

      {attendees.length === 0 ? (
        <p className="py-12 text-center text-carbon/50">
          Nadie registró asistencia en este culto.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-carbon/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-carbon/70">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Miembro</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Hora de check-in</th>
              </tr>
            </thead>
            <tbody>
              {attendees.map((a, i) => (
                <tr key={a.id} className="border-t border-carbon/5">
                  <td className="px-4 py-3 text-carbon/50">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {a.members?.full_name ?? 'Miembro eliminado'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        a.type === 'online'
                          ? 'bg-brown/15 text-brown'
                          : 'bg-sage-dark/15 text-sage-dark'
                      }`}
                    >
                      {a.type === 'online' ? '💻 Online' : '📍 Presencial'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">
                    {new Date(a.checked_at).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
