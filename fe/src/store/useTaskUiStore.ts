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
  tags: string;
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

const fmtLocalKey = (d: Date) => {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const defaultForm: TaskUiForm = {
  title: "",
  description: "",
  skillId: "",
  learningMinutes: 60,
  dayOption: "today",
  notifyOption: "1h",
  tags: "",
};

export const useTaskUiStore = create<TaskUiState>((set) => ({
  modalOpen: false,
  selectedDate: fmtLocalKey(new Date()),
  form: defaultForm,
  setModalOpen: (open) => set({ modalOpen: open }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  updateForm: (input) => set((state) => ({ form: { ...state.form, ...input } })),
  resetForm: () => set({ form: defaultForm }),
}));
