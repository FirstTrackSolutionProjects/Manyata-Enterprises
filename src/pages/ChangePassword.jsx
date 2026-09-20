import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { changePassword } from "../services/api";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await changePassword(currentPassword, newPassword);
      await refresh();
      setSuccess(true);
      setTimeout(() => {
        navigate(user?.role === "owner" ? "/admin" : "/employee", {
          replace: true,
        });
      }, 1200);
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-offwhite px-5 py-16">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-2xl border border-navy/10 bg-white p-8"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <Lock size={22} />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-navy">
          Change Your Password
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          {user?.mustChangePassword
            ? "You must change your password before continuing."
            : "Update your login password."}
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-2 rounded-lg border border-green-300 bg-green-50 p-3">
            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0 text-green-600"
            />
            <p className="text-xs text-green-700">
              Password updated successfully. Redirecting…
            </p>
          </div>
        )}

        <label className="mt-6 block">
          <span className="mb-1.5 block text-xs font-semibold text-navy/70">
            Current Password
          </span>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-navy/70">
            New Password
          </span>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-navy/70">
            Confirm New Password
          </span>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-navy/15 px-3.5 py-2.5 text-sm text-navy focus:border-amber focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading || success}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving…
            </>
          ) : (
            "Update Password"
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(user?.role === "owner" ? "/admin" : "/employee")
          }
          className="mt-3 w-full text-center text-xs font-semibold text-muted hover:text-navy"
        >
          Cancel
        </button>
      </motion.form>
    </section>
  );
}