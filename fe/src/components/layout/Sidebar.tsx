import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/tasks", label: "Tasks", icon: "✅" },
  { to: "/skills", label: "Skills", icon: "⭐" },
  { to: "/time-tracking", label: "Time Tracking", icon: "⏱️" },
  { to: "/settings", label: "Settings", icon: "⚙️" },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 flex-shrink-0 flex-col overflow-y-auto bg-slate-900 text-white">
      <div className="px-6 py-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Focus Lab
        </div>
        <div className="text-xl font-semibold">10k Hours</div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-200 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/5 px-6 py-4 text-sm text-slate-300">
        Stay focused. 🔥
      </div>
    </aside>
  );
};

export default Sidebar;
