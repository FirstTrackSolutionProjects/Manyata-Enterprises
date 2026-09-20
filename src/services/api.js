const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_BASE = API_URL.replace(/\/api\/?$/, "");

/**
 * Generic fetch wrapper that includes credentials (cookies).
 */
export const apiFetch = async (endpoint, options = {}) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: "include",
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.message ||
      data?.message ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

/* ── Auth ───────────────────────────────────────────── */

export const login = (email, password) =>
  apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const logout = () => apiFetch("/auth/logout", { method: "POST" });
export const getMe = () => apiFetch("/auth/me");

export const changePassword = (currentPassword, newPassword) =>
  apiFetch("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });

/* ── Owner: employees ───────────────────────────────── */

export const createEmployee = (payload) =>
  apiFetch("/auth/employees", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const listUsers = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/auth/users${q ? `?${q}` : ""}`);
};

export const updateEmployee = (id, payload) =>
  apiFetch(`/auth/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const resetEmployeePassword = (id, password) =>
  apiFetch(`/auth/employees/${id}/reset-password`, {
    method: "POST",
    body: JSON.stringify(password ? { password } : {}),
  });

export const setUserStatus = (id, status) =>
  apiFetch(`/auth/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteEmployee = (id) =>
  apiFetch(`/auth/employees/${id}`, { method: "DELETE" });

/* ── Branches ───────────────────────────────────────── */

export const listBranches = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/branches${q ? `?${q}` : ""}`);
};

export const listActiveBranches = () => apiFetch("/branches/active");

export const createBranch = (payload) =>
  apiFetch("/branches", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updateBranch = (id, payload) =>
  apiFetch(`/branches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteBranch = (id) =>
  apiFetch(`/branches/${id}`, { method: "DELETE" });

/* ── Applications ───────────────────────────────────── */

export const submitApplication = (formData) =>
  apiFetch("/applications", { method: "POST", body: formData });

export const trackApplication = (applicationNo, phone) =>
  apiFetch("/applications/track", {
    method: "POST",
    body: JSON.stringify({ applicationNo, phone }),
  });

export const listApplications = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/applications${q ? `?${q}` : ""}`);
};

export const getApplication = (id) => apiFetch(`/applications/${id}`);

export const updateApplicationStatus = (id, status, note = "") =>
  apiFetch(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });

export const submitToGovt = (id, govtPortalRef, note = "") =>
  apiFetch(`/applications/${id}/submit-to-govt`, {
    method: "POST",
    body: JSON.stringify({ govtPortalRef, note }),
  });

export const deleteApplication = (id) =>
  apiFetch(`/applications/${id}`, { method: "DELETE" });

export const getApplicationStats = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return apiFetch(`/applications/stats/overview${q ? `?${q}` : ""}`);
};

export const getApplicationTimeline = (id) =>
  apiFetch(`/applications/${id}/history`);

/**
 * Open the application PDF in a new tab (backend serves it).
 */
export const downloadApplicationPdf = (id) => {
  window.open(`${API_URL}/applications/${id}/pdf`, "_blank");
};

/**
 * Build a full URL for an uploaded file path stored in DB.
 * Path may be like "uploads/applications/xyz.jpg".
 */
export const fileUrl = (storedPath) => {
  if (!storedPath) return null;
  if (storedPath.startsWith("http")) return storedPath;
  return `${API_BASE}/${storedPath.replace(/^\/+/, "")}`;
};

/* ── Admin ──────────────────────────────────────────── */

export const getDashboardStats = () => apiFetch("/admin/stats");
export const getEmployeeStats = () => apiFetch("/admin/employee-stats");
export const getRecentActivity = (limit = 50) =>
  apiFetch(`/admin/activity?limit=${limit}`);
export const getBranchStats = () => apiFetch("/admin/branch-stats");

/* ── Partner ────────────────────────────────────────── */

export const submitPartner = (formData) =>
  apiFetch("/partners", { method: "POST", body: formData });