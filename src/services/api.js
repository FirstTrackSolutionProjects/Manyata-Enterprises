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

export const updateMyEmployeeProfile = (payload) =>
  apiFetch("/auth/me/profile", {
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

export const generateEmployeeSalarySlip = (payload) =>
  apiFetch("/salaries", { method: "POST", body: JSON.stringify(payload) });
export const publishEmployeeSalarySlip = (id) =>
  apiFetch(`/salaries/${id}/publish`, { method: "PATCH" });
export const getSalaryEmployees = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/salaries/employees${query ? `?${query}` : ""}`);
};
export const getSalaryAttendancePreview = (employeeId, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/salaries/employees/${employeeId}/attendance-preview${query ? `?${query}` : ""}`);
};
export const getEmployeeSalaryAdvances = (employeeId) => apiFetch(`/salaries/employees/${employeeId}/advances`);
export const createEmployeeSalaryAdvance = (employeeId, payload) =>
  apiFetch(`/salaries/employees/${employeeId}/advances`, { method: "POST", body: JSON.stringify(payload) });
export const getMySalarySlips = () => apiFetch("/salaries/my");
export const downloadSalarySlip = async (id, employeeName, payMonth, payYear) => {
  const response = await fetch(`${API_URL}/salaries/${id}/pdf`, { credentials: "include" });
  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* use status fallback */ }
    throw new Error(data?.message || data?.errors?.[0]?.message || `Salary slip download failed (${response.status}).`);
  }
  const blob = await response.blob();
  const contentDispositionFilename = response.headers.get("content-disposition")?.match(/filename="?([^";]+)"?/i)?.[1];
  const safeEmployeeName = String(employeeName || "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  const month = Number(payMonth);
  const year = Number(payYear);
  const period = month >= 1 && month <= 12 && year > 0
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)))
    : "";
  const filename = safeEmployeeName && period
    ? `${safeEmployeeName} _Salary Slip- ${period}.pdf`
    : contentDispositionFilename || `salary-slip-${id}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

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

export const assignApplicationTechnicalWork = (id, employeeId, instructions) =>
  apiFetch(`/applications/${id}/technical-assignment`, {
    method: "PATCH",
    body: JSON.stringify({ employeeId: employeeId || null, instructions }),
  });

export const getApplicationForwardOptions = (id) => apiFetch(`/applications/${id}/forward-options`);

export const forwardApplicationToEmployee = (id, employeeId) =>
  apiFetch(`/applications/${id}/forward`, {
    method: "POST",
    body: JSON.stringify({ employeeId: Number(employeeId) }),
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

export const downloadCsvExport = async (endpoint, filename) => {
  const response = await fetch(`${API_URL}${endpoint}`, { credentials: "include" });
  if (!response.ok) {
    let message = "Could not download Excel file.";
    try { const body = await response.json(); message = body.message || message; } catch { /* keep default */ }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
export const getInstallation = (id) => apiFetch(`/installations/${id}`);
export const downloadInstallationPdf = (id) => window.open(`${API_URL}/installations/${id}/pdf`, "_blank", "noopener,noreferrer");
export const updateInstallation = (id, payload) => apiFetch(`/installations/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const updateInstallationStatus = (id, status, note = "") => apiFetch(`/installations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) });
export const assignInstallationTechnicalWork = (id, employeeId, instructions) => apiFetch(`/installations/${id}/technical-assignment`, { method: "PATCH", body: JSON.stringify({ employeeId: employeeId || null, instructions }) });
export const listTechnicalInstallationEmployees = (location = "") => apiFetch(`/installations/technical-employees${location ? `?location=${encodeURIComponent(location)}` : ""}`);
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
  apiFetch(`/partners/approved-sub-vendors?location=${encodeURIComponent(location)}`, { cache: "no-store" });
export const getApprovedPartnerNetwork = (location) =>
  apiFetch(`/partners/approved-network?location=${encodeURIComponent(location)}`, { cache: "no-store" });

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
export const setOwnerPartnerCommission = (id, commissionRates) =>
  apiFetch(`/admin/partners/${id}/commission`, {
    method: "PUT",
    body: JSON.stringify({ commissionRates }),
  });

export const updatePartnerStatus = (id, status, note = "") =>
  apiFetch(`/admin/partners/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, note }),
  });
export const resetPartnerPassword = (id) =>
  apiFetch(`/admin/partners/${id}/reset-password`, { method: "POST" });
export const updatePartnerDashboardAccess = (id, applications) =>
  apiFetch(`/admin/partners/${id}/dashboard-access`, {
    method: "PUT",
    body: JSON.stringify({ applications }),
  });
export const getMyPartnerApplications = (params = {}) => {
  const query = new URLSearchParams(params);
  return apiFetch(`/partners/my-applications?${query.toString()}`);
};
export const getMyPartnerHierarchy = () => apiFetch("/partners/my-hierarchy");
export const setMyChildPartnerCommission = (id, commissionRates) =>
  apiFetch(`/partners/${id}/commission`, {
    method: "PUT",
    body: JSON.stringify({ commissionRates }),
  });
