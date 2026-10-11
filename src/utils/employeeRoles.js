export const isHrEmployee = (user) => {
  if (user?.role !== "employee") return false;
  const jobDetails = `${user?.designation || ""} ${user?.department || ""}`;
  return /\bhr\b|human\s+resources/i.test(jobDetails);
};

export const isTejashHrEmployee = (user) =>
  isHrEmployee(user) && String(user?.userId || user?.user_id || "") === "EMP-BLS-0001";
