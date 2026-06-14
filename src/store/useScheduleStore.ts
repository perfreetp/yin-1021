import { create } from 'zustand';
import type { Booking, TriggerRule, ScheduleLog } from '../types/schedule';
import { mockBookings, mockTriggerRules, mockScheduleLogs } from '../mock/schedule';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

interface ScheduleState {
  bookings: Booking[];
  triggerRules: TriggerRule[];
  scheduleLogs: ScheduleLog[];
  selectedBookingId: string | null;
  selectedDate: Date | null;
  setBookings: (bookings: Booking[]) => void;
  setTriggerRules: (rules: TriggerRule[]) => void;
  setScheduleLogs: (logs: ScheduleLog[]) => void;
  setSelectedBookingId: (id: string | null) => void;
  setSelectedDate: (date: Date | null) => void;
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  updateTriggerRule: (id: string, updates: Partial<TriggerRule>) => void;
  toggleTriggerRule: (id: string) => void;
  addScheduleLog: (log: Omit<ScheduleLog, 'id'>) => void;
  getBookingsByProperty: (propertyId: string) => Booking[];
  getBookingsByDate: (date: Date) => Booking[];
  getUpcomingBookings: (days?: number) => Booking[];
  getBookingById: (id: string) => Booking | undefined;
}

const BOOKINGS_KEY = 'bookings_data';
const RULES_KEY = 'trigger_rules_data';
const LOGS_KEY = 'schedule_logs_data';

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  bookings: loadFromLocalStorage<Booking[]>(BOOKINGS_KEY, mockBookings),
  triggerRules: loadFromLocalStorage<TriggerRule[]>(RULES_KEY, mockTriggerRules),
  scheduleLogs: loadFromLocalStorage<ScheduleLog[]>(LOGS_KEY, mockScheduleLogs),
  selectedBookingId: null,
  selectedDate: null,
  
  setBookings: (bookings) => {
    set({ bookings });
    saveToLocalStorage(BOOKINGS_KEY, bookings);
  },
  
  setTriggerRules: (rules) => {
    set({ triggerRules: rules });
    saveToLocalStorage(RULES_KEY, rules);
  },
  
  setScheduleLogs: (logs) => {
    set({ scheduleLogs: logs });
    saveToLocalStorage(LOGS_KEY, logs);
  },
  
  setSelectedBookingId: (id) => set({ selectedBookingId: id }),
  
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  addBooking: (booking) => {
    const newBooking: Booking = {
      ...booking,
      id: `b${Date.now()}`,
    };
    const bookings = [...get().bookings, newBooking];
    set({ bookings });
    saveToLocalStorage(BOOKINGS_KEY, bookings);
  },
  
  updateBooking: (id, updates) => {
    const bookings = get().bookings.map(b =>
      b.id === id ? { ...b, ...updates } : b
    );
    set({ bookings });
    saveToLocalStorage(BOOKINGS_KEY, bookings);
  },
  
  updateTriggerRule: (id, updates) => {
    const triggerRules = get().triggerRules.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ triggerRules });
    saveToLocalStorage(RULES_KEY, triggerRules);
  },
  
  toggleTriggerRule: (id) => {
    const triggerRules = get().triggerRules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    set({ triggerRules });
    saveToLocalStorage(RULES_KEY, triggerRules);
  },
  
  addScheduleLog: (log) => {
    const newLog: ScheduleLog = {
      ...log,
      id: `sl${Date.now()}`,
    };
    const scheduleLogs = [...get().scheduleLogs, newLog];
    set({ scheduleLogs });
    saveToLocalStorage(LOGS_KEY, scheduleLogs);
  },
  
  getBookingsByProperty: (propertyId) => get().bookings.filter(b => b.propertyId === propertyId),
  
  getBookingsByDate: (date) => {
    const dateStr = date.toDateString();
    return get().bookings.filter(b =>
      b.checkInDate.toDateString() === dateStr || b.checkOutDate.toDateString() === dateStr
    );
  },
  
  getUpcomingBookings: (days = 7) => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return get().bookings.filter(b =>
      b.checkInDate >= now && b.checkInDate <= cutoff && b.status === 'confirmed'
    ).sort((a, b) => a.checkInDate.getTime() - b.checkInDate.getTime());
  },

  getBookingById: (id) => get().bookings.find(b => b.id === id),
}));
