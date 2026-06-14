import type { StayStage } from './conversation';

export interface AutoReplyRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  conditions: RuleConditions;
  action: RuleAction;
  hitExplanation: string;
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
