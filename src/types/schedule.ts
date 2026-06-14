import type { Guest, SpecialNeed } from './conversation';

export type EventType = 
  | 'booking_created' 
  | 'pre_checkin' 
  | 'checkin_day' 
  | 'mid_stay' 
  | 'pre_checkout' 
  | 'checkout_day' 
  | 'checkout_completed';

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type ScheduleLogStatus = 'pending' | 'sent' | 'skipped' | 'failed';

export interface TriggerRule {
  id: string;
  name: string;
  eventType: EventType;
  templateId: string;
  offsetHours: number;
  enabled: boolean;
  propertyIds: string[];
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: BookingStatus;
  specialNeeds: SpecialNeed[];
  guest: Guest;
}

export interface ScheduleLog {
  id: string;
  bookingId: string;
  templateId: string;
  triggerType: string;
  scheduledAt: Date;
  actualSentAt?: Date;
  status: ScheduleLogStatus;
  skipReason?: string;
}
