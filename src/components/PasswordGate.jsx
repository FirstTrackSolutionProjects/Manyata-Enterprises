import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

export default function PasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(false);
  const [input, setInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    if (!API_URL) {
      setError("Server not configured. Please try again later.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_URL}/admin/verify-join-us`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setUnlocked(true);
      } else {
        setError(data.message || "Incorrect password. Please try again.");
      }
    } catch {
      setError("Could not reach server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) return children;

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-offwhite px-5 py-16">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm rounded-2xl border border-navy/10 bg-white p-8 text-center"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
          <Lock size={22} />
        </div>
        <h1 className="mt-4 text-lg font-bold text-navy">Restricted Access</h1>
        <p className="mt-1 text-sm text-muted">
          This page requires a password to continue.
        </p>

        <div className="relative mt-6">
          <input
            type={showPassword ? "text" : "password"}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="Enter password"
            className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-navy placeholder:text-muted focus:outline-none ${
              error ? "border-red-400" : "border-navy/15 focus:border-amber"
            }`}
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

        {error && (
          <p className="mt-2 text-left text-xs font-medium text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy transition-colors hover:bg-amber-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying…
            </>
          ) : (
            "Submit"
          )}
        </button>
      </motion.form>
    </section>
  );
}