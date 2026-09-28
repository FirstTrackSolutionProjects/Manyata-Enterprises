import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";
import { requestPasswordReset } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Could not request a password reset. Please try again.");
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
          {submitted ? <CheckCircle2 size={22} /> : <Lock size={22} />}
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-navy">Forgot Password?</h1>
        <p className="mt-1 text-center text-sm text-muted">
          {submitted
            ? "If an active account exists for that email, a reset link has been sent. Check your inbox."
            : "Enter your staff account email and we’ll send you a password reset link."}
        </p>

        {!submitted && (
          <>
            {error && <p role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <label className="mt-6 block">
              <span className="mb-1.5 block text-xs font-semibold text-navy/70">Account email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-navy/15 py-2.5 pl-9 pr-3.5 text-sm text-navy focus:border-amber focus:outline-none" />
              </div>
            </label>
            <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-amber px-6 py-3 text-sm font-bold text-navy hover:bg-amber-hover disabled:opacity-60">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : "Send reset link"}
            </button>
          </>
        )}
        {submitted && <Link to="/login" className="mt-6 block text-center text-sm font-semibold text-amber hover:underline">Return to login</Link>}
      </form>
    </section>
  );
}
