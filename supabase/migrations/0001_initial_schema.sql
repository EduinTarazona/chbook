-- ============================================================
-- ChBook — Esquema inicial
-- Plataforma SaaS multi-tenant de gestión para iglesias
-- ============================================================

-- Extensiones
create extension if not exists postgis;

-- ============================================================
-- TABLA: churches
-- ============================================================
create table if not exists churches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  code        text unique,             -- CHBK-4821
  location    geography(point, 4326),  -- GPS PostGIS
  address     text,
  city        text,
  denomination text,
  capacity    integer,
  pastor_name text,
  founded_year integer,
  plan        text default 'semilla',  -- semilla / crecimiento / iglesia_mayor
  country     text,
  theme_color text default '#4A6E4A',
  photo_url   text,
  owner_id    uuid references auth.users(id) on delete set null,
  stripe_customer_id     text,
  stripe_subscription_id text,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: members
-- ============================================================
create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references churches(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  email       text,
  birth_date  date,
  age_group   text,          -- child/teen/adult/senior
  role        text default 'member',   -- member/leader/deacon/musician/admin
  status      text default 'prospect', -- prospect/active/inactive/archived
  push_token  text,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: services (cultos)
-- ============================================================
create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references churches(id) on delete cascade,
  name        text not null,
  starts_at   timestamptz,
  ended_at    timestamptz,
  status      text default 'scheduled', -- scheduled/active/ended
  online_code text unique,
  gps_radius  integer default 100,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: attendance (asistencia)
-- ============================================================
create table if not exists attendance (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references members(id) on delete cascade,
  church_id   uuid references churches(id) on delete cascade,
  service_id  uuid references services(id) on delete cascade,
  type        text default 'presential', -- presential/online
  location    geography(point, 4326),
  checked_at  timestamptz default now(),
  unique (member_id, service_id)
);

-- ============================================================
-- TABLA: events (calendario)
-- ============================================================
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  church_id   uuid references churches(id) on delete cascade,
  title       text not null,
  description text,
  event_type  text default 'service',
  starts_at   timestamptz,
  ends_at     timestamptz,
  is_public   boolean default false,
  created_at  timestamptz default now()
);

-- ============================================================
-- TABLA: notifications (log)
-- ============================================================
create table if not exists notifications (
  id               uuid primary key default gen_random_uuid(),
  church_id        uuid references churches(id) on delete cascade,
  target_member_id uuid references members(id) on delete set null,
  type             text not null,
  title            text not null,
  body             text not null,
  status           text default 'pending',
  sent_at          timestamptz,
  created_at       timestamptz default now()
);

-- Índices para consultas frecuentes
create index if not exists idx_members_church      on members (church_id, status);
create index if not exists idx_services_church     on services (church_id, status);
create index if not exists idx_attendance_service  on attendance (service_id);
create index if not exists idx_attendance_member   on attendance (member_id, checked_at);
create index if not exists idx_events_church       on events (church_id, starts_at);
create index if not exists idx_churches_location   on churches using gist (location);

-- ============================================================
-- Clasificación automática por edad (R-07)
-- Niño 0-12, Adolescente 13-17, Adulto 18-59, Mayor 60+
-- ============================================================
create or replace function compute_age_group(p_birth_date date)
returns text
language sql immutable as $$
  select case
    when p_birth_date is null then null
    when extract(year from age(p_birth_date)) <= 12 then 'child'
    when extract(year from age(p_birth_date)) <= 17 then 'teen'
    when extract(year from age(p_birth_date)) <= 59 then 'adult'
    else 'senior'
  end;
$$;

create or replace function members_set_age_group()
returns trigger
language plpgsql as $$
begin
  new.age_group := compute_age_group(new.birth_date);
  return new;
end;
$$;

drop trigger if exists trg_members_age_group on members;
create trigger trg_members_age_group
  before insert or update of birth_date on members
  for each row execute function members_set_age_group();

