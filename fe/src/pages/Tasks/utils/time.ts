export const ensureDuration = (learningMinutes?: number) => Math.max(15, Number(learningMinutes) || 60);
