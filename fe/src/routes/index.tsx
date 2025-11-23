import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/LoginPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import SkillsPage from "../pages/Skills/SkillsPage";
import TasksPage from "../pages/Tasks/TasksPage";
import TimeTrackingPage from "../pages/TimeTracking/TimeTrackingPage";
import { useAuth } from "./AuthContext";

const ProtectedShell = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/time-tracking" element={<TimeTrackingPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
