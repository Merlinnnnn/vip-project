export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
  },
  skills: {
    all: ["skills"] as const,
    stats: ["skills", "stats"] as const,
  },
} as const;
