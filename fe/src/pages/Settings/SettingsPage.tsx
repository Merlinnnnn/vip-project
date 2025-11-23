import PageTitle from "../../components/common/PageTitle";

const SettingsPage = () => (
  <div className="space-y-4">
    <PageTitle
      title="Settings"
      subtitle="Form demo: cập nhật user, timezone, notifications."
    />
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <form className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tên user
          </label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
            placeholder="John Doe"
          />
        </div>
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Timezone
          </label>
          <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none">
            <option>GMT+7 (Hanoi)</option>
            <option>GMT+9 (Tokyo)</option>
            <option>GMT+0 (UTC)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Notifications
          </label>
          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              Daily reminder
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" />
              Weekly summary
            </label>
            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4" defaultChecked />
              Focus mode alerts
            </label>
          </div>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save (mock)
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default SettingsPage;
