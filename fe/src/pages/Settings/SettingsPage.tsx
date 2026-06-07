import { useState } from "react";
import PageTitle from "../../components/common/PageTitle";
import { useAuth } from "../../context/AuthContext";

type SaveStatus = "idle" | "saving" | "saved";

/**
 * SettingsPage — Trang cài đặt người dùng.
 *
 * Lưu ý: BE hiện chưa có endpoint update profile,
 * nên dữ liệu được lưu local (localStorage) với thông báo rõ ràng.
 * Khi BE sẵn sàng, chỉ cần thay localStorage.setItem bằng API call.
 */
const SettingsPage = () => {
  const { user } = useAuth();

  const [displayName, setDisplayName] = useState(
    () => localStorage.getItem("settings.displayName") ?? "",
  );
  const [timezone, setTimezone] = useState(
    () => localStorage.getItem("settings.timezone") ?? "GMT+7",
  );
  const [notifyDaily, setNotifyDaily] = useState(
    () => localStorage.getItem("settings.notifyDaily") !== "false",
  );
  const [notifyWeekly, setNotifyWeekly] = useState(
    () => localStorage.getItem("settings.notifyWeekly") === "true",
  );
  const [notifyFocus, setNotifyFocus] = useState(
    () => localStorage.getItem("settings.notifyFocus") !== "false",
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saving");

    // Lưu vào localStorage (TODO: thay bằng API call khi BE có endpoint)
    localStorage.setItem("settings.displayName", displayName);
    localStorage.setItem("settings.timezone", timezone);
    localStorage.setItem("settings.notifyDaily", String(notifyDaily));
    localStorage.setItem("settings.notifyWeekly", String(notifyWeekly));
    localStorage.setItem("settings.notifyFocus", String(notifyFocus));

    // Simulate async save
    setTimeout(() => setSaveStatus("saved"), 600);
    setTimeout(() => setSaveStatus("idle"), 3000);
  };

  return (
    <div className="space-y-4">
      <PageTitle
        title="Cài đặt"
        subtitle="Cập nhật thông tin hiển thị và tùy chọn thông báo."
      />

      {/* Account info — readonly, từ AuthContext */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        <span className="font-medium text-slate-800">Tài khoản: </span>
        {user?.email ?? "—"}
        <span className="ml-3 text-xs text-slate-400">(Email không thể thay đổi)</span>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSave}>
          <div className="md:col-span-1">
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="display-name"
            >
              Tên hiển thị
            </label>
            <input
              id="display-name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              placeholder="Tên của bạn"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="md:col-span-1">
            <label
              className="mb-1 block text-sm font-medium text-slate-700"
              htmlFor="timezone"
            >
              Múi giờ
            </label>
            <select
              id="timezone"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              <option value="GMT+7">GMT+7 (Hà Nội)</option>
              <option value="GMT+9">GMT+9 (Tokyo)</option>
              <option value="GMT+0">GMT+0 (UTC)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Thông báo
            </label>
            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  checked={notifyDaily}
                  onChange={(e) => setNotifyDaily(e.target.checked)}
                />
                Nhắc nhở hàng ngày
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  checked={notifyWeekly}
                  onChange={(e) => setNotifyWeekly(e.target.checked)}
                />
                Tổng kết hàng tuần
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-emerald-500"
                  checked={notifyFocus}
                  onChange={(e) => setNotifyFocus(e.target.checked)}
                />
                Cảnh báo chế độ focus
              </label>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              * Hiện lưu local — sẽ đồng bộ server khi BE có endpoint update profile.
            </p>
            <button
              type="submit"
              disabled={saveStatus === "saving"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {saveStatus === "saving"
                ? "Đang lưu..."
                : saveStatus === "saved"
                ? "✓ Đã lưu!"
                : "Lưu cài đặt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
