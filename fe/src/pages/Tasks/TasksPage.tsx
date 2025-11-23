import PageTitle from "../../components/common/PageTitle";
import TaskList from "../../components/tasks/TaskList";
import type { Task } from "../../types/task";

const tasks: Task[] = [
  { id: 1, title: "Design daily schedule", status: "todo", dueDate: "Today" },
  { id: 2, title: "Ship UI demo to mentor", status: "in-progress", dueDate: "Tomorrow" },
  { id: 3, title: "Write progress journal", status: "todo", dueDate: "Nov 24" },
  { id: 4, title: "Deep work: AI research 2h", status: "done", dueDate: "Today" },
];

const TasksPage = () => (
  <div className="space-y-4">
    <PageTitle
      title="Tasks"
      subtitle="Danh sách task demo, cập nhật backend sau."
    />
    <TaskList tasks={tasks} />
  </div>
);

export default TasksPage;
