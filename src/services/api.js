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
    // Keep the initial null value when a response body is not JSON.
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

export const requestPasswordReset = (email) =>
  apiFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });

export const resetPassword = (token, newPassword) =>
  apiFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });

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

export const listInstallations = (location = "", filters = {}) => {
  const params = new URLSearchParams();
  if (location) params.set("location", location);
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  return apiFetch(`/installations${params.size ? `?${params.toString()}` : ""}`);
};
export const getInstallation = (id) => apiFetch(`/installations/${id}`);
export const downloadInstallationPdf = (id) => window.open(`${API_URL}/installations/${id}/pdf`, "_blank", "noopener,noreferrer");
export const updateInstallation = (id, payload) => apiFetch(`/installations/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const updateInstallationStatus = (id, status, note = "") => apiFetch(`/installations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) });
export const deleteInstallation = (id) => apiFetch(`/installations/${id}`, { method: "DELETE" });

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

export const getApprovedSubVendors = (location) =>
  apiFetch(`/partners/approved-sub-vendors?location=${encodeURIComponent(location)}`);

export const createPartnerRecord = (payload) =>
  apiFetch("/admin/partners", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const updatePartner = (id, payload) =>
  apiFetch(`/admin/partners/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

export const getPartnerDetail = (id) => apiFetch(`/admin/partners/${id}`);

export const updatePartnerStatus = (id, status, note = "") =>
  apiFetch(`/admin/partners/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
export const resetPartnerPassword = (id) =>
  apiFetch(`/admin/partners/${id}/reset-password`, { method: "POST" });
export const resendPartnerAgreement = (id) => apiFetch(`/admin/partners/${id}/agreement`, { method: "POST" });
export const sendPartnerAgreement = resendPartnerAgreement;
const downloadPartnerAgreementFile = async (id, extension) => {
  const response = await fetch(`${API_URL}/admin/partners/${id}/agreement.${extension}`, { credentials: "include" });
  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* use the HTTP status message */ }
    throw new Error(data?.message || data?.errors?.[0]?.message || `Agreement download failed (${response.status}).`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `Sales-Commission-Agreement-${id}.${extension}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const downloadPartnerAgreement = async (id) => {
  return downloadPartnerAgreementFile(id, "docx");
};
export const downloadPartnerAgreementPdf = (id) => downloadPartnerAgreementFile(id, "pdf");

export const getJoinUsDetail = (id) => apiFetch(`/admin/join-us/${id}`);
export const updateJoinUs = (id, payload) => apiFetch(`/admin/join-us/${id}`, {
  method: "PUT",
  body: JSON.stringify(payload),
});
export const deleteJoinUs = (id) => apiFetch(`/admin/join-us/${id}`, { method: "DELETE" });
export const downloadJoinUsLOA = async (id) => {
  const response = await fetch(`${API_URL}/admin/join-us/${id}/loa.pdf`, { credentials: "include" });
  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* use the HTTP status message */ }
    throw new Error(data?.message || data?.errors?.[0]?.message || `LOA download failed (${response.status}).`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `loa-join-us-${id}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const updateJoinUsStatus = (id, status, note = "") => apiFetch(`/admin/join-us/${id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status, note }),
});

export const getCareerDetail = (id) => apiFetch(`/admin/careers/${id}`);
export const updateCareer = (id, payload) => apiFetch(`/admin/careers/${id}`, {
  method: "PUT",
  body: JSON.stringify(payload),
});
export const deleteCareer = (id) => apiFetch(`/admin/careers/${id}`, { method: "DELETE" });
export const updateCareerStatus = (id, status, note = "") => apiFetch(`/admin/careers/${id}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status, note }),
});
export const getContactDetail = (id) => apiFetch(`/admin/contacts/${id}`);
export const updateContact = (id, payload) => apiFetch(`/admin/contacts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const updateContactStatus = (id, status, note = "") => apiFetch(`/admin/contacts/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) });
export const downloadSubmissionPdf = (type, id) => window.open(`${API_URL}/admin/${type}/${id}/pdf`, "_blank", "noopener,noreferrer");

/* ── S3 presigned uploads ───────────────────────────── */

/**
 * Request presigned PUT URLs for a set of files.
 * @param {"applications"|"careers"|"join-us"|"partners"|"installations"|"employee-profiles"} folder
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
