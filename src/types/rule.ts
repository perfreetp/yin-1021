import type { StayStage } from './conversation';

export type ObservationMetric = 'deliveryRate' | 'readRate' | 'followUpRate' | 'responseTime';

export interface ObservationTarget {
  metrics: ObservationMetric[];
  comparisonRuleIds: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface RulePerformance {
  ruleId: string;
  periodStart: Date;
  periodEnd: Date;
  hitCount: number;
  deliveryCount: number;
  readCount: number;
  followUpCount: number;
  totalResponseTime: number;
  avgResponseTime: number;
}

export type RuleHitEventType = 
  | 'matched' 
  | 'skipped_priority' 
  | 'skipped_dedup' 
  | 'skipped_manual' 
  | 'no_match' 
  | 'restored_auto'
  | 'manual_takeover'
  | 'manual_message'
  | 'guest_message';

export interface RuleHitEvent {
  id: string;
  conversationId: string;
  guestId: string;
  eventType: RuleHitEventType;
  ruleId?: string;
  ruleName?: string;
  priority?: number;
  hitExplanation?: string;
  reasons: string[];
  competingRules?: {
    ruleId: string;
    ruleName: string;
    priority: number;
    hitExplanation: string;
  }[];
  dedupKey?: string;
  channel?: string;
  propertyId?: string;
  propertyName?: string;
  stayStage?: string;
  messageContent?: string;
  messageId?: string;
  timestamp: Date;
}

export interface AutoReplyRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  conditions: RuleConditions;
  action: RuleAction;
  hitExplanation: string;
  observationTarget?: ObservationTarget;
  performance?: RulePerformance[];
  createdAt: Date;
  updatedAt: Date;
  hitCount: number;
}

export interface RuleConditions {
  channels: string[];
  propertyIds: string[];
  stayStages: StayStage[];
  isNightTime: boolean | null;
  hasUnreadMessages: boolean | null;
}

export interface RuleAction {
  type: 'send_template';
  templateId: string;
  templateName?: string;
}

export interface RuleMatchResult {
  matched: boolean;
  ruleId?: string;
  ruleName?: string;
  templateId?: string;
  priority?: number;
  hitExplanation?: string;
  reasons: string[];
  competingRules: {
    ruleId: string;
    ruleName: string;
    priority: number;
    hitExplanation: string;
  }[];
}