export const getMyCommissionPayouts = () => apiFetch("/commission-payouts/my");
export const listCommissionPayouts = (params = {}) => {
  const query = new URLSearchParams(params);
  return apiFetch(`/commission-payouts?${query.toString()}`);
};
export const updateCommissionPayoutStatus = (id, payload) =>
  apiFetch(`/commission-payouts/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) });
export const getMyLeaveRequests = () => apiFetch("/leave-requests/my");
export const createMyLeaveRequest = (payload) => apiFetch("/leave-requests", { method: "POST", body: JSON.stringify(payload) });
export const updateMyLeaveRequest = (id, payload) => apiFetch(`/leave-requests/${id}`, { method: "PUT", body: JSON.stringify(payload) });
export const cancelMyLeaveRequest = (id) => apiFetch(`/leave-requests/${id}/cancel`, { method: "PATCH", body: JSON.stringify({}) });
export const getLeaveInbox = (params = {}) => {
  const query = new URLSearchParams(params);
  return apiFetch(`/leave-requests/inbox?${query.toString()}`);
};
export const decideLeaveRequest = (id, payload) => apiFetch(`/leave-requests/${id}/decision`, { method: "PATCH", body: JSON.stringify(payload) });
export const getMyAttendance = (month) => apiFetch(`/attendance/my${month ? `?month=${encodeURIComponent(month)}` : ""}`);
export const attendancePhotoHref = (id, action) => `${API_URL}/attendance/photo/${encodeURIComponent(id)}/${encodeURIComponent(action)}`;
export const clockInToAttendance = (payload = {}) => apiFetch("/attendance/clock-in", { method: "POST", body: JSON.stringify(payload) });
export const clockOutOfAttendance = (payload = {}) => apiFetch("/attendance/clock-out", { method: "POST", body: JSON.stringify(payload) });
export const startAttendanceBreak = (type = "rest") => apiFetch("/attendance/break/start", { method: "POST", body: JSON.stringify({ type }) });
export const endAttendanceBreak = () => apiFetch("/attendance/break/end", { method: "POST", body: JSON.stringify({}) });
export const getAttendanceRegister = (params = {}) => {
  const query = new URLSearchParams(params);
  return apiFetch(`/attendance/register?${query.toString()}`);
};
export const addManagerAttendanceEvent = (payload) => apiFetch("/attendance/manager-events", { method: "POST", body: JSON.stringify(payload) });
export const updateAttendanceRegisterTime = (id, payload) => apiFetch(`/attendance/register/${id}/time`, { method: "PATCH", body: JSON.stringify(payload) });
export const updateAttendanceBreak = (id, payload) => apiFetch(`/attendance/breaks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
export const getAttendanceSettings = () => apiFetch("/attendance/settings");
export const saveAttendanceSettings = (payload) => apiFetch("/attendance/settings", { method: "PUT", body: JSON.stringify(payload) });
export const addAttendanceHoliday = (payload) => apiFetch("/attendance/holidays", { method: "POST", body: JSON.stringify(payload) });
export const removeAttendanceHoliday = (id) => apiFetch(`/attendance/holidays/${id}`, { method: "DELETE" });
export const getAttendanceCalendar = (params = {}) => apiFetch(`/attendance/calendar?${new URLSearchParams(params).toString()}`);
export const requestAttendanceCorrection = (payload) => apiFetch("/attendance/corrections", { method: "POST", body: JSON.stringify(payload) });
export const getAttendanceCorrections = (mine = false, status = "pending") => apiFetch(`/attendance/corrections${mine ? "/my" : `?status=${encodeURIComponent(status)}`}`);
export const decideAttendanceCorrection = (id, payload) => apiFetch(`/attendance/corrections/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
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
export const createJoinUsSubmission = (payload) => apiFetch("/admin/join-us", { method: "POST", body: JSON.stringify(payload) });
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
export const createCareerApplication = (payload) => apiFetch("/admin/careers", { method: "POST", body: JSON.stringify(payload) });
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

  try {
    const res = await getPresignedUploadUrls(folder, files);
    const presigned = res?.data || res?.files || res?.uploads || res;
    await Promise.all(entries.map(([inputName, file]) => {
      const info = presigned?.[inputName];
      if (!info?.uploadUrl || !info?.fileKey) throw new Error(`Presigned URL missing for "${inputName}"`);
      return putObjectToS3(info.uploadUrl, file, file.type || "application/octet-stream");
    }));
    return Object.fromEntries(entries.map(([inputName]) => [inputName, presigned[inputName].fileKey]));
  } catch (directUploadError) {
    console.warn("Direct S3 upload failed; retrying through the API upload endpoint.", directUploadError);
    const body = new FormData();
    body.append("folder", folder);
    entries.forEach(([inputName, file]) => body.append(inputName, file, file.name));
    let response;
    try {
      response = await fetch(`${API_URL}/uploads/proxy`, { method: "POST", credentials: "include", body });
    } catch (proxyError) {
      throw new Error("Could not reach the document upload service. Your saved application draft is still available; check the connection and retry.", { cause: proxyError });
    }
    let result;
    try { result = await response.json(); } catch { result = null; }
    if (!response.ok) throw new Error(result?.message || `Document upload failed (${response.status}). Please retry.`, { cause: directUploadError });
    const uploaded = result?.data || result?.files || result?.uploads || result;
    if (!uploaded || entries.some(([inputName]) => !uploaded[inputName])) {
      throw new Error("The server did not confirm every document upload. Please retry before submitting.", { cause: directUploadError });
    }
    return uploaded;
  }
};
