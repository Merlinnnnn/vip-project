export type StartSessionDto = {
  taskId?: string;
  skillId?: string; // allow direct skill time-logging without a task
};

export type StopSessionDto = {
  note?: string;
};
