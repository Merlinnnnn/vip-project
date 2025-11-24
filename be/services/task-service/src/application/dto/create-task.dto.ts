export type CreateTaskDto = {
  title: string;
  description?: string | null;
  status?: TaskStatus;
};
