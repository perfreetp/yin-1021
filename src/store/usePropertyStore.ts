import { create } from 'zustand';
import type { Property } from '../types/property';
import { mockProperties } from '../mock/properties';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage';

interface PropertyState {
  properties: Property[];
  selectedPropertyId: string | null;
  setProperties: (properties: Property[]) => void;
  setSelectedPropertyId: (id: string | null) => void;
  addProperty: (property: Omit<Property, 'id'>) => void;
  updateProperty: (id: string, updates: Partial<Property>) => void;
  togglePropertyStatus: (id: string) => void;
  getPropertyById: (id: string) => Property | undefined;
}

const STORAGE_KEY = 'properties_data';

function ensurePropertyTypes(properties: any[]): Property[] {
  return properties.map(p => ({
    ...p,
    status: p.status as 'active' | 'inactive',
  }));
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: ensurePropertyTypes(loadFromLocalStorage<Property[]>(STORAGE_KEY, mockProperties)),
  selectedPropertyId: null,
  
  setProperties: (properties) => {
    set({ properties });
    saveToLocalStorage(STORAGE_KEY, properties);
  },
  
  setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
  
  addProperty: (property) => {
    const newProperty: Property = {
      ...property,
      id: `p${Date.now()}`,
    };
    const properties = [...get().properties, newProperty];
    set({ properties });
    saveToLocalStorage(STORAGE_KEY, properties);
  },
  
  updateProperty: (id, updates) => {
    const properties = get().properties.map(p => 
      p.id === id ? { ...p, ...updates } : p
    );
    set({ properties });
    saveToLocalStorage(STORAGE_KEY, properties);
  },
  
  togglePropertyStatus: (id) => {
    const properties = get().properties.map(p => 
      p.id === id ? { ...p, status: (p.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' } : p
    );
    set({ properties });
    saveToLocalStorage(STORAGE_KEY, properties);
  },
  
  getPropertyById: (id) => get().properties.find(p => p.id === id),
}));