-- ============================================================
-- Función PostGIS — Check-in GPS (Flujo 3)
-- ============================================================
create or replace function check_attendance_radius(
  member_lat  float,
  member_lng  float,
  p_church_id uuid,
  radius_m    float default 100
)
returns table(within_radius boolean, distance_m float)
language sql security definer as $$
  select
    ST_DWithin(
      c.location,
      ST_MakePoint(member_lng, member_lat)::geography,
      radius_m
    ) as within_radius,
    round(ST_Distance(
      c.location,
      ST_MakePoint(member_lng, member_lat)::geography
    )::numeric, 1) as distance_m
  from churches c
  where c.id = p_church_id;
$$;

-- ============================================================
-- RPC — Check-in automático por GPS (R-10)
-- Verifica culto activo + radio y registra la asistencia
-- ============================================================
create or replace function gps_check_in(
  member_lat float,
  member_lng float
)
returns jsonb
language plpgsql security definer as $$
declare
  v_member   members%rowtype;
  v_service  services%rowtype;
  v_within   boolean;
  v_distance float;
begin
  select * into v_member
  from members
  where user_id = auth.uid() and status = 'active'
  limit 1;

  if v_member.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_active_member');
  end if;

  select * into v_service
  from services
  where church_id = v_member.church_id and status = 'active'
  order by starts_at desc
  limit 1;

  if v_service.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_active_service');
  end if;

  select within_radius, distance_m
    into v_within, v_distance
  from check_attendance_radius(
    member_lat, member_lng, v_member.church_id, v_service.gps_radius
  );

  if not coalesce(v_within, false) then
    return jsonb_build_object(
      'ok', false, 'reason', 'out_of_radius', 'distance_m', v_distance
    );
  end if;

  insert into attendance (member_id, church_id, service_id, type, location)
  values (
    v_member.id, v_member.church_id, v_service.id, 'presential',
    ST_MakePoint(member_lng, member_lat)::geography
  )
  on conflict (member_id, service_id) do nothing;

  return jsonb_build_object('ok', true, 'distance_m', v_distance);
end;
$$;

-- ============================================================
-- RPC — Asistencia online por código (R-11)
-- ============================================================
create or replace function online_check_in(p_online_code text)
returns jsonb
language plpgsql security definer as $$
declare
  v_member  members%rowtype;
  v_service services%rowtype;
begin
  select * into v_member
  from members
  where user_id = auth.uid() and status = 'active'
  limit 1;

  if v_member.id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_active_member');
  end if;

  select * into v_service
  from services
  where online_code = upper(p_online_code) and status = 'active'
  limit 1;

  if v_service.id is null or v_service.church_id <> v_member.church_id then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  insert into attendance (member_id, church_id, service_id, type)
  values (v_member.id, v_member.church_id, v_service.id, 'online')
  on conflict (member_id, service_id) do nothing;

  return jsonb_build_object('ok', true);
end;
$$;

-- ============================================================
-- Inactividad por rango (R-13)
-- Marca INACTIVO a quien no asiste en X días (default 60)
-- Pensada para ejecutarse con pg_cron o una Edge Function
-- ============================================================
create or replace function mark_inactive_members(p_days integer default 60)
returns integer
language plpgsql security definer as $$
declare
  v_count integer;
begin
  update members m
  set status = 'inactive'
  where m.status = 'active'
    and not exists (
      select 1 from attendance a
      where a.member_id = m.id
        and a.checked_at > now() - make_interval(days => p_days)
    )
    and m.created_at < now() - make_interval(days => p_days);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- ============================================================
