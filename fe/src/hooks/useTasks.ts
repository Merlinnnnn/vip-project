import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../routes/AuthContext";
import { queryKeys } from "../lib/queryKeys";
import {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
  type TaskInput,
} from "../lib/tasksApi";
import type { Task } from "../types/task";
import { normalizeTasks } from "../pages/Tasks/utils/normalize";

// ─── Queries ────────────────────────────────────────────────────────────────

export const useTasks = () => {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: queryKeys.tasks.all,
    queryFn: () => listTasks({ userId: user!.id, token }),
    enabled: Boolean(user),
    select: normalizeTasks,
  });
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const useCreateTask = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TaskInput) =>
      createTask({ userId: user!.id, token }, input),

    onSuccess: (created) => {
      // Optimistic: thêm vào cache ngay lập tức để UI cập nhật nhanh
      queryClient.setQueryData<Task[]>(queryKeys.tasks.all, (old = []) => [
        ...old,
        created,
      ]);
    },

    onSettled: () => {
      // Luôn revalidate sau khi tạo xong để đảm bảo cache đồng bộ với server
      // (server có thể gán thêm field như createdAt, updatedAt, etc.)
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useUpdateTask = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TaskInput }) =>
      updateTask({ userId: user!.id, token }, id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<Task[]>(queryKeys.tasks.all);

      queryClient.setQueryData<Task[]>(queryKeys.tasks.all, (old = []) =>
        old.map((t) => (t.id === id ? { ...t, ...input } : t)),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};

export const useDeleteTask = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteTask({ userId: user!.id, token }, id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.all });
      const previous = queryClient.getQueryData<Task[]>(queryKeys.tasks.all);

      queryClient.setQueryData<Task[]>(queryKeys.tasks.all, (old = []) =>
        old.filter((t) => t.id !== id),
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.tasks.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
};
