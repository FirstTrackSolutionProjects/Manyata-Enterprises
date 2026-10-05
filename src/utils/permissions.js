import { isHrEmployee } from "./employeeRoles";

export const hasActionPermission = (user, module, action) => {
  if (user?.role === "owner" || isHrEmployee(user)) return true;
  if (!user?.permissions?.includes(module)) return false;
  // Employees created before action grants were introduced retain their module access.
  if (!user.actionPermissions) return action !== "export";
  return user.actionPermissions?.[module]?.[action] === true;
};
