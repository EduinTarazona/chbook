// Tipos compartidos de ChBook (web + mobile)

export type Plan = 'semilla' | 'crecimiento' | 'iglesia_mayor';

export type MemberStatus = 'prospect' | 'active' | 'inactive' | 'archived';

export type MemberRole = 'member' | 'leader' | 'deacon' | 'musician' | 'admin';

export type AgeGroup = 'child' | 'teen' | 'adult' | 'senior';

export type ServiceStatus = 'scheduled' | 'active' | 'ended';

export type AttendanceType = 'presential' | 'online';

export interface Church {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  address: string | null;
  city: string | null;
  denomination: string | null;
  capacity: number | null;
  pastor_name: string | null;
  founded_year: number | null;
  plan: Plan;
  country: string | null;
  theme_color: string;
  photo_url: string | null;
  owner_id: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  church_id: string;
  user_id: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  age_group: AgeGroup | null;
  role: MemberRole;
  status: MemberStatus;
  created_at: string;
}

export interface Service {
  id: string;
  church_id: string;
  name: string;
  starts_at: string | null;
  ended_at: string | null;
  status: ServiceStatus;
  online_code: string | null;
  gps_radius: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  church_id: string;
  service_id: string;
  type: AttendanceType;
  checked_at: string;
}

export interface ChurchEvent {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  event_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_public: boolean;
  created_at: string;
}

export interface ChurchMetrics {
  church_id: string;
  name: string;
  slug: string;
  code: string | null;
  capacity: number | null;
  plan: Plan;
  total_members: number;
  active_members: number;
  prospect_members: number;
  inactive_members: number;
  active_pct: number;
  avg_attendance: number;
  occupancy_pct: number;
}
