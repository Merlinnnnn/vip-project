import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { queryKeys } from "../lib/queryKeys";
import type {
  StartSessionInput,
  StopSessionInput,
} from "../lib/workSessionsApi";
import {
  startSession,
  stopSession,
  getActiveSession,
  listSessions,
  getSessionStats,
} from "../lib/workSessionsApi";

export const useActiveSession = () => {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: queryKeys.sessions.active,
    queryFn: () => getActiveSession({ userId: user!.id, token }),
    enabled: !!user,
  });
};

export const useSessionStats = () => {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: queryKeys.sessions.stats,
    queryFn: () => getSessionStats({ userId: user!.id, token }),
    enabled: !!user,
  });
};

export const useSessions = (params?: { from?: string; to?: string }) => {
  const { user, token } = useAuth();
  return useQuery({
    queryKey: [...queryKeys.sessions.all, params],
    queryFn: () => listSessions({ userId: user!.id, token }, params),
    enabled: !!user,
  });
};

export const useStartSession = () => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  return useMutation({
    mutationFn: (input: StartSessionInput) => startSession({ userId: user!.id, token }, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all }); // Task might change status to in_progress
    },
  });
};

export const useStopSession = () => {
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: StopSessionInput }) =>
      stopSession({ userId: user!.id, token }, id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.active });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.stats });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.skills.stats });
    },
  });
};
