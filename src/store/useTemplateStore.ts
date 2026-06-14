import { create } from 'zustand';
import type { MessageTemplate, TemplateCategory } from '../types/template';
import { mockTemplates } from '../mock/templates';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';
import { extractVariables } from '../utils/template';

interface TemplateState {
  templates: MessageTemplate[];
  selectedTemplateId: string | null;
  categoryFilter: TemplateCategory;
  setTemplates: (templates: MessageTemplate[]) => void;
  setSelectedTemplateId: (id: string | null) => void;
  setCategoryFilter: (category: TemplateCategory) => void;
  addTemplate: (template: Omit<MessageTemplate, 'id' | 'variables' | 'usageCount' | 'rewriteCount' | 'createdAt' | 'updatedAt' | 'versions'>) => void;
  updateTemplate: (id: string, updates: Partial<MessageTemplate>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  incrementRewrite: (id: string) => void;
  getTemplateById: (id: string) => MessageTemplate | undefined;
  getTemplatesByCategory: (category: TemplateCategory) => MessageTemplate[];
}

const STORAGE_KEY = 'templates_data';

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: loadFromLocalStorage<MessageTemplate[]>(STORAGE_KEY, mockTemplates),
  selectedTemplateId: null,
  categoryFilter: 'all',
  
  setTemplates: (templates) => {
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  setSelectedTemplateId: (id) => set({ selectedTemplateId: id }),
  
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  
  addTemplate: (template) => {
    const now = new Date();
    const newTemplate: MessageTemplate = {
      ...template,
      id: `t${Date.now()}`,
      variables: extractVariables(template.content),
      usageCount: 0,
      rewriteCount: 0,
      createdAt: now,
      updatedAt: now,
      versions: [],
    };
    const templates = [...get().templates, newTemplate];
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  updateTemplate: (id, updates) => {
    const templates = get().templates.map(t => {
      if (t.id !== id) return t;
      const newContent = updates.content || t.content;
      return {
        ...t,
        ...updates,
        variables: updates.content ? extractVariables(updates.content) : t.variables,
        updatedAt: new Date(),
        versions: updates.content ? [
          ...t.versions,
          {
            id: `v${Date.now()}`,
            content: t.content,
            createdAt: t.updatedAt,
            createdBy: '房东',
          },
        ] : t.versions,
      };
    });
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  deleteTemplate: (id) => {
    const templates = get().templates.filter(t => t.id !== id);
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  incrementUsage: (id) => {
    const templates = get().templates.map(t =>
      t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t
    );
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  incrementRewrite: (id) => {
    const templates = get().templates.map(t =>
      t.id === id ? { ...t, rewriteCount: t.rewriteCount + 1 } : t
    );
    set({ templates });
    saveToLocalStorage(STORAGE_KEY, templates);
  },
  
  getTemplateById: (id) => get().templates.find(t => t.id === id),
  
  getTemplatesByCategory: (category) => get().templates.filter(t => t.category === category),
}));
