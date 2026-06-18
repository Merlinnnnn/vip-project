import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { queryKeys } from "../lib/queryKeys";
import {
  listSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getStats,
  type SkillInput,
} from "../lib/skillsApi";
import type { Skill } from "../types/skill";

// ─── Queries ────────────────────────────────────────────────────────────────

export const useSkills = () => {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: queryKeys.skills.all,
    queryFn: () => listSkills({ userId: user!.id, token }),
    enabled: Boolean(user),
    // staleTime 2 phút — skills list ít thay đổi, FE invalidate sau mọi mutation
    staleTime: 2 * 60 * 1000,
  });
};

export const useSkillStats = () => {
  const { user, token } = useAuth();

  return useQuery({
    queryKey: queryKeys.skills.stats,
    queryFn: () => getStats({ userId: user!.id, token }),
    enabled: Boolean(user),
    // staleTime 5 phút — khớp với BE Redis TTL (5 phút)
    // BE đã cache và pessimistic invalidate → FE không cần refetch nếu chưa stale
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const useCreateSkill = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SkillInput) =>
      createSkill({ userId: user!.id, token }, input),

    onSuccess: (created) => {
      queryClient.setQueryData<Skill[]>(queryKeys.skills.all, (old = []) => [
        ...old,
        created,
      ]);
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.stats });
    },

    onSettled: () => {
      // Revalidate để đảm bảo cache đồng bộ với server
      // (server có thể gán thêm field như createdAt, updatedAt, etc.)
      void queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
    },
  });
};

export const useUpdateSkill = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SkillInput> }) =>
      updateSkill({ userId: user!.id, token }, id, input),

    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.skills.all });
      const previous = queryClient.getQueryData<Skill[]>(queryKeys.skills.all);

      queryClient.setQueryData<Skill[]>(queryKeys.skills.all, (old = []) =>
        old.map((s) => (s.id === id ? { ...s, ...input } : s)),
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.skills.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.stats });
    },
  });
};

export const useDeleteSkill = () => {
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      deleteSkill({ userId: user!.id, token }, id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.skills.all });
      const previous = queryClient.getQueryData<Skill[]>(queryKeys.skills.all);

      queryClient.setQueryData<Skill[]>(queryKeys.skills.all, (old = []) =>
        old.filter((s) => s.id !== id),
      );

      return { previous };
    },

    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.skills.all, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.stats });
    },
  });
};
