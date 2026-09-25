import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Mail, Loader2, AlertCircle, Home, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        const redirect =
          location.state?.from ||
          (loggedInUser.role === "owner" ? "/admin" : "/employee");
        navigate(redirect, { replace: true });
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect away
  if (user) {
    const dest = user.role === "owner" ? "/admin" : "/employee";
    navigate(dest, { replace: true });
    return null;
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-offwhite px-5 py-16">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8"
      >
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy"
        >
          <Home size={14} />
          Back to home
        </Link>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <Lock size={22} />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-navy">
          Staff Login
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          Owner and employee access only
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-navy/70">
            Employee ID or Email
          </span>
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username or email"
              className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
            />
          </div>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-navy/70">
            Password
          </span>
          <div className="relative">
            <Lock
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-10 text-sm text-navy placeholder:text-muted focus:border-amber focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        <Link to="/forgot-password" className="mt-3 block text-right text-xs font-semibold text-amber hover:underline">
          Forgot password?
        </Link>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="mt-5 text-center text-xs text-muted">
          Not a staff member?{" "}
          <Link to="/track" className="font-semibold text-amber hover:underline">
            Track your application
          </Link>
        </p>
      </motion.form>
    </section>
  );
}
