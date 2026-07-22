# ChBook

**Church Management Platform** — Organizando la iglesia. Un perfil a la vez.

Plataforma SaaS multi-tenant de gestión para iglesias. El LinkedIn operativo de las iglesias: una red donde los "seguidores" son miembros reales con métricas verificables.

## Estructura del monorepo

```
chbook/
├── apps/
│   └── web/          ← React + Vite + TS (dashboard admin)
├── packages/
│   ├── types/        ← tipos TypeScript compartidos
│   └── utils/        ← funciones compartidas
├── supabase/
│   └── migrations/   ← esquema de base de datos (PostgreSQL + PostGIS)
└── package.json      ← workspace root
```

Pendientes según el plan: `apps/mobile` (Expo React Native) y `apps/landing` (Next.js).

## Setup

```bash
npm install
cp apps/web/.env.example apps/web/.env.local   # completar credenciales de Supabase
npm run dev --workspace @chbook/web
```

### Base de datos

Aplicar `supabase/migrations/0001_initial_schema.sql` en el proyecto de Supabase (SQL Editor o `supabase db push`). Incluye:

- Tablas: `churches`, `members`, `services`, `attendance`, `events`, `notifications`
- RLS habilitado en todas las tablas (aislamiento multi-tenant)
- `check_attendance_radius()` — validación de radio GPS con PostGIS
- `gps_check_in()` / `online_check_in()` — RPCs de asistencia
- `mark_inactive_members()` — inactividad por rango de días (R-13)
- Vista `church_metrics` — métricas del dashboard y perfil público
- Trigger de clasificación automática por edad (R-07)

## MVP implementado (apps/web)

1. `src/lib/supabase.ts` — cliente de Supabase
2. Login — email/contraseña y Google OAuth
3. Registro de iglesia — formulario + GPS + código CHBK-XXXX + QR
4. Dashboard del pastor — métricas desde `church_metrics`
5. Gestión de miembros — estados PROSPECTO → ACTIVO → INACTIVO → ARCHIVADO, aprobación/rechazo, roles y clasificación por edad
6. Cultos — iniciar/finalizar servicio, código online, radio GPS y conteo de asistencia

## Paleta oficial

| Color | Hex | Uso |
|---|---|---|
| Sage oscuro | `#4A6E4A` | CTAs, sidebar, headers |
| Sage claro | `#8FAF8A` | Fondo hero, acentos |
| Marrón | `#6B5344` | Menús, transparencias |
| Crema | `#EDE8DC` | Cards, fondos suaves |
| Carbón | `#2E2E2E` | Tipografía, íconos |
| Blanco | `#FFFFFF` | Fondo base |

Tipografías: DM Serif Display (títulos), DM Sans (UI), DM Mono (códigos).
