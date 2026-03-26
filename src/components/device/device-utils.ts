
export const toTitle = (
  value: string | number | undefined | null,
  fallback = "N/A"
) =>
  value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : fallback;

export const toMono = (value: string | number | undefined | null, fallback = "N/A") =>
  toTitle(value, fallback);

export function getBadgeClasses(kind: "positive" | "negative" | "warning") {
  if (kind === "positive") return "bg-green-50 border-green-200 text-green-700";
  if (kind === "negative") return "bg-red-50 border-red-200 text-red-700";
  return "bg-yellow-50 border-yellow-200 text-yellow-700";
}

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 GB';
  const gb = bytes / (1024 * 1024);
  return gb.toFixed(decimals) + ' GB';
};

export const stripSpqPrefix = (value: string) => value.replace(/^SpQ\s*:\s*/i, "");
