/**
 * Date Helper Utilities
 * Date manipulation and formatting functions
 */

/**
 * Format date to Brazilian format (DD/MM/YYYY)
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

/**
 * Format datetime to Brazilian format (DD/MM/YYYY HH:mm)
 * @param date - Date to format
 * @returns Formatted datetime string
 */
export function formatDateTimeBR(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '-';
  }
}

/**
 * Get relative time (ex: "2 dias atrás", "daqui a 3 dias")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';

    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays > 0) return `Daqui a ${diffDays} dias`;
    return `${Math.abs(diffDays)} dias atrás`;
  } catch {
    return '-';
  }
}

/**
 * Check if date is overdue
 * @param date - Date to check
 * @returns True if overdue
 */
export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);

    return d < now;
  } catch {
    return false;
  }
}

/**
 * Check if date is due soon (within next 7 days)
 * @param date - Date to check
 * @returns True if due soon
 */
export function isDueSoon(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return d >= now && d <= sevenDaysFromNow;
  } catch {
    return false;
  }
}

/**
 * Check if date is today
 * @param date - Date to check
 * @returns True if today
 */
export function isToday(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;

    const now = new Date();

    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  } catch {
    return false;
  }
}

/**
 * Check if date is in current month
 * @param date - Date to check
 * @returns True if in current month
 */
export function isCurrentMonth(date: Date | string | null | undefined): boolean {
  if (!date) return false;

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return false;

    const now = new Date();

    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  } catch {
    return false;
  }
}

/**
 * Get start of month
 * @param date - Date reference
 * @returns Start of month date
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month
 * @param date - Date reference
 * @returns End of month date
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

/**
 * Add days to date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to date
 * @param date - Base date
 * @param months - Number of months to add
 * @returns New date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Parse Brazilian date string (DD/MM/YYYY) to Date object
 * @param dateStr - Date string in Brazilian format
 * @returns Date object
 */
export function parseBRDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) return null;

  return date;
}

/**
 * Get month name in Portuguese
 * @param monthIndex - Month index (0-11)
 * @returns Month name
 */
export function getMonthNamePT(monthIndex: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  return months[monthIndex] || '';
}

/**
 * Get short month name in Portuguese
 * @param monthIndex - Month index (0-11)
 * @returns Short month name
 */
export function getShortMonthNamePT(monthIndex: number): string {
  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];

  return months[monthIndex] || '';
}
