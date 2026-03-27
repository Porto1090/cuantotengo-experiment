export const formatBrandName = (brandStr) => {
  if (!brandStr) return "";
  return brandStr
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};