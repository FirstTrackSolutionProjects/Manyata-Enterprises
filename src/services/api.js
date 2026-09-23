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

export const submitApplication = (payload) =>
  apiFetch("/applications", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });

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

export const updateApplication = (id, payload) =>
  apiFetch(`/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const submitToGovt = (id, govtPortalRef, note = "") =>
  apiFetch(`/applications/${id}/submit-to-govt`, {
    method: "POST",
    body: JSON.stringify({ govtPortalRef, note }),
  });

export const deleteApplication = (id) =>
  apiFetch(`/applications/${id}`, { method: "DELETE" });

export const listInstallations = (location = "") =>
  apiFetch(`/installations${location ? `?location=${location}` : ""}`);

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
export const clearRecentActivity = () =>
  apiFetch("/admin/activity", { method: "DELETE" });
export const getBranchStats = () => apiFetch("/admin/branch-stats");

/* ── Partner ────────────────────────────────────────── */

export const submitPartner = (payload) =>
  apiFetch("/partners", {
    method: "POST",
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  });

/* ── S3 presigned uploads ───────────────────────────── */

/**
 * Request presigned PUT URLs for a set of files.
 * @param {"applications"|"careers"|"join-us"|"partners"} folder
 * @param {{ inputName: string, filename: string, filetype: string }[]} files
 * @returns {Promise<Record<string, { uploadUrl: string, fileKey: string }>>}
 */
export const getPresignedUploadUrls = (folder, files) =>
  apiFetch("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({ folder, files }),
  });

/**
 * PUT a File object directly to an S3 presigned URL.
 */
export const putObjectToS3 = async (putURL, file, filetype) => {
  if (!putURL || !file || !filetype) {
    throw new Error("putURL, file and filetype are required");
  }
  const res = await fetch(putURL, {
    method: "PUT",
    headers: { "Content-Type": filetype },
    body: file,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("S3 upload failed:", res.status, body);
    const code = body.match(/<Code>(.*?)<\/Code>/)?.[1];
    const msg = body.match(/<Message>(.*?)<\/Message>/)?.[1];
    throw new Error(`Upload failed: ${code || res.status} ${msg || ""}`.trim());
  }
  return true;
};

/**
 * High-level helper: given a map of { inputName: File }, upload each to S3
 * and return a map of { inputName: fileKey } ready to embed in JSON payload.
 *
 * @param {"applications"|"careers"|"join-us"|"partners"} folder
 * @param {Record<string, File|null|undefined>} fileMap
 * @returns {Promise<Record<string, string>>}  { inputName: fileKey }
 */
export const uploadFilesToS3 = async (folder, fileMap) => {
  const entries = Object.entries(fileMap).filter(([, f]) => f instanceof File);
  if (entries.length === 0) return {};

  const files = entries.map(([inputName, f]) => ({
    inputName,
    filename: f.name,
    filetype: f.type || "application/octet-stream",
  }));

  const res = await getPresignedUploadUrls(folder, files);

  // Backend response ko wrapper se bahar nikalo (data / files / uploads / direct)
  const presigned = res?.data || res?.files || res?.uploads || res;
  

  await Promise.all(
    entries.map(([inputName, f]) => {
      const info = presigned?.[inputName];
      if (!info?.uploadUrl || !info?.fileKey) {
        throw new Error(`Presigned URL missing for "${inputName}"`);
      }
      return putObjectToS3(
        info.uploadUrl,
        f,
        f.type || "application/octet-stream"
      );
    })
  );

  const result = {};
  for (const [inputName] of entries) {
    result[inputName] = presigned[inputName].fileKey;
  }
  return result;
};
