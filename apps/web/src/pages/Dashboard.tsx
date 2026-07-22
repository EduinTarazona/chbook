import { useEffect, useState } from 'react';
import type { ChurchMetrics } from '@chbook/types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-carbon/60">{label}</p>
      <p className="mt-1 text-3xl font-medium text-sage-dark">{value}</p>
      {hint && <p className="mt-1 text-xs text-carbon/50">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { church } = useAuth();
  const [metrics, setMetrics] = useState<ChurchMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!church) return;
    supabase
      .from('church_metrics')
      .select('*')
      .eq('church_id', church.id)
      .maybeSingle()
      .then(({ data }) => {
        setMetrics(data as ChurchMetrics | null);
        setLoading(false);
      });
  }, [church]);

  if (loading) return <p className="text-carbon/50">Cargando métricas…</p>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-carbon/60">
          El recurso más importante no es el capital — es el ser humano.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Miembros totales"
          value={metrics?.total_members ?? 0}
        />
        <MetricCard
          label="Miembros activos"
          value={metrics?.active_members ?? 0}
          hint={`${metrics?.active_pct ?? 0}% de la congregación`}
        />
        <MetricCard
          label="Asistencia promedio"
          value={metrics?.avg_attendance ?? 0}
          hint="Últimos 8 cultos"
        />
        <MetricCard
          label="Ocupación del templo"
          value={`${metrics?.occupancy_pct ?? 0}%`}
          hint={
            church?.capacity
              ? `Capacidad: ${church.capacity}`
              : 'Define la capacidad del templo'
          }
        />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-carbon/60">Prospectos pendientes</p>
          <p className="mt-1 text-3xl font-medium text-brown">
            {metrics?.prospect_members ?? 0}
          </p>
          <p className="mt-1 text-xs text-carbon/50">
            Personas esperando aprobación en Miembros
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-carbon/60">Miembros inactivos</p>
          <p className="mt-1 text-3xl font-medium text-brown">
            {metrics?.inactive_members ?? 0}
          </p>
          <p className="mt-1 text-xs text-carbon/50">
            Sin asistencia registrada en el rango configurado
          </p>
        </div>
      </div>
    </div>
  );
}
