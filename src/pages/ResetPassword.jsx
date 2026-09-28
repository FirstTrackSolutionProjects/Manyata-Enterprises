import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "This reset link is invalid or expired. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-offwhite px-5 py-16">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-navy">
          <ArrowLeft size={14} /> Back to login
        </Link>
        <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          {success ? <CheckCircle2 size={22} /> : <Lock size={22} />}
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-navy">Set a New Password</h1>
        <p className="mt-1 text-center text-sm text-muted">
          {success ? "Your password has been reset." : "Choose a new password with at least 8 characters."}
        </p>
        {!success && token && (
          <>
            {error && <p role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <label className="mt-6 block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">New password</span>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 pr-10 text-sm text-navy focus:border-amber focus:outline-none" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </label>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">Confirm new password</span>
              <input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none" />
            </label>
            <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : "Reset password"}
            </button>
          </>
        )}
        {!token && !success && (
          <div className="mt-5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">
            <p role="alert">This reset link is missing its token.</p>
            <Link to="/forgot-password" className="mt-2 inline-block font-semibold underline">Request a new link</Link>
          </div>
        )}
        {!!error && token && <Link to="/forgot-password" className="mt-3 inline-block text-xs font-semibold text-amber hover:underline">Request another reset link</Link>}
        {success && <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-amber hover:underline">Return to login</Link>}
      </form>
    </section>
  );
}
