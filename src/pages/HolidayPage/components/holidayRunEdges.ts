import type { CalendarDay } from "../../../utils/holidays";

export function holidayRunEdges(days: CalendarDay[], includeWeekends: boolean): (string | undefined)[] {
  const edges: (string | undefined)[] = Array(days.length).fill(undefined);

  function belongsToRun(day: CalendarDay) {
    return day.type === "holiday" || (includeWeekends && day.type === "weekend");
  }

  let start = 0;
  while (start < days.length) {
    if (!belongsToRun(days[start])) {
      start++;
      continue;
    }
    let end = start;
    let includesHoliday = false;
    while (end < days.length && belongsToRun(days[end])) {
      includesHoliday ||= days[end].type === "holiday";
      end++;
    }
    if (includesHoliday) {
      for (let index = start; index < end; index++) {
        const day = days[index];
        const rowStart = day.date.getDay() === 1 || day.date.getDate() === 1;
        const rowEnd = day.date.getDay() === 0 || days[index + 1]?.date.getDate() === 1;
        const before = index > start ? (rowStart ? "continued-left" : "joined-left") : "";
        const after = index + 1 < end ? (rowEnd ? "continued-right" : "joined-right") : "";
        edges[index] = [before, after].filter(Boolean).join(" ");
      }
    }
    start = end;
  }
  return edges;
}
