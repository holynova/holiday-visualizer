import { useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarDays, X } from "lucide-react";
import type { CalendarDay, DateType, LeaveStrategy } from "../../../utils/holidays";
import { holidayRunEdges } from "./holidayRunEdges";

export const dateLabels: Record<DateType, string> = {
  holiday: "节日放假",
  weekend: "普通周末",
  "workday-weekend": "调休补班",
  workday: "普通工作日",
};

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const arrowSteps: Record<string, number | undefined> = {
  ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
};

interface YearCalendarProps {
  year: number;
  days: CalendarDay[];
  today: string;
  activePlan?: LeaveStrategy;
  selectedDay?: CalendarDay;
  onSelectDay: (day?: CalendarDay) => void;
  outline?: "connected" | "holidays" | "off";
}

export default function YearCalendar({
  year, days, today, activePlan, selectedDay, onSelectDay, outline = "connected",
}: YearCalendarProps) {
  const [focusedDay, setFocusedDay] = useState(days[0].key);
  const months = useMemo(() => {
    const buckets: CalendarDay[][] = Array.from({ length: 12 }, () => []);
    for (const day of days) buckets[day.date.getMonth()].push(day);
    return buckets;
  }, [days]);
  const outlines = useMemo(() => {
    const byDate = new Map<string, string>();
    if (outline === "off") return byDate;
    const edges = holidayRunEdges(days, outline === "connected");
    days.forEach(({ key }, index) => {
      const edge = edges[index];
      if (edge !== undefined) byDate.set(key, edge);
    });
    return byDate;
  }, [days, outline]);
  const leaveDates = useMemo(() => new Set(activePlan?.leaveDates), [activePlan]);

  function planStatus(key: string) {
    if (!activePlan || key < activePlan.startDate || key > activePlan.endDate) return;
    return leaveDates.has(key) ? "leave" : "rest";
  }

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, day: CalendarDay) {
    const step = arrowSteps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const index = days.indexOf(day);
    const target = days[index + step];
    if (target) document.getElementById(`date-${target.key}`)?.focus();
  }

  function renderDay(day: CalendarDay) {
    const status = planStatus(day.key);
    const detail = [format(day.date, "M月d日 EEEE", { locale: zhCN }), day.name, dateLabels[day.type]];
    if (status) detail.push(status === "leave" ? "方案需请假" : "方案内休息");
    return (
      <button
        className={`day day--${day.type}${status ? ` day--plan-${status}` : ""}`}
        id={`date-${day.key}`}
        data-run-edges={outlines.get(day.key)}
        aria-label={detail.filter(Boolean).join("，")}
        title={detail.filter(Boolean).join(" · ")}
        aria-current={day.key === today ? "date" : undefined}
        aria-pressed={selectedDay?.key === day.key}
        tabIndex={day.key === focusedDay ? 0 : -1}
        type="button"
        onFocus={() => setFocusedDay(day.key)}
        onKeyDown={(event) => moveFocus(event, day)}
        onClick={() => onSelectDay(day)}
      >
        {day.date.getDate()}
      </button>
    );
  }

  return (
    <>
      <div className="calendar-head">
        <h2 id="calendar-heading">全年日历</h2>
        <ul className="calendar-legend" aria-label="日历图例">
          {Object.entries(dateLabels).map(([type, label]) => (
            <li key={type}><i className={`swatch swatch--${type}`} />{label}</li>
          ))}
          {activePlan && (
            <>
              <li><i className="swatch swatch--plan-rest" />方案内休息</li>
              <li><i className="swatch swatch--leave" />需请假</li>
            </>
          )}
        </ul>
      </div>
      <div className="day-announcer" role="status">
        {selectedDay && (
          <div className="day-inspector">
            <CalendarDays size={17} aria-hidden="true" />
            <div className="day-inspector-text">
              <strong>{format(selectedDay.date, "M月d日 EEEE", { locale: zhCN })}</strong>
              <span>{selectedDay.name && `${selectedDay.name} · `}{dateLabels[selectedDay.type]}
                {planStatus(selectedDay.key) === "leave" && " · 方案需请假"}
              </span>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="关闭日期详情"
              onClick={() => {
                onSelectDay();
                document.getElementById(`date-${selectedDay.key}`)?.focus({ preventScroll: true });
              }}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <div className={outline === "off" ? "months" : "months months--outline"}>
        {months.map((month, index) => {
          const offset = (month[0].date.getDay() + 6) % 7;
          const holidays = new Set(month.filter(({ type }) => type === "holiday").map(({ name }) => name));
          const holidayNames = [...holidays].filter(Boolean).join(" · ");
          return (
            <section className="month" key={index}>
              <h3>
                <span><b>{index + 1}</b>月</span>
                {holidayNames && <small>{holidayNames}</small>}
              </h3>
              <table aria-label={`${year}年${index + 1}月`}>
                <thead>
                  <tr>{weekdays.map((day) => <th scope="col" key={day} aria-label={`星期${day}`}>{day}</th>)}</tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, row) => (
                    <tr key={row}>
                      {weekdays.map((weekday, column) => {
                        const day = month[row * 7 + column - offset];
                        return <td key={weekday}>{day && renderDay(day)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </>
  );
}
