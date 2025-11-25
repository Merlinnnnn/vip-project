import Card from "../../components/common/Card";
import PageTitle from "../../components/common/PageTitle";
import TaskList from "../../components/tasks/TaskList";
import type { Task } from "../../types/task";

const tasks: Task[] = [
  { id: "1", title: "Write weekly review", status: "in_progress" },
  { id: "2", title: "Read 10 pages about React 19", status: "todo" },
  { id: "3", title: "Practice English speaking", status: "done" },
];

const statCards = [
  { label: "Tasks hôm nay", value: "7", detail: "3 done / 4 pending" },
  { label: "Giờ học tuần này", value: "12h", detail: "Target: 15h" },
  { label: "Skill đang luyện", value: "3", detail: "English, DevOps, AI" },
];

const DashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Dashboard"
        subtitle="Tổng quan tiến độ 10.000 giờ và công việc trong ngày."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <Card key={item.label}>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
            <p className="text-sm text-slate-600">{item.detail}</p>
          </Card>
        ))}
      </div>
      <TaskList tasks={tasks} />
    </div>
  );
};

export default DashboardPage;
