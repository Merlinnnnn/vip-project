import { create } from "zustand";

type DayOption = "today" | "tomorrow" | "custom" | "none";
type NotifyOption = "1h" | "4h" | "none";

export type TaskUiForm = {
  title: string;
  description: string;
  skillId: string;
  learningMinutes: number;
  dayOption: DayOption;
  notifyOption: NotifyOption;
  priority: string;
  tags: string;
  assignee: string;
};

type TaskUiState = {
  modalOpen: boolean;
  selectedDate: string;
  form: TaskUiForm;
  setModalOpen: (open: boolean) => void;
  setSelectedDate: (date: string) => void;
  updateForm: (input: Partial<TaskUiForm>) => void;
  resetForm: () => void;
};

const defaultForm: TaskUiForm = {
  title: "",
  description: "",
  skillId: "",
  learningMinutes: 60,
  dayOption: "today",
  notifyOption: "1h",
  priority: "",
  tags: "",
  assignee: "",
};

export const useTaskUiStore = create<TaskUiState>((set) => ({
  modalOpen: false,
  selectedDate: new Date().toISOString().slice(0, 10),
  form: defaultForm,
  setModalOpen: (open) => set({ modalOpen: open }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  updateForm: (input) => set((state) => ({ form: { ...state.form, ...input } })),
  resetForm: () => set({ form: defaultForm }),
}));
