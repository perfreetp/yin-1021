export interface TemplateStats {
  templateId: string;
  templateName: string;
  category: string;
  usageCount: number;
  rewriteCount: number;
  rewriteRate: number;
}

export interface MessageStats {
  totalSent: number;
  delivered: number;
  read: number;
  failed: number;
  autoReplied: number;
  manualReplied: number;
}

export interface PropertyConversationHistory {
  propertyId: string;
  propertyName: string;
  date: Date;
  conversationCount: number;
  messageCount: number;
  autoReplyRate: number;
}

export interface DailyMessageTrend {
  date: string;
  count: number;
  auto: number;
  manual: number;
}

export interface ResponseEfficiency {
  date: string;
  avgResponseTime: number;
}
