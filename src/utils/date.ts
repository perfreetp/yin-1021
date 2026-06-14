import { format, addDays, differenceInDays, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDate(date: Date | string, pattern: string = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: zhCN });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return `今天 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  if (isTomorrow(d)) {
    return `明天 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  if (isYesterday(d)) {
    return `昨天 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  
  const diffDays = differenceInDays(d, new Date());
  if (diffDays > 0 && diffDays < 7) {
    return `${diffDays}天后 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  if (diffDays < 0 && diffDays > -7) {
    return `${Math.abs(diffDays)}天前 ${format(d, 'HH:mm', { locale: zhCN })}`;
  }
  
  return formatDateTime(d);
}

export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 8;
}

export function getNextWorkTime(date: Date = new Date()): Date {
  const nextWorkTime = new Date(date);
  
  if (nextWorkTime.getHours() >= 22) {
    nextWorkTime.setDate(nextWorkTime.getDate() + 1);
  }
  nextWorkTime.setHours(8, 30, 0, 0);
  
  return nextWorkTime;
}

export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return isSameDay(d1, d2);
}

export function isWithinDays(date: Date | string, days: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = differenceInDays(now, d);
  return diff >= 0 && diff < days;
}
