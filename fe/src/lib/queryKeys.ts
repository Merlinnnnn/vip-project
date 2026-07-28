export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
  },
  skills: {
    all: ["skills"] as const,
    stats: ["skills", "stats"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    active: ["sessions", "active"] as const,
    stats: ["sessions", "stats"] as const,
  },
} as const;
