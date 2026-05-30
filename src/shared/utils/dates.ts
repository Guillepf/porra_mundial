import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatea la fecha y hora completa en español
export function formatFullDate(date: Date | any): string {
  if (!date) return '';
  const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  return format(d, "EEEE d 'de' MMMM, HH:mm 'hs'", { locale: es });
}

// Formatea la fecha de forma compacta (ej. "30 de May")
export function formatShortDate(date: Date | any): string {
  if (!date) return '';
  const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  return format(d, "d 'de' MMM", { locale: es });
}

// Obtiene solo la hora formateada
export function formatTime(date: Date | any): string {
  if (!date) return '';
  const d = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
  return format(d, 'HH:mm', { locale: es });
}