-- VISTA: church_metrics (R-03, R-12)
-- Métricas públicas y del dashboard
-- ============================================================
create or replace view church_metrics as
select
  c.id as church_id,
  c.name,
  c.slug,
  c.code,
  c.capacity,
  c.plan,
  count(m.id) filter (where m.status <> 'archived')            as total_members,
  count(m.id) filter (where m.status = 'active')               as active_members,
  count(m.id) filter (where m.status = 'prospect')             as prospect_members,
  count(m.id) filter (where m.status = 'inactive')             as inactive_members,
  case when count(m.id) filter (where m.status <> 'archived') > 0
    then round(
      100.0 * count(m.id) filter (where m.status = 'active')
      / count(m.id) filter (where m.status <> 'archived'), 1)
    else 0
  end as active_pct,
  coalesce((
    select round(avg(cnt), 1) from (
      select count(a.id) as cnt
      from services s
      left join attendance a on a.service_id = s.id
      where s.church_id = c.id and s.status = 'ended'
      group by s.id
      order by max(s.starts_at) desc
      limit 8
    ) last_services
  ), 0) as avg_attendance,
  case when c.capacity > 0
    then coalesce((
      select round(100.0 * avg(cnt) / c.capacity, 1) from (
        select count(a.id) as cnt
        from services s
        left join attendance a on a.service_id = s.id
        where s.church_id = c.id and s.status = 'ended'
        group by s.id
        order by max(s.starts_at) desc
        limit 8
      ) last_services
    ), 0)
    else 0
  end as occupancy_pct
from churches c
left join members m on m.church_id = c.id
group by c.id;

-- ============================================================
-- ROW LEVEL SECURITY (NF-01)
-- Cada iglesia solo ve sus propios datos
-- ============================================================
alter table churches      enable row level security;
alter table members       enable row level security;
alter table services      enable row level security;
alter table attendance    enable row level security;
alter table events        enable row level security;
alter table notifications enable row level security;

-- Helpers: iglesia y rol del usuario autenticado
create or replace function my_church_id()
returns uuid
language sql stable security definer as $$
  select church_id from members
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function is_church_admin(p_church_id uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from churches
    where id = p_church_id and owner_id = auth.uid()
  ) or exists (
    select 1 from members
    where church_id = p_church_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- churches: perfil público visible para todos (R-03, R-16)
create policy "churches_public_read" on churches
  for select using (true);

create policy "churches_insert_own" on churches
  for insert with check (owner_id = auth.uid());

create policy "churches_update_admin" on churches
  for update using (is_church_admin(id));

-- members: privacidad del miembro (NF-03)
create policy "members_read_admin_or_self" on members
  for select using (
    is_church_admin(church_id) or user_id = auth.uid()
  );

create policy "members_self_register" on members
  for insert with check (
    user_id = auth.uid() or is_church_admin(church_id)
  );

create policy "members_update_admin" on members
  for update using (is_church_admin(church_id));

create policy "members_delete_admin" on members
  for delete using (is_church_admin(church_id));

-- services: miembros ven los cultos de su iglesia; admin gestiona
create policy "services_read_same_church" on services
  for select using (
    church_id = my_church_id() or is_church_admin(church_id)
  );

create policy "services_write_admin" on services
  for insert with check (is_church_admin(church_id));

create policy "services_update_admin" on services
  for update using (is_church_admin(church_id));

create policy "services_delete_admin" on services
  for delete using (is_church_admin(church_id));

-- attendance: admin ve todo; el miembro ve la suya
create policy "attendance_read" on attendance
  for select using (
    is_church_admin(church_id)
    or member_id in (select id from members where user_id = auth.uid())
  );

-- (los registros de asistencia se insertan vía RPC security definer)

-- events: públicos si is_public; si no, solo la iglesia
create policy "events_read" on events
  for select using (
    is_public
    or church_id = my_church_id()
    or is_church_admin(church_id)
  );

create policy "events_write_admin" on events
  for insert with check (is_church_admin(church_id));

create policy "events_update_admin" on events
  for update using (is_church_admin(church_id));

create policy "events_delete_admin" on events
  for delete using (is_church_admin(church_id));

-- notifications: solo admin de la iglesia
create policy "notifications_admin" on notifications
  for all using (is_church_admin(church_id));
