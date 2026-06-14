export interface Guest {
  id: string;
  name: string;
  phone: string;
  platform: string;
  avatar?: string;
}

export type SpecialNeedType = 
  | 'baby_crib' 
  | 'extra_bed' 
  | 'late_checkout' 
  | 'early_checkin' 
  | 'no_smoking' 
  | 'pet_friendly' 
  | 'custom';

export interface SpecialNeed {
  type: SpecialNeedType;
  description: string;
  markedAt: Date;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type SenderType = 'guest' | 'auto' | 'manual';

export interface Message {
  id: string;
  conversationId: string;
  senderType: SenderType;
  content: string;
  templateId?: string;
  status: MessageStatus;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failedAt?: Date;
  isRewritten?: boolean;
}

export type StayStage = 'inquiry' | 'pre_checkin' | 'during_stay' | 'post_checkout';

export interface Conversation {
  id: string;
  guestId: string;
  propertyId: string;
  bookingId?: string;
  channel: string;
  manualOverride: boolean;
  lastMessageAt: Date;
  unreadCount: number;
  stayStage: StayStage;
  guest: Guest;
  messages: Message[];
  specialNeeds: SpecialNeed[];
}
