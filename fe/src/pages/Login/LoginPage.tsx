import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from || "/dashboard", { replace: true });
    }
  }, [from, isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const ok = await login(email, password, rememberMe);
    if (!ok) {
      setError("Đăng nhập thất bại. Kiểm tra email/mật khẩu hoặc server BE.");
      return;
    }
    navigate(from || "/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">10k hours</p>
          <h1 className="text-2xl font-bold text-white">Focus & Time Tracking</h1>
          <p className="mt-2 text-sm text-slate-200">Đăng nhập bằng email và mật khẩu của bạn.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-200">Email</label>
            <input
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-200">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-white/30 bg-white/10 text-emerald-400 accent-emerald-400"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Lưu đăng nhập (ghi nhớ trên thiết bị này)</span>
          </label>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Đăng nhập
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-200">
          Chưa có tài khoản?{" "}
          <Link className="text-emerald-300 underline underline-offset-4" to="/register">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
