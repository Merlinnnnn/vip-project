import Card from "../../components/common/Card";
import PageTitle from "../../components/common/PageTitle";
import TimerWidget from "../../components/time-tracking/TimerWidget";

const logs = [
  { session: "Morning focus", duration: "01:10:00", note: "React UI refactor" },
  { session: "Noon deep work", duration: "00:50:00", note: "English speaking" },
  { session: "Evening read", duration: "00:35:00", note: "AI research papers" },
];

const TimeTrackingPage = () => (
  <div className="space-y-4">
    <PageTitle
      title="Time Tracking"
      subtitle="Timer mock + bảng log thời gian mẫu."
    />
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <TimerWidget />
      </div>
      <div className="md:col-span-2">
        <Card title="Session logs">
          <div className="overflow-hidden rounded-lg border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Session</th>
                  <th className="px-4 py-2">Duration</th>
                  <th className="px-4 py-2">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {logs.map((log) => (
                  <tr key={log.session}>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {log.session}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.duration}</td>
                    <td className="px-4 py-3 text-slate-600">{log.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  </div>
);

export default TimeTrackingPage;
