import { Clock, CalendarDays, Flame, CalendarCheck } from "lucide-react";
import type { SessionStats } from "../../../types/work-session";

type Props = {
  stats: SessionStats;
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const SessionStatsCards = ({ stats }: Props) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-center gap-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm px-6">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
          <Clock size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Hôm nay</p>
          <p className="text-2xl font-bold text-slate-800">
            {formatDuration(stats.todayMinutes)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm px-6">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
          <CalendarDays size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Tuần này</p>
          <p className="text-2xl font-bold text-slate-800">
            {formatDuration(stats.weekMinutes)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm px-6">
        <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
          <CalendarCheck size={24} />
        </div>
        <div>
          <p className="text-sm text-slate-500">Tháng này</p>
          <p className="text-2xl font-bold text-slate-800">
            {formatDuration(stats.monthMinutes)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm px-6">
        <div className="rounded-xl bg-orange-100 p-3 text-orange-500">
          <Flame size={24} fill="currentColor" />
        </div>
        <div>
          <p className="text-sm text-slate-500">Chuỗi ngày</p>
          <p className="text-2xl font-bold text-slate-800">
            {stats.streak} ngày
          </p>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsCards;
