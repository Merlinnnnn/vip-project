import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../routes/AuthContext";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register, isAuthenticated } = useAuth();
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
    const ok = await register(email, password, name);
    if (!ok) {
      setError("Đăng ký thất bại. Kiểm tra thông tin hoặc server BE.");
      return;
    }
    navigate(from || "/dashboard", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 text-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white/10 p-8 shadow-2xl backdrop-blur">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">10k hours</p>
          <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-slate-200">Đăng ký để bắt đầu quản lý thời gian.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-200">Họ tên (tuỳ chọn)</label>
            <input
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />
          </div>
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
            <label className="mb-1 block text-sm text-slate-200">Mật khẩu</label>
            <input
              type="password"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder:text-slate-300 focus:border-emerald-400 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
          >
            Đăng ký
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-200">
          Đã có tài khoản?{" "}
          <Link className="text-emerald-300 underline underline-offset-4" to="/login">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
