import { create } from "zustand";
import { WorkId } from "@chronicles-vault/shared";
import { clientRepository } from "../client-repository";

export interface CustomCategory {
  id: string;
  name: string;
  description: string;
  color: "indigo" | "amber" | "rose" | "emerald" | "sky" | "purple" | "orange" | "cyan";
  workIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesState {
  categories: CustomCategory[];
  selectedCategoryId: string | null;

  // Actions
  setSelectedCategoryId: (id: string | null) => void;
  createCategory: (params: {
    name: string;
    description: string;
    color: CustomCategory["color"];
    initialWorkIds?: string[];
  }) => CustomCategory;
  updateCategory: (
    id: string,
    patch: Partial<Omit<CustomCategory, "id" | "createdAt">>
  ) => void;
  deleteCategory: (id: string) => void;
  assignWorkToCategory: (categoryId: string, workId: string) => void;
  removeWorkFromCategory: (categoryId: string, workId: string) => void;
  toggleWorkInCategory: (categoryId: string, workId: string) => void;
  isWorkInCategory: (categoryId: string, workId: string) => boolean;
  getCategoriesForWork: (workId: string) => CustomCategory[];
  refresh: () => void;
}

const STORAGE_KEY = "cv:custom_categories:v1";

function getInitialCategories(): CustomCategory[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as CustomCategory[];
      }
    } catch {
      // Fallback to default seed
    }
  }

  const now = new Date().toISOString();
  return [
    {
      id: "cat-masterpieces",
      name: "Must-Read Masterpieces",
      description: "Stories of transcendent narrative ambition, worldbuilding, and emotional weight.",
      color: "indigo",
      workIds: ["work-orv", "work-vagabond", "work-frieren"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cat-comfort",
      name: "Late Night Comfort",
      description: "Warm, low-stress, relaxing comfort reads to unwind after a long day.",
      color: "amber",
      workIds: ["work-dungeon-meshi", "work-apothecary-diaries"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cat-survival",
      name: "High Stakes Survival",
      description: "Brutal death games, unforgiving battlefields, and razor-thin margins of life or death.",
      color: "rose",
      workIds: ["work-chainsaw-man", "work-solo-leveling"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cat-progression",
      name: "Progression Fantasy",
      description: "Satisfying power scaling, cultivation systems, tower climbs, and relentless self-improvement.",
      color: "emerald",
      workIds: ["work-tower-of-god", "work-tbate", "work-solo-leveling"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "cat-peak",
      name: "Peak Fiction",
      description: "Peak execution across character arcs, unforgettable dialogue, and shocking twists.",
      color: "sky",
      workIds: ["work-lotm", "work-orv", "work-vagabond"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function persistCategories(categories: CustomCategory[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch {
      // Ignore storage errors in sandbox/SSR
    }
  }
}

export const useCategoriesStore = create<CategoriesState>((set, get) => {
  const initial = getInitialCategories();

  return {
    categories: initial,
    selectedCategoryId: initial[0]?.id ?? null,

    setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

    createCategory: ({ name, description, color, initialWorkIds = [] }) => {
      const now = new Date().toISOString();
      const newCat: CustomCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name.trim(),
        description: description.trim(),
        color,
        workIds: initialWorkIds,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [...get().categories, newCat];
      persistCategories(updated);
      set({ categories: updated, selectedCategoryId: newCat.id });
      return newCat;
    },

    updateCategory: (id, patch) => {
      const updated = get().categories.map((cat) => {
        if (cat.id !== id) return cat;
        return {
          ...cat,
          ...patch,
          updatedAt: new Date().toISOString(),
        };
      });
      persistCategories(updated);
      set({ categories: updated });
    },

    deleteCategory: (id) => {
      const current = get().categories;
      const updated = current.filter((c) => c.id !== id);
      persistCategories(updated);
      const nextSelected = get().selectedCategoryId === id
        ? (updated[0]?.id ?? null)
        : get().selectedCategoryId;
      set({ categories: updated, selectedCategoryId: nextSelected });
    },

    assignWorkToCategory: (categoryId, workId) => {
      const updated = get().categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        if (cat.workIds.includes(workId)) return cat;
        return {
          ...cat,
          workIds: [...cat.workIds, workId],
          updatedAt: new Date().toISOString(),
        };
      });
      persistCategories(updated);
      set({ categories: updated });
    },

    removeWorkFromCategory: (categoryId, workId) => {
      const updated = get().categories.map((cat) => {
        if (cat.id !== categoryId) return cat;
        if (!cat.workIds.includes(workId)) return cat;
        return {
          ...cat,
          workIds: cat.workIds.filter((id) => id !== workId),
          updatedAt: new Date().toISOString(),
        };
      });
      persistCategories(updated);
      set({ categories: updated });
    },

    toggleWorkInCategory: (categoryId, workId) => {
      const cat = get().categories.find((c) => c.id === categoryId);
      if (!cat) return;
      if (cat.workIds.includes(workId)) {
        get().removeWorkFromCategory(categoryId, workId);
      } else {
        get().assignWorkToCategory(categoryId, workId);
      }
    },

    isWorkInCategory: (categoryId, workId) => {
      const cat = get().categories.find((c) => c.id === categoryId);
      return cat ? cat.workIds.includes(workId) : false;
    },

    getCategoriesForWork: (workId) => {
      return get().categories.filter((cat) => cat.workIds.includes(workId));
    },

    refresh: () => {
      set({ categories: getInitialCategories() });
    },
  };
});
