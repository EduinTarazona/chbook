import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ChurchEvent } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

const typeLabels: Record<string, string> = {
  service: 'Culto',
  meeting: 'Reunión',
  special: 'Evento especial',
  rehearsal: 'Ensayo',
  other: 'Otro',
};

export default function Events() {
  const { church } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('service');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!church) return;
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('church_id', church.id)
      .order('starts_at', { ascending: true });
    setEvents((data as ChurchEvent[]) ?? []);
  }, [church]);

  useEffect(() => {
    load();
  }, [load]);

  async function addEvent(e: FormEvent) {
    e.preventDefault();
    if (!church) return;
    setBusy(true);
    await supabase.from('events').insert({
      church_id: church.id,
      title,
      description: description || null,
      event_type: eventType,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      is_public: isPublic,
    });
    setTitle('');
    setDescription('');
    setEventType('service');
    setStartsAt('');
    setEndsAt('');
    setIsPublic(false);
    setShowForm(false);
    setBusy(false);
    await load();
  }

  async function togglePublic(ev: ChurchEvent) {
    await supabase
      .from('events')
      .update({ is_public: !ev.is_public })
      .eq('id', ev.id);
    await load();
  }

  async function removeEvent(ev: ChurchEvent) {
    if (!confirm(`¿Eliminar el evento "${ev.title}"?`)) return;
    await supabase.from('events').delete().eq('id', ev.id);
    await load();
  }

  const now = Date.now();
  const upcoming = events.filter(
    (e) => !e.starts_at || new Date(e.starts_at).getTime() >= now
  );
  const past = events
    .filter((e) => e.starts_at && new Date(e.starts_at).getTime() < now)
    .reverse();

  function EventRow({ ev }: { ev: ChurchEvent }) {
    return (
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 shrink-0 text-center">
            <p className="text-2xl font-medium text-sage-dark">
              {ev.starts_at ? new Date(ev.starts_at).getDate() : '—'}
            </p>
            <p className="text-xs uppercase text-carbon/60">
              {ev.starts_at
                ? new Date(ev.starts_at).toLocaleString('es-CO', {
                    month: 'short',
                  })
                : ''}
            </p>
          </div>
          <div>
            <p className="font-medium">{ev.title}</p>
            <p className="text-xs text-carbon/60">
              {typeLabels[ev.event_type] ?? ev.event_type}
              {ev.starts_at &&
                ` · ${new Date(ev.starts_at).toLocaleString('es-CO', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
            </p>
            {ev.description && (
              <p className="mt-1 text-sm text-carbon/70">{ev.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePublic(ev)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              ev.is_public
                ? 'bg-sage-dark/15 text-sage-dark'
                : 'bg-carbon/10 text-carbon/60'
            }`}
            title="Los eventos públicos aparecen en el perfil de la iglesia"
          >
            {ev.is_public ? 'Público' : 'Interno'}
          </button>
          <button
            onClick={() => removeEvent(ev)}
            className="rounded border border-carbon/20 px-3 py-1 text-xs text-carbon/60 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Calendario</h1>
          <p className="mt-1 text-sm text-carbon/60">
            Los miembros ven estos eventos en su app y reciben recordatorios.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Crear evento'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addEvent} className="card mb-8 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Título *</label>
            <input
              className="input"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Vigilia de oración"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción</label>
            <textarea
              className="input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
            >
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 accent-sage-dark"
              />
              Visible en el perfil público
            </label>
          </div>
          <div>
            <label className="label">Inicio *</label>
            <input
              className="input"
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fin</label>
            <input
              className="input"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">
              Guardar evento
            </button>
          </div>
        </form>
      )}

      <h2 className="mb-3 text-xl">Próximos</h2>
      {upcoming.length === 0 ? (
        <p className="py-6 text-center text-carbon/50">
          No hay eventos próximos. Crea el primero.
        </p>
      ) : (
        <div className="space-y-3">
          {upcoming.map((ev) => (
            <EventRow key={ev.id} ev={ev} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xl text-carbon/60">Pasados</h2>
          <div className="space-y-3 opacity-60">
            {past.map((ev) => (
              <EventRow key={ev.id} ev={ev} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
