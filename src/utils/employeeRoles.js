export const isHrEmployee = (user) => {
  if (user?.role !== "employee") return false;
  const jobDetails = `${user?.designation || ""} ${user?.department || ""}`;
  return /\bhr\b|human\s+resources/i.test(jobDetails);
};
