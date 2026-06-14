export type CleaningTaskStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Cleaner {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  active: boolean;
  taskCount: number;
  rating: number;
}

export interface CleaningTask {
  id: string;
  propertyId: string;
  bookingId: string;
  cleanerId?: string;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: CleaningTaskStatus;
  specialRequirements: string[];
  photos: string[];
  notes?: string;
}
