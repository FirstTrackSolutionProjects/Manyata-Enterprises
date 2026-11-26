export const SERVICE_LOCATIONS = [
  { key: "odisha", label: "Odisha" },
  { key: "kolkata", label: "West Bengal" },
  { key: "assam", label: "Assam" },
  { key: "uttar_pradesh", label: "Uttar Pradesh" },
  { key: "maharashtra", label: "Maharashtra" },
];

export const locationLabel = (key) => SERVICE_LOCATIONS.find((location) => location.key === key)?.label || key;
