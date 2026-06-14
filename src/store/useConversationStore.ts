import { create } from 'zustand';
import type { Conversation, Message, SpecialNeed, SpecialNeedType } from '../types/conversation';
import { mockConversations } from '../mock/conversations';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { renderTemplate } from '../utils/template';
import { useTemplateStore } from './useTemplateStore';

interface ConversationState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  setConversations: (conversations: Conversation[]) => void;
  setSelectedConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string, isRewritten?: boolean) => void;
  sendAutoReply: (conversationId: string, templateId: string, data: Record<string, any>) => void;
  receiveMessage: (conversationId: string, content: string) => void;
  toggleManualOverride: (conversationId: string) => void;
  addSpecialNeed: (conversationId: string, type: SpecialNeedType, description: string) => void;
  removeSpecialNeed: (conversationId: string, type: SpecialNeedType) => void;
  markAsRead: (conversationId: string) => void;
  getConversationById: (id: string) => Conversation | undefined;
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
  
  sendMessage: (conversationId, content, isRewritten = false) => {
    const now = new Date();
    const newMessage: Message = {
      id: `m${Date.now()}`,
      conversationId,
      senderType: 'manual',
      content,
      status: 'sent',
      sentAt: now,
      isRewritten,
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
  
  getUnreadCount: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}));
