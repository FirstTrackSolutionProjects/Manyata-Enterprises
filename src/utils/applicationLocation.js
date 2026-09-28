export function formatApplicationLocation(location) {
  return String(location || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .map((value) => value === "odisha" ? "Odisha" : value === "kolkata" ? "West Bengal" : value)
    .join(" & ") || "-";
}
