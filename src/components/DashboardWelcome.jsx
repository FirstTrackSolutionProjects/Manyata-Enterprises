import { useEffect, useState } from "react";

const getGreeting = (date) => {
  const hour = Number(new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).format(date));
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

export default function DashboardWelcome({ name, description }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(now);

  return (
    <div className="rounded-2xl border border-amber/30 bg-gradient-to-r from-amber-soft via-white to-white p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber">
        Welcome back
      </p>
      <h2 className="mt-1 text-xl font-extrabold text-navy sm:text-2xl">
        {getGreeting(now)}, {name} 👋
      </h2>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
        <time dateTime={now.toISOString()}>{date}</time>
        <span aria-hidden="true">•</span>
        <time className="rounded-full bg-white px-3 py-1 font-medium text-navy shadow-sm" dateTime={now.toISOString()}>
          {time}
        </time>
      </div>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
    </div>
  );
}
