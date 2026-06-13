import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  techEntries as systemTechEntries,
  type TechEntry,
} from '@/data/materials';
import {
  equipmentClassification as systemEquipmentItems,
  type EquipmentItem,
} from '@/data/equipmentClassification';

export type KbTechEntry = TechEntry & { isSystem: boolean };
export type KbEquipmentItem = EquipmentItem & { id: string; isSystem: boolean };

interface KnowledgeBaseState {
  userTechEntries: KbTechEntry[];
  userEquipmentItems: KbEquipmentItem[];

  addTechEntry: (entry: TechEntry) => void;
  updateTechEntry: (id: string, patch: Partial<TechEntry>) => void;
  removeTechEntry: (id: string) => void;

  addEquipmentItem: (item: EquipmentItem & { id?: string }) => void;
  updateEquipmentItem: (id: string, patch: Partial<EquipmentItem>) => void;
  removeEquipmentItem: (id: string) => void;
}

export const useKnowledgeBaseStore = create<KnowledgeBaseState>()(
  persist(
    (set) => ({
      userTechEntries: [],
      userEquipmentItems: [],

      addTechEntry: (entry) =>
        set((s) => ({
          userTechEntries: [...s.userTechEntries, { ...entry, isSystem: false }],
        })),
      updateTechEntry: (id, patch) =>
        set((s) => ({
          userTechEntries: s.userTechEntries.map((t) =>
            t.id === id ? { ...t, ...patch } : t
          ),
        })),
      removeTechEntry: (id) =>
        set((s) => ({
          userTechEntries: s.userTechEntries.filter((t) => t.id !== id),
        })),

      addEquipmentItem: (item) =>
        set((s) => ({
          userEquipmentItems: [
            ...s.userEquipmentItems,
            { ...item, id: item.id ?? `user-eq-${Date.now()}`, isSystem: false },
          ],
        })),
      updateEquipmentItem: (id, patch) =>
        set((s) => ({
          userEquipmentItems: s.userEquipmentItems.map((e) =>
            e.id === id ? { ...e, ...patch } : e
          ),
        })),
      removeEquipmentItem: (id) =>
        set((s) => ({
          userEquipmentItems: s.userEquipmentItems.filter((e) => e.id !== id),
        })),
    }),
    {
      name: 'knowledge-base-store',
      version: 1,
    }
  )
);

const systemTechEntriesTagged: KbTechEntry[] = systemTechEntries.map((t) => ({
  ...t,
  isSystem: true,
}));
const systemEquipmentItemsTagged: KbEquipmentItem[] = systemEquipmentItems.map(
  (e, idx) => ({ ...e, id: `sys-eq-${idx}`, isSystem: true })
);

export const selectMergedTechEntries = (s: KnowledgeBaseState): KbTechEntry[] => [
  ...systemTechEntriesTagged,
  ...s.userTechEntries,
];

export const selectMergedEquipmentItems = (
  s: KnowledgeBaseState
): KbEquipmentItem[] => [...systemEquipmentItemsTagged, ...s.userEquipmentItems];

export const useMergedTechEntries = (): KbTechEntry[] => {
  const userTechEntries = useKnowledgeBaseStore((s) => s.userTechEntries);
  return useMemo(
    () => [...systemTechEntriesTagged, ...userTechEntries],
    [userTechEntries]
  );
};

export const useMergedEquipmentItems = (): KbEquipmentItem[] => {
  const userEquipmentItems = useKnowledgeBaseStore((s) => s.userEquipmentItems);
  return useMemo(
    () => [...systemEquipmentItemsTagged, ...userEquipmentItems],
    [userEquipmentItems]
  );
};
