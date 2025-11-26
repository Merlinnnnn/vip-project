import { create } from "zustand";
import type { Task } from "../types/task";

type TasksState = {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (id: string) => void;
  clear: () => void;
};

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  setTasks: (tasks) => set({ tasks }),
  upsertTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks.filter((t) => t.id !== task.id),
        task,
      ],
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  clear: () => set({ tasks: [] }),
}));
