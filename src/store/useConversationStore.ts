import { create } from 'zustand';
import type { Conversation, Message, SpecialNeed, SpecialNeedType, StayStage } from '../types/conversation';
import { mockConversations } from '../mock/conversations';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { renderTemplate } from '../utils/template';
import { useTemplateStore } from './useTemplateStore';
import { usePropertyStore } from './usePropertyStore';
import { isNightTime } from '../utils/date';
import { shouldSendMessage, recordSentMessage } from '../utils/deduplication';

interface ConversationState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, isRewritten?: boolean, templateId?: string) => void;
  sendAutoReply: (conversationId: string, templateId: string, data: Record<string, any>) => void;
  smartAutoReply: (conversationId: string) => { success: boolean; reason?: string };
  receiveMessage: (conversationId: string, content: string) => void;
  simulateNewInquiry: (channel: string, propertyId: string, guestName: string, content: string, stayStage: StayStage) => string;
  toggleManualOverride: (conversationId: string) => void;
  addSpecialNeed: (conversationId: string, type: SpecialNeedType, description: string) => void;
  removeSpecialNeed: (conversationId: string, type: SpecialNeedType) => void;
  markAsRead: (conversationId: string) => void;
  getConversationById: (id: string) => Conversation | undefined;
  getConversationsByProperty: (propertyId: string) => Conversation[];
  getConversationsByStayStage: (stayStage: StayStage) => Conversation[];
  getUnreadCount: () => number;
}

const STORAGE_KEY = 'conversations_data';

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: loadFromLocalStorage<Conversation[]>(STORAGE_KEY, mockConversations),
  selectedConversationId: null,
  
  setConversations: (conversations) => {
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  
  sendMessage: (conversationId, content, isRewritten = false, templateId?) => {
    const now = new Date();
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      senderType: 'manual',
      content,
      status: 'sent',
      sentAt: now,
      isRewritten,
      templateId,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
        manualOverride: true,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
    
    if (templateId && isRewritten) {
      useTemplateStore.getState().incrementRewrite(templateId);
    }
  },
  
  sendAutoReply: (conversationId, templateId, data) => {
    const template = useTemplateStore.getState().getTemplateById(templateId);
    if (!template) return;
    
    const content = renderTemplate(template.content, data);
    const now = new Date();
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      senderType: 'auto',
      content,
      templateId,
      status: 'sent',
      sentAt: now,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
    useTemplateStore.getState().incrementUsage(templateId);
  },

  smartAutoReply: (conversationId) => {
    const conversation = get().getConversationById(conversationId);
    if (!conversation) return { success: false, reason: '会话不存在' };

    if (conversation.manualOverride) {
      return { success: false, reason: '人工接管中，已暂停自动回复' };
    }

    const dedupKey = `${conversation.id}-${conversation.stayStage}`;
    if (!shouldSendMessage(conversation.guestId, dedupKey)) {
      return { success: false, reason: '24小时内已发送过该类型消息，避免重复打扰' };
    }

    const templates = useTemplateStore.getState().templates;
    const property = usePropertyStore.getState().getPropertyById(conversation.propertyId);
    const isNight = isNightTime();

    let targetTemplate = null;
    let category = conversation.stayStage as string;

    if (isNight) {
      targetTemplate = templates.find(t => t.category === 'inquiry' && t.name.includes('深夜'));
      category = 'night_inquiry';
    } else {
      const categoryMap: Record<string, string> = {
        'inquiry': 'inquiry',
        'pre_checkin': 'pre_checkin',
        'during_stay': 'during_stay',
        'post_checkout': 'checkout_day',
      };
      const templateCategory = categoryMap[conversation.stayStage] || 'inquiry';
      targetTemplate = templates.find(t => t.category === templateCategory);
    }

    if (!targetTemplate) {
      return { success: false, reason: '未找到合适的模板' };
    }

    const data: Record<string, any> = {
      客人姓名: conversation.guest.name,
      房源名称: property?.name || '',
      地址: property?.address || '',
      入住日期: '2024-06-20',
      退房日期: '2024-06-25',
      门锁密码: property?.doorLock.password || '',
      门锁设置说明: property?.doorLock.instructions || '',
      最近地铁站: property?.transportInfo.nearestSubway || '',
      wifi密码: property?.wifiPassword || '',
    };

    get().sendAutoReply(conversationId, targetTemplate.id, data);
    recordSentMessage(conversation.guestId, dedupKey);

    return { success: true };
  },
  
  receiveMessage: (conversationId, content) => {
    const now = new Date();
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      senderType: 'guest',
      content,
      status: 'read',
      sentAt: now,
      readAt: now,
    };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessageAt: now,
        unreadCount: c.unreadCount + 1,
      };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  toggleManualOverride: (conversationId) => {
    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, manualOverride: !c.manualOverride } : c
    );
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  addSpecialNeed: (conversationId, type, description) => {
    const now = new Date();
    const specialNeed: SpecialNeed = { type, description, markedAt: now };
    
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      const existingIndex = c.specialNeeds.findIndex(s => s.type === type);
      let specialNeeds = existingIndex >= 0
        ? c.specialNeeds.map((s, i) => i === existingIndex ? specialNeed : s)
        : [...c.specialNeeds, specialNeed];
      return { ...c, specialNeeds };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  removeSpecialNeed: (conversationId, type) => {
    const conversations = get().conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, specialNeeds: c.specialNeeds.filter(s => s.type !== type) };
    });
    
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  markAsRead: (conversationId) => {
    const conversations = get().conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);
  },
  
  getConversationById: (id) => get().conversations.find(c => c.id === id),

  getConversationsByProperty: (propertyId) => get().conversations.filter(c => c.propertyId === propertyId),

  getConversationsByStayStage: (stayStage) => get().conversations.filter(c => c.stayStage === stayStage),

  simulateNewInquiry: (channel, propertyId, guestName, content, stayStage) => {
    const now = new Date();
    const newId = `conv${Date.now()}`;
    const guestId = `g${Date.now()}`;

    const guestMessage: Message = {
      id: `m${Date.now()}`,
      conversationId: newId,
      senderType: 'guest',
      content,
      status: 'unread',
      sentAt: now,
    };

    const newConversation: Conversation = {
      id: newId,
      guestId,
      propertyId,
      channel,
      manualOverride: false,
      lastMessageAt: now,
      unreadCount: 1,
      stayStage,
      guest: {
        id: guestId,
        name: guestName,
        phone: '',
        platform: channel,
      },
      messages: [guestMessage],
      specialNeeds: [],
    };

    const conversations = [newConversation, ...get().conversations];
    set({ conversations });
    saveToLocalStorage(STORAGE_KEY, conversations);

    setTimeout(() => {
      const result = get().smartAutoReply(newId);
      console.log('智能回复结果:', result);
    }, 500);

    return newId;
  },

  getUnreadCount: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}));
