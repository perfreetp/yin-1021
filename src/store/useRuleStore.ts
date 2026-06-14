import { create } from 'zustand';
import type { AutoReplyRule, RuleMatchResult, RuleConditions } from '../types/rule';
import type { Conversation, StayStage } from '../types/conversation';
import { mockRules } from '../mock/rules';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { isNightTime } from '../utils/date';

interface RuleStoreState {
  rules: AutoReplyRule[];
  lastMatchResult: RuleMatchResult | null;
  setRules: (rules: AutoReplyRule[]) => void;
  addRule: (rule: Omit<AutoReplyRule, 'id' | 'createdAt' | 'updatedAt' | 'hitCount'>) => string;
  updateRule: (id: string, updates: Partial<AutoReplyRule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  incrementHitCount: (id: string) => void;
  getRuleById: (id: string) => AutoReplyRule | undefined;
  matchRule: (conversation: Conversation) => RuleMatchResult;
  setLastMatchResult: (result: RuleMatchResult | null) => void;
}

const STORAGE_KEY = 'auto_reply_rules';

function checkCondition(ruleConditions: RuleConditions, conversation: Conversation, night: boolean): { pass: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (ruleConditions.isNightTime !== null) {
    if (ruleConditions.isNightTime !== night) {
      return { pass: false, reasons: [`深夜条件不匹配：规则要求${ruleConditions.isNightTime ? '深夜' : '非深夜'}，当前${night ? '深夜' : '非深夜'}`] };
    }
    reasons.push(night ? '✓ 匹配深夜条件' : '✓ 匹配非深夜条件');
  }

  if (ruleConditions.channels.length > 0) {
    if (!ruleConditions.channels.includes(conversation.channel)) {
      return { pass: false, reasons: [`渠道不匹配：规则要求${ruleConditions.channels.join('/')}，当前${conversation.channel}`] };
    }
    reasons.push(`✓ 匹配渠道: ${conversation.channel}`);
  }

  if (ruleConditions.propertyIds.length > 0) {
    if (!ruleConditions.propertyIds.includes(conversation.propertyId)) {
      return { pass: false, reasons: [`房源不匹配：规则要求${ruleConditions.propertyIds.join('/')}，当前${conversation.propertyId}`] };
    }
    reasons.push(`✓ 匹配房源ID: ${conversation.propertyId}`);
  }

  if (ruleConditions.stayStages.length > 0) {
    if (!ruleConditions.stayStages.includes(conversation.stayStage)) {
      return { pass: false, reasons: [`入住阶段不匹配：规则要求${ruleConditions.stayStages.join('/')}，当前${conversation.stayStage}`] };
    }
    reasons.push(`✓ 匹配入住阶段: ${conversation.stayStage}`);
  }

  if (ruleConditions.hasUnreadMessages !== null) {
    const hasUnread = conversation.unreadCount > 0;
    if (ruleConditions.hasUnreadMessages !== hasUnread) {
      return { pass: false, reasons: [`未读消息条件不匹配：规则要求${ruleConditions.hasUnreadMessages ? '有未读' : '无未读'}`] };
    }
    reasons.push(hasUnread ? '✓ 有未读消息' : '✓ 无未读消息');
  }

  return { pass: true, reasons };
}

export const useRuleStore = create<RuleStoreState>((set, get) => ({
  rules: loadFromLocalStorage<AutoReplyRule[]>(STORAGE_KEY, mockRules),
  lastMatchResult: null,

  setRules: (rules) => {
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  addRule: (rule) => {
    const now = new Date();
    const newId = `rule_${Date.now()}`;
    const newRule: AutoReplyRule = {
      ...rule,
      id: newId,
      createdAt: now,
      updatedAt: now,
      hitCount: 0,
    };
    const rules = [...get().rules, newRule];
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
    return newId;
  },

  updateRule: (id, updates) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  deleteRule: (id) => {
    const rules = get().rules.filter(r => r.id !== id);
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  toggleRule: (id) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date() } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  incrementHitCount: (id) => {
    const rules = get().rules.map(r =>
      r.id === id ? { ...r, hitCount: r.hitCount + 1 } : r
    );
    set({ rules });
    saveToLocalStorage(STORAGE_KEY, rules);
  },

  getRuleById: (id) => get().rules.find(r => r.id === id),

  matchRule: (conversation) => {
    const rules = get().rules.filter(r => r.enabled);
    const night = isNightTime();

    const allChecks = rules.map(rule => {
      const check = checkCondition(rule.conditions, conversation, night);
      return { rule, check };
    });

    const matchedRules = allChecks
      .filter(item => item.check.pass)
      .sort((a, b) => b.rule.priority - a.rule.priority);

    const competingRules = matchedRules.slice(0, 3).map(item => ({
      ruleId: item.rule.id,
      ruleName: item.rule.name,
      priority: item.rule.priority,
      hitExplanation: item.rule.hitExplanation,
    }));

    if (matchedRules.length === 0) {
      const failedRules = allChecks
        .filter(item => !item.check.pass)
        .slice(0, 3);

      const reasons: string[] = [];
      failedRules.forEach(item => {
        reasons.push(`【${item.rule.name}】${item.check.reasons[0]}`);
      });

      const result: RuleMatchResult = {
        matched: false,
        reasons: reasons.length > 0 ? reasons : ['没有匹配的规则'],
        competingRules: [],
      };

      set({ lastMatchResult: result });
      return result;
    }

    const winner = matchedRules[0];
    get().incrementHitCount(winner.rule.id);

    const result: RuleMatchResult = {
      matched: true,
      ruleId: winner.rule.id,
      ruleName: winner.rule.name,
      templateId: winner.rule.action.templateId,
      priority: winner.rule.priority,
      hitExplanation: winner.rule.hitExplanation,
      reasons: winner.check.reasons,
      competingRules: competingRules.filter(r => r.ruleId !== winner.rule.id),
    };

    set({ lastMatchResult: result });
    return result;
  },

  setLastMatchResult: (result) => set({ lastMatchResult: result }),
}));
