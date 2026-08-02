import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Register/RegisterPage";
import SettingsPage from "./pages/Settings/SettingsPage";
import SkillsPage from "./pages/Skills/SkillsPage";
import TasksPage from "./pages/Tasks/TasksPage";
import TimeTrackingPage from "./pages/TimeTracking/TimeTrackingPage";
import NotFoundPage from "./pages/NotFound/NotFoundPage";
import { useAuth } from "./context/AuthContext";

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

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
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
        element={<NotFoundPage />}
      />
    </Routes>
  );
};

export default App;
