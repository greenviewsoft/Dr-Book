// Date/time helpers — all "today"/calendar math uses Asia/Dhaka to avoid UTC off-by-one.

const TZ = "Asia/Dhaka";

export function todayISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// iso "YYYY-MM-DD" -> "sun".."sat"
export function weekdayKey(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][dt.getUTCDay()];
}

// Approximate time for a 1-based serial: startTime + (serial-1)*slotMinutes -> "HH:MM"
export function computeDisplayTime(startTime, serial, slotMinutes) {
  if (!startTime) return "";
  const [h, m] = startTime.split(":").map(Number);
  const total = h * 60 + m + (serial - 1) * (slotMinutes || 1);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatLongDate(iso, lang) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Converts a 24h "HH:MM" to a 12h display (e.g. "10:00 AM") in the given locale.
export function formatTime(time24, lang) {
  if (!time24) return "";
  const [h, m] = time24.split(":").map(Number);
  const dt = new Date(Date.UTC(1970, 0, 1, h, m));
  return dt.toLocaleTimeString(lang === "bn" ? "bn-BD" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
}
