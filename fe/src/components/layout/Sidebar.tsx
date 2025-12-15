import { NavLink } from "react-router-dom";

type Props = {
  isCollapsed: boolean;
  onToggle: () => void;
  widthClass: string;
};

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "•" },
  { to: "/tasks", label: "Tasks", icon: "•" },
  { to: "/skills", label: "Skills", icon: "•" },
  { to: "/time-tracking", label: "Time Tracking", icon: "•" },
  { to: "/settings", label: "Settings", icon: "•" },
];

const Sidebar = ({ isCollapsed, onToggle, widthClass }: Props) => {
  return (
    <aside
      className={`hidden md:fixed md:inset-y-0 md:left-0 ${widthClass} flex-shrink-0 flex-col overflow-y-auto bg-slate-900 text-white transition-all duration-200 md:flex`}
    >
      <div className="flex items-center justify-between px-3 py-4">
        {!isCollapsed && (
          <div className="px-2">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Focus Lab
            </div>
            <div className="text-xl font-semibold">10k Hours</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <span className="flex flex-col gap-1">
            <span className="h-0.5 w-4 bg-white" />
            <span className="h-0.5 w-4 bg-white" />
            <span className="h-0.5 w-4 bg-white" />
          </span>
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {links.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition",
                isCollapsed ? "justify-center" : "px-3",
                isActive
                  ? "bg-white/10 text-white"
                  : "text-slate-200 hover:bg-white/5 hover:text-white",
              ].join(" ")
            }
          >
            <span className="text-lg">{item.icon}</span>
            {!isCollapsed && item.label}
          </NavLink>
        ))}
      </nav>
      {!isCollapsed && (
        <div className="border-t border-white/5 px-6 py-4 text-sm text-slate-300">
          Stay focused.
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
