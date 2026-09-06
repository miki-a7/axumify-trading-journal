/**
 * Centralized Date Formatting & Calendar Conversion Utility for AXUMIFY
 * Handles Gregorian (GC) and Ethiopian (EC) calendars with UTC date safety.
 */

export type CalendarMode = "GC" | "EC";

export const ETHIOPIAN_MONTHS = [
  "መስከረም", "ጥቅምት", "ኅዳር", "ታኅሣሥ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሃሴ", "ጳጉሜ"
] as const;

export const ETHIOPIAN_WEEKDAYS = [
  "እሑድ", // 0: Sunday
  "ሰኞ",   // 1: Monday
  "ማክሰኞ", // 2: Tuesday
  "ረቡዕ", // 3: Wednesday
  "ሐሙስ", // 4: Thursday
  "ዓርብ",  // 5: Friday
  "ቅዳሜ"  // 6: Saturday
] as const;

export const GREGORIAN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export const GREGORIAN_WEEKDAYS = [
  "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
] as const;

/**
 * Returns safe YYYY-MM-DD in UTC
 */
export function getUTCDateString(dateInput?: string | Date | null): string {
  if (!dateInput) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  const dt = new Date(dateInput);
  if (isNaN(dt.getTime())) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
  }
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Convert Gregorian date to Julian Day Number (JDN)
 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

/**
 * Convert JDN to Gregorian { year, month, day }
 */
export function jdnToGregorian(jdn: number): { year: number; month: number; day: number } {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return { year, month, day };
}

/**
 * Get the Gregorian date (JDN) of Meskerem 1 for a given Ethiopian Year (EY).
 * Ethiopian New Year (Meskerem 1) falls on September 11 in a regular year,
 * and September 12 the year BEFORE a Gregorian leap year.
 * Correct rule: Meskerem 1 = Sept 12 when (ethYear + 1) % 4 === 0, else Sept 11.
 */
export function getMeskerem1JDN(ethYear: number): number {
  const gregYear = ethYear + 7;
  // The year BEFORE a Gregorian leap year starts on Sept 12
  const day = (ethYear + 1) % 4 === 0 ? 12 : 11;
  return gregorianToJDN(gregYear, 9, day);
}

export interface EthiopianDateResult {
  year: number;
  month: number;
  day: number;
  monthName: string;
  weekdayName: string;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  formatted: string; // e.g. "ነሃሴ 29 ቅዳሜ"
}

/**
 * Convert Gregorian date to Ethiopian date object
 */
export function gregorianToEthiopian(dateInput?: string | Date | null): EthiopianDateResult {
  const dateStr = getUTCDateString(dateInput);
  const [yStr, mStr, dStr] = dateStr.split("-");
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const d = parseInt(dStr, 10);

  const jdn = gregorianToJDN(y, m, d);
  const dow = (jdn + 1) % 7;

  let ethYear = y - 8;
  let mesk1Jdn = getMeskerem1JDN(ethYear);

  if (jdn < mesk1Jdn) {
    ethYear--;
    mesk1Jdn = getMeskerem1JDN(ethYear);
  } else {
    const nextMesk1Jdn = getMeskerem1JDN(ethYear + 1);
    if (jdn >= nextMesk1Jdn) {
      ethYear++;
      mesk1Jdn = nextMesk1Jdn;
    }
  }

  const daysDiff = jdn - mesk1Jdn;
  const ethMonth = Math.floor(daysDiff / 30) + 1;
  const ethDay = (daysDiff % 30) + 1;

  const monthName = ETHIOPIAN_MONTHS[ethMonth - 1] || "መስከረም";
  const weekdayName = ETHIOPIAN_WEEKDAYS[dow] || "ቅዳሜ";

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthName,
    weekdayName,
    dayOfWeek: dow,
    formatted: `${monthName} ${ethDay} ${weekdayName}`
  };
}

/**
 * Convert Ethiopian date back to Gregorian date object
 */
export function ethiopianToGregorian(ethYear: number, ethMonth: number, ethDay: number): {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  dateStr: string; // YYYY-MM-DD
} {
  const mesk1Jdn = getMeskerem1JDN(ethYear);
  const targetJdn = mesk1Jdn + (ethMonth - 1) * 30 + (ethDay - 1);
  const greg = jdnToGregorian(targetJdn);
  const dow = (targetJdn + 1) % 7;

  const mm = String(greg.month).padStart(2, "0");
  const dd = String(greg.day).padStart(2, "0");
  const yyyy = String(greg.year);

  return {
    year: greg.year,
    month: greg.month,
    day: greg.day,
    dayOfWeek: dow,
    dateStr: `${yyyy}-${mm}-${dd}`
  };
}

/**
 * Compact Gregorian date format: MM/DD/YY (e.g. 09/05/26 for September 5, 2026)
 */
export function formatGregorianDate(dateInput?: string | Date | null): string {
  const dateStr = getUTCDateString(dateInput);
  const parts = dateStr.split("-");
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const yy = y.slice(-2);
  return `${m}/${d}/${yy}`;
}

/**
 * Full Ethiopian date format: Month Day Weekday (e.g. "ነሃሴ 29 ቅዳሜ")
 */
export function formatEthiopianDate(dateInput?: string | Date | null): string {
  const eth = gregorianToEthiopian(dateInput);
  return eth.formatted;
}

/**
 * Unified journal date formatter supporting GC & EC
 */
export function formatJournalDate(dateInput?: string | Date | null, mode: "GC" | "EC" = "GC"): string {
  if (mode === "EC") {
    return formatEthiopianDate(dateInput);
  }
  return formatGregorianDate(dateInput);
}

/**
 * Returns number of days in an Ethiopian month (1-12 have 30 days; 13 (Pagume) has 5 or 6)
 */
export function getDaysInEthiopianMonth(ethYear: number, ethMonth: number): number {
  if (ethMonth >= 1 && ethMonth <= 12) return 30;
  // Pagume (month 13) has 6 days in leap years (when ethYear % 4 === 3)
  return ethYear % 4 === 3 ? 6 : 5;
}

/**
 * Get ISO Week string helper (e.g. 2026-W36) using UTC
 */
export function getISOWeekKey(dateInput: Date | string): string {
  const dateStr = getUTCDateString(dateInput);
  const parts = dateStr.split("-").map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
