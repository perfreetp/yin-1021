import { create } from 'zustand';
import type { CleaningTask, Cleaner } from '../types/cleaning';
import { mockCleaningTasks, mockCleaners } from '../mock/cleaning';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

interface CleaningState {
  tasks: CleaningTask[];
  cleaners: Cleaner[];
  selectedTaskId: string | null;
  setTasks: (tasks: CleaningTask[]) => void;
  setCleaners: (cleaners: Cleaner[]) => void;
  setSelectedTaskId: (id: string | null) => void;
  addTask: (task: Omit<CleaningTask, 'id'>) => void;
  updateTask: (id: string, updates: Partial<CleaningTask>) => void;
  updateTaskStatus: (id: string, status: CleaningTask['status']) => void;
  assignCleaner: (taskId: string, cleanerId: string) => void;
  addCleaner: (cleaner: Omit<Cleaner, 'id' | 'taskCount' | 'rating'>) => void;
  toggleCleanerStatus: (id: string) => void;
  getTasksByStatus: (status: CleaningTask['status']) => CleaningTask[];
  getTasksByProperty: (propertyId: string) => CleaningTask[];
  getTasksByCleaner: (cleanerId: string) => CleaningTask[];
}

const TASKS_KEY = 'cleaning_tasks_data';
const CLEANERS_KEY = 'cleaners_data';

export const useCleaningStore = create<CleaningState>((set, get) => ({
  tasks: loadFromLocalStorage<CleaningTask[]>(TASKS_KEY, mockCleaningTasks),
  cleaners: loadFromLocalStorage<Cleaner[]>(CLEANERS_KEY, mockCleaners),
  selectedTaskId: null,
  
  setTasks: (tasks) => {
    set({ tasks });
    saveToLocalStorage(TASKS_KEY, tasks);
  },
  
  setCleaners: (cleaners) => {
    set({ cleaners });
    saveToLocalStorage(CLEANERS_KEY, cleaners);
  },
  
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  
  addTask: (task) => {
    const newTask: CleaningTask = {
      ...task,
      id: `ct${Date.now()}`,
    };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    saveToLocalStorage(TASKS_KEY, tasks);
  },
  
  updateTask: (id, updates) => {
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ tasks });
    saveToLocalStorage(TASKS_KEY, tasks);
  },
  
  updateTaskStatus: (id, status) => {
    const now = new Date();
    const tasks = get().tasks.map(t => {
      if (t.id !== id) return t;
      const updates: Partial<CleaningTask> = { status };
      if (status === 'in_progress') updates.startedAt = now;
      if (status === 'completed') updates.completedAt = now;
      return { ...t, ...updates };
    });
    set({ tasks });
    saveToLocalStorage(TASKS_KEY, tasks);
  },
  
  assignCleaner: (taskId, cleanerId) => {
    const tasks = get().tasks.map(t =>
      t.id === taskId ? { ...t, cleanerId, status: 'assigned' as const } : t
    );
    set({ tasks });
    saveToLocalStorage(TASKS_KEY, tasks);
  },
  
  addCleaner: (cleaner) => {
    const newCleaner: Cleaner = {
      ...cleaner,
      id: `cl${Date.now()}`,
      taskCount: 0,
      rating: 5.0,
    };
    const cleaners = [...get().cleaners, newCleaner];
    set({ cleaners });
    saveToLocalStorage(CLEANERS_KEY, cleaners);
  },
  
  toggleCleanerStatus: (id) => {
    const cleaners = get().cleaners.map(c =>
      c.id === id ? { ...c, active: !c.active } : c
    );
    set({ cleaners });
    saveToLocalStorage(CLEANERS_KEY, cleaners);
  },
  
  getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),
  
  getTasksByProperty: (propertyId) => get().tasks.filter(t => t.propertyId === propertyId),
  
  getTasksByCleaner: (cleanerId) => get().tasks.filter(t => t.cleanerId === cleanerId),
}));
