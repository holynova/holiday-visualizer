import { eachDayOfInterval, endOfMonth, endOfYear, format, isWeekend, parseISO, startOfMonth } from "date-fns";
import holidays2016 from "./holidayData/2016.json";
import holidays2017 from "./holidayData/2017.json";
import holidays2018 from "./holidayData/2018.json";
import holidays2019 from "./holidayData/2019.json";
import holidays2020 from "./holidayData/2020.json";
import holidays2021 from "./holidayData/2021.json";
import holidays2022 from "./holidayData/2022.json";
import holidays2023 from "./holidayData/2023.json";
import holidays2024 from "./holidayData/2024.json";
import holidays2025 from "./holidayData/2025.json";
import holidays2026 from "./holidayData/2026.json";
import holidays2027 from "./holidayData/2027.json";

const schedules = {
  2016: holidays2016, 2017: holidays2017, 2018: holidays2018, 2019: holidays2019,
  2020: holidays2020, 2021: holidays2021, 2022: holidays2022, 2023: holidays2023,
  2024: holidays2024, 2025: holidays2025, 2026: holidays2026, 2027: holidays2027,
};
export const years = Object.keys(schedules).map(Number).reverse();
export const yearSources: Record<number, string | undefined> = {
  2026: "https://www.beijing.gov.cn/zhengce/zhengcefagui/202511/t20251104_4258873.html",
  2027: "https://chinajob.mohrss.gov.cn/h5/c/2026-11-09/635850.shtml",
};

export type DateType = "holiday" | "workday-weekend" | "weekend" | "workday";

const scheduledDays = new Map<string, { name: string; type: DateType; scheduleYear: string }>();
for (const [scheduleYear, schedule] of Object.entries(schedules)) {
  for (const { name, range, type } of schedule) {
    const [start, end = start] = range;
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) });
    for (const day of days) {
      scheduledDays.set(format(day, "yyyy-MM-dd"), {
        name,
        scheduleYear,
        type: type === "workingday" ? "workday-weekend" : "holiday",
      });
    }
  }
}

const chinaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function todayInChina(now = new Date()) {
  const parts = chinaDate.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  return [part("year"), part("month"), part("day")].join("-");
}

export interface CalendarDay {
  date: Date;
  key: string;
  type: DateType;
  name?: string;
}

function getDaysBetween(start: Date, end: Date): CalendarDay[] {
  return eachDayOfInterval({ start, end }).map((date) => {
    const key = format(date, "yyyy-MM-dd");
    const scheduled = scheduledDays.get(key);
    return {
      date,
      key,
      type: scheduled?.type ?? (isWeekend(date) ? "weekend" : "workday"),
      name: scheduled?.name,
    };
  });
}

export function getCalendarDays(year: number): CalendarDay[] {
  const start = new Date(year, 0, 1);
  return getDaysBetween(start, endOfYear(start));
}

export function getCalendarMonth(date: Date): CalendarDay[] {
  return getDaysBetween(startOfMonth(date), endOfMonth(date));
}

export interface LeaveStrategy {
  leaveDays: number;
  totalRestDays: number;
  startDate: string;
  endDate: string;
  leaveDates: string[];
  label: string;
  ratio: number;
}

export function getPlanMakeupDates({ startDate, endDate }: Pick<LeaveStrategy, "startDate" | "endDate">): string[] {
  const festivals = new Set<string>();
  for (const [key, { name, type, scheduleYear }] of scheduledDays) {
    if (type === "holiday" && key >= startDate && key <= endDate) {
      for (const festival of name.split("、")) festivals.add(`${scheduleYear}:${festival}`);
    }
  }
  return [...scheduledDays]
    .filter(([, { name, type, scheduleYear }]) =>
      type === "workday-weekend" && name.split("、").some((festival) => festivals.has(`${scheduleYear}:${festival}`)),
    )
    .map(([key]) => key);
}

type RestSegment = { start: number; end: number; label: string };

function isRest(day: CalendarDay) {
  return day.type === "holiday" || day.type === "weekend";
}

export function getLeaveStrategies(days: CalendarDay[]): LeaveStrategy[] {
  const segments: RestSegment[] = [];
  let start = 0;
  while (start < days.length) {
    if (!isRest(days[start])) {
      start++;
      continue;
    }
    let end = start + 1;
    while (end < days.length && isRest(days[end])) end++;
    const names = new Set(days.slice(start, end).map((day) => day.name ?? "周末"));
    segments.push({ start, end, label: [...names].join("、") });
    start = end;
  }

  const strategies: LeaveStrategy[] = [];
  for (let i = 1; i < segments.length; i++) {
    const previous = segments[i - 1];
    const next = segments[i];
    const leaveDays = next.start - previous.end;
    if (leaveDays > 5) continue;
    const totalRestDays = next.end - previous.start;
    strategies.push({
      leaveDays,
      totalRestDays,
      startDate: days[previous.start].key,
      endDate: days[next.end - 1].key,
      leaveDates: days.slice(previous.end, next.start).map(({ key }) => key),
      label: previous.label === next.label ? previous.label : `${previous.label} + ${next.label}`,
      ratio: Number((totalRestDays / leaveDays).toFixed(1)),
    });
  }
  return strategies.sort((a, b) => b.ratio - a.ratio || b.totalRestDays - a.totalRestDays);
}
