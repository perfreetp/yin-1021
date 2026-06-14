export interface TemplateVersion {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: string;
}

export type TemplateCategory = 
  | 'all'
  | 'inquiry' 
  | 'booking_confirm' 
  | 'pre_checkin' 
  | 'checkin_day' 
  | 'during_stay' 
  | 'pre_checkout' 
  | 'checkout_day' 
  | 'cleaning';

export interface MessageTemplate {
  id: string;
  category: TemplateCategory;
  name: string;
  content: string;
  variables: string[];
  usageCount: number;
  rewriteCount: number;
  createdAt: Date;
  updatedAt: Date;
  versions: TemplateVersion[];
}
