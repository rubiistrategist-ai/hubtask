import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/utils/supabase-client';

interface ProgressState {
  completedLessons: string[];
  checklist: { id: string; label: string; done: boolean }[];
  lessonChecklist: Record<string, boolean>;
  streak: number;
  lastAccessDate: string | null;
  firstAccessDate: string | null;
  studiedMinutes: number;
  isLoaded: boolean;
  moduleOrder: string[]; // Novo: Ordem dinâmica vinda do banco
  toggleLesson: (lessonId: string) => void;
  toggleChecklist: (id: string) => void;
  toggleLessonChecklist: (key: string) => void;
  isLessonUnlocked: (lessonId: string, index: number) => boolean;
  checkDailyAccess: () => void;
  addStudiedTime: (minutes: number) => void;
  loadFromSupabase: () => Promise<void>;
  syncToSupabase: () => Promise<void>;
  setModuleOrder: (order: string[]) => void; // Novo
}

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getYesterdayStr = () => new Date(Date.now() - 86400000).toISOString().split('T')[0];

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedLessons: [],
      lessonChecklist: {},
      streak: 0,
      lastAccessDate: null,
      firstAccessDate: null,
      studiedMinutes: 0,
      isLoaded: false,
      moduleOrder: [], // Inicia vazio
      checklist: [
        { id: "acc", label: "Criou conta", done: false },
        { id: "min", label: "Instalou Minute", done: false },
        { id: "task", label: "Primeira tarefa", done: false },
        { id: "com", label: "Entrou na comunidade", done: false },
      ],
      
      setModuleOrder: (order) => set({ moduleOrder: order }),
      
      loadFromSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('progress')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          set({
            completedLessons: data.completed_lessons || [],
            lessonChecklist: data.lesson_checklist || {},
            streak: data.streak || 0,
            lastAccessDate: data.last_access_date,
            firstAccessDate: data.first_access_date,
            studiedMinutes: data.studied_minutes || 0,
            isLoaded: true,
          });
        } else {
          await supabase.from('progress').upsert({ 
            user_id: user.id,
            completed_lessons: [],
            streak: 0,
            studied_minutes: 0
          }, { onConflict: 'user_id' });
          set({ isLoaded: true });
        }
      },

      syncToSupabase: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const state = get();
        await supabase.from('progress').update({
          completed_lessons: state.completedLessons,
          lesson_checklist: state.lessonChecklist,
          streak: state.streak,
          last_access_date: state.lastAccessDate,
          first_access_date: state.firstAccessDate,
          studied_minutes: state.studiedMinutes,
        }).eq('user_id', user.id);
      },

      toggleLesson: (lessonId) => {
        const state = get();
        const isCompleted = state.completedLessons.includes(lessonId);
        
        if (isCompleted) {
          // Remoção em cascata baseada na ordem dinâmica
          const lessonIndex = state.moduleOrder.indexOf(lessonId);
          const lessonsToKeep = state.completedLessons.filter(id => state.moduleOrder.indexOf(id) < lessonIndex);
          set({ completedLessons: lessonsToKeep });
        } else {
          set({ completedLessons: [...state.completedLessons, lessonId] });
        }
        get().syncToSupabase();
      },
      
      toggleChecklist: (id) => {
        const state = get();
        set({ checklist: state.checklist.map(item => item.id === id ? { ...item, done: !item.done } : item) });
      },
      
      toggleLessonChecklist: (key) => {
        const state = get();
        set({ lessonChecklist: { ...state.lessonChecklist, [key]: !state.lessonChecklist[key] } });
        get().syncToSupabase();
      },
      
      isLessonUnlocked: (lessonId, index) => {
        if (index === 0) return true;
        const previousLesson = get().moduleOrder[index - 1];
        return get().completedLessons.includes(previousLesson);
      },
      
      checkDailyAccess: () => {
        const state = get();
        const today = getTodayStr();
        if (state.lastAccessDate === today) return;

        let newStreak = state.streak;
        if (!state.firstAccessDate) {
          newStreak = 1;
          set({ firstAccessDate: today, lastAccessDate: today, streak: newStreak });
        } else {
          if (state.lastAccessDate === getYesterdayStr()) newStreak = state.streak + 1;
          else newStreak = 1;
          set({ lastAccessDate: today, streak: newStreak });
        }
        get().syncToSupabase();
      },
      
      addStudiedTime: (minutes) => {
        const state = get();
        set({ studiedMinutes: state.studiedMinutes + minutes });
        get().syncToSupabase();
      }
    }),
    { name: "hubtask-progress" }
  )
);