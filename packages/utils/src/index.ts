// Funciones compartidas de ChBook (web + mobile)

/** Genera un código de iglesia con el formato CHBK-XXXX. */
export function generateChurchCode(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `CHBK-${digits}`;
}

/** Genera un código corto para asistencia online (p. ej. K7F2QX). */
export function generateOnlineCode(length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres ambiguos
  let code = '';
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** Convierte un nombre en slug para el perfil público. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Clasificación por edad: niño 0-12, adolescente 13-17, adulto 18-59, mayor 60+. */
export function ageGroupFromBirthDate(
  birthDate: string | Date
): 'child' | 'teen' | 'adult' | 'senior' {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  if (age <= 12) return 'child';
  if (age <= 17) return 'teen';
  if (age <= 59) return 'adult';
  return 'senior';
}

/** Punto WKT para columnas geography de PostGIS. */
export function toWktPoint(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}
