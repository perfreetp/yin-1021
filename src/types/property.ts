export interface Channel {
  id: string;
  platform: 'airbnb' | 'ctrip' | 'meituan' | 'xiaohongshu';
  enabled: boolean;
  nightModeEnabled: boolean;
}

export interface DoorLock {
  type: 'smart' | 'keybox' | 'manual';
  password: string;
  instructions: string;
}

export interface TransportInfo {
  nearestSubway: string;
  airportTransfer: string;
  parkingInfo: string;
}

export interface HolidayRule {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  templateId?: string;
  priority: number;
  cleaningTimeAdjustment: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  coverImage: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  wifiPassword: string;
  status: 'active' | 'inactive';
  channels: Channel[];
  doorLock: DoorLock;
  transportInfo: TransportInfo;
  holidayRules: HolidayRule[];
}
