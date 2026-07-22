import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Member, MemberStatus } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

const statusLabels: Record<MemberStatus, string> = {
  prospect: 'Prospecto',
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
};

const statusStyles: Record<MemberStatus, string> = {
  prospect: 'bg-brown/15 text-brown',
  active: 'bg-sage-dark/15 text-sage-dark',
  inactive: 'bg-carbon/10 text-carbon/60',
  archived: 'bg-carbon/5 text-carbon/40',
};

const roleLabels: Record<string, string> = {
  member: 'Miembro',
  leader: 'Líder',
  deacon: 'Diácono',
  musician: 'Músico',
  admin: 'Admin',
};

const ageLabels: Record<string, string> = {
  child: 'Niño',
  teen: 'Adolescente',
  adult: 'Adulto',
  senior: 'Mayor',
};

export default function Members() {
  const { church } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<MemberStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [role, setRole] = useState('member');

  const load = useCallback(async () => {
    if (!church) return;
    const { data } = await supabase
      .from('members')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: false });
    setMembers((data as Member[]) ?? []);
  }, [church]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(member: Member, status: MemberStatus) {
    await supabase.from('members').update({ status }).eq('id', member.id);
    await load();
  }

  async function setMemberRole(member: Member, newRole: string) {
    await supabase.from('members').update({ role: newRole }).eq('id', member.id);
    await load();
  }

  async function addMember(e: FormEvent) {
    e.preventDefault();
    if (!church) return;
    await supabase.from('members').insert({
      church_id: church.id,
      full_name: fullName,
      phone: phone || null,
      email: email || null,
      birth_date: birthDate || null,
      role,
      status: 'active',
    });
    setFullName('');
    setPhone('');
    setEmail('');
    setBirthDate('');
    setRole('member');
    setShowForm(false);
    await load();
  }

  const visible =
    filter === 'all' ? members : members.filter((m) => m.status === filter);
  const prospects = members.filter((m) => m.status === 'prospect').length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Miembros</h1>
          {prospects > 0 && (
            <p className="mt-1 text-sm text-brown">
              {prospects} prospecto{prospects > 1 ? 's' : ''} esperando
              aprobación
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Agregar miembro'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMember} className="card mb-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nombre completo *</label>
            <input
              className="input"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Correo</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              className="input"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select
              className="input"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {Object.entries(roleLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary">
              Guardar miembro
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 flex gap-2">
        {(['all', 'prospect', 'active', 'inactive', 'archived'] as const).map(
          (value) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                filter === value
                  ? 'bg-sage-dark text-white'
                  : 'bg-cream text-carbon/70 hover:bg-brown/10'
              }`}
            >
              {value === 'all' ? 'Todos' : statusLabels[value]}
            </button>
          )
        )}
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-carbon/50">
          No hay miembros en esta vista todavía.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-carbon/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-carbon/70">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Edad</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((m) => (
                <tr key={m.id} className="border-t border-carbon/5">
                  <td className="px-4 py-3 font-medium">{m.full_name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[m.status]}`}
                    >
                      {statusLabels[m.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-carbon/10 bg-white px-2 py-1 text-xs"
                      value={m.role}
                      onChange={(e) => setMemberRole(m, e.target.value)}
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">
                    {m.age_group ? ageLabels[m.age_group] : '—'}
                  </td>
                  <td className="px-4 py-3 text-carbon/60">
                    {m.phone || m.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {m.status === 'prospect' && (
                        <>
                          <button
                            className="rounded bg-sage-dark px-3 py-1 text-xs font-medium text-white"
                            onClick={() => setStatus(m, 'active')}
                          >
                            Aprobar
                          </button>
                          <button
                            className="rounded border border-carbon/20 px-3 py-1 text-xs"
                            onClick={() => setStatus(m, 'archived')}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                      {m.status === 'active' && (
                        <button
                          className="rounded border border-carbon/20 px-3 py-1 text-xs"
                          onClick={() => setStatus(m, 'inactive')}
                        >
                          Marcar inactivo
                        </button>
                      )}
                      {m.status === 'inactive' && (
                        <>
                          <button
                            className="rounded bg-sage-dark px-3 py-1 text-xs font-medium text-white"
                            onClick={() => setStatus(m, 'active')}
                          >
                            Reactivar
                          </button>
                          <button
                            className="rounded border border-carbon/20 px-3 py-1 text-xs"
                            onClick={() => setStatus(m, 'archived')}
                          >
                            Archivar
                          </button>
                        </>
                      )}
                      {m.status === 'archived' && (
                        <button
                          className="rounded border border-carbon/20 px-3 py-1 text-xs"
                          onClick={() => setStatus(m, 'active')}
                        >
                          Restaurar
                        </button>
                      )}
                    </div>
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
