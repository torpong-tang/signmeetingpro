export function formatThaiDateTime(value?: string | Date | null) {
  if (!value) return "ยังไม่มีข้อมูล";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function formatThaiDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function formatBuddhistDateInput(value?: string | null) {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  const [, year, month, day] = match;
  return `${day}/${month}/${Number(year) + 543}`;
}

export function getBuddhistYear(value: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("th-TH-u-ca-buddhist-nu-latn", {
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).formatToParts(value);
  return Number(parts.find((part) => part.type === "year")?.value);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
