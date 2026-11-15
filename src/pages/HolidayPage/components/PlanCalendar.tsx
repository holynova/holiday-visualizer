import { useMemo, useRef, useState } from "react";
import { eachMonthOfInterval, format, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { X } from "lucide-react";
import { getCalendarMonth, getPlanMakeupDates } from "../../../utils/holidays";
import type { CalendarDay, LeaveStrategy } from "../../../utils/holidays";
import { dateLabels } from "./YearCalendar";
import "./PlanCalendar.css";

const weekdays = ["一", "二", "三", "四", "五", "六", "日"];
const formatDate = (key: string) => format(parseISO(key), "M月d日");

type PlanDay = CalendarDay & { status: "rest" | "leave" | "makeup" | "outside" };

function statusLabel(day: PlanDay) {
  if (day.status === "leave") return "需请假";
  if (day.status === "rest") return "休息";
  return dateLabels[day.type];
}

const dayMarks = { rest: "休", leave: "请", makeup: "班", outside: "" };

function inPlan(day: PlanDay) {
  return day.status === "rest" || day.status === "leave";
}

function dateDetail(day: PlanDay) {
  return [format(day.date, "M月d日 EEEE", { locale: zhCN }), statusLabel(day), day.name, day.status === "leave" && dateLabels[day.type]]
    .filter(Boolean).join(" · ");
}

interface DayProps {
  day: PlanDay;
  selectedDay?: PlanDay;
  onSelect: (day: PlanDay, button: HTMLButtonElement) => void;
}

function DayButton({ day, selectedDay, onSelect }: DayProps) {
  return (
    <button
      className="graphic-day"
      type="button"
      data-key={day.key}
      data-status={day.status}
      aria-label={dateDetail(day)}
      aria-pressed={selectedDay?.key === day.key}
      onClick={(event) => onSelect(day, event.currentTarget)}
    >
      <span>{day.date.getDate()}</span>
      <b aria-hidden="true">
        {dayMarks[day.status]}
        {day.status === "leave" && day.type === "workday-weekend" && (
          <span className="graphic-makeup-mark">班</span>
        )}
      </b>
    </button>
  );
}

type MonthProps = {
  months: PlanDay[][];
  planYear: string;
  selectedDay?: PlanDay;
  onSelect: (day: PlanDay, button: HTMLButtonElement) => void;
};

function PlanMonths({ months, planYear, selectedDay, onSelect }: MonthProps) {
  return (
    <div className="graphic-months">
      {months.map((days) => {
        const first = days[0];
        const left = (first.date.getDay() + 6) % 7;
        const rows = Math.ceil((left + days.length) / 7);
        const covered = days.filter(inPlan);
        const start = covered[0];
        const end = covered[covered.length - 1];
        return (
          <section className="graphic-month" key={first.key}>
            <header>
              <h3>{format(first.date, first.key.startsWith(planYear) ? "M月" : "yyyy年M月")}</h3>
              {start && end
                ? <span>{start.date.getDate()}–{end.date.getDate()} 日在连休区间内</span>
                : <span>相关调休补班</span>}
            </header>
            <table aria-label={format(first.date, "yyyy年M月")}>
              <thead>
                <tr>{weekdays.map((name) => <th key={name} scope="col" aria-label={`星期${name}`}>{name}</th>)}</tr>
              </thead>
              <tbody>
                {Array.from({ length: rows }, (_, row) => (
                  <tr key={row}>
                    {weekdays.map((weekday, col) => {
                      const index = row * 7 + col - left;
                      const day: PlanDay | undefined = days[index];
                      const status = day?.status;
                      const inside = day && inPlan(day);
                      const firstInRun = col === 0 || days[index - 1]?.status !== status;
                      const lastInRun = col === 6 || days[index + 1]?.status !== status;
                      return (
                        <td
                          key={weekday}
                          data-status={status}
                          data-edge-start={inside && firstInRun ? "" : undefined}
                          data-edge-end={inside && lastInRun ? "" : undefined}
                        >
                          {day && (status !== "outside"
                            ? <DayButton day={day} selectedDay={selectedDay} onSelect={onSelect} />
                            : <span className="graphic-context-day" data-date-type={day.type}>{day.date.getDate()}</span>)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}

export default function PlanCalendar({ plan }: { plan: LeaveStrategy }) {
  const [selectedDay, setSelectedDay] = useState<PlanDay>();
  const lastButton = useRef<HTMLButtonElement>();
  function inspectDay(day: PlanDay, button: HTMLButtonElement) {
    lastButton.current = button;
    setSelectedDay(day);
  }
  function closeInspector() {
    setSelectedDay(undefined);
    lastButton.current?.focus({ preventScroll: true });
  }
  const months = useMemo(() => {
    const leaveDates = new Set(plan.leaveDates);
    const coveredMonths = eachMonthOfInterval({ start: parseISO(plan.startDate), end: parseISO(plan.endDate) });
    const monthKeys = new Set(coveredMonths.map((month) => format(month, "yyyy-MM")));
    for (const key of getPlanMakeupDates(plan)) monthKeys.add(key.slice(0, 7));

    return [...monthKeys].sort().map((key) => getCalendarMonth(parseISO(key + "-01")).map((day): PlanDay => {
      if (day.key >= plan.startDate && day.key <= plan.endDate) {
        return { ...day, status: leaveDates.has(day.key) ? "leave" : "rest" };
      }
      return { ...day, status: day.type === "workday-weekend" ? "makeup" : "outside" };
    }));
  }, [plan]);
  const hasMakeup = months.some((month) => month.some((day) => day.type === "workday-weekend"));

  return (
    <div className="plan-graphic">
      <div className="graphic-summary">
        <p><b>请假日期</b> {plan.leaveDates.map(formatDate).join("、")}</p>
        <div className="graphic-legend" role="group" aria-label="连休色带图例">
          <span data-status="rest"><i aria-hidden="true">休</i> 已安排休息</span>
          <span data-status="leave"><i aria-hidden="true">请</i> 需请假</span>
          {hasMakeup && <span data-status="makeup"><i aria-hidden="true">班</i> 调休补班</span>}
        </div>
      </div>
      <PlanMonths months={months} planYear={plan.startDate.slice(0, 4)} selectedDay={selectedDay} onSelect={inspectDay} />
      <div className="graphic-inspector" hidden={!selectedDay}>
        <span role="status">{selectedDay ? dateDetail(selectedDay) : ""}</span>
        <button className="icon-button" type="button" onClick={closeInspector} aria-label="关闭方案日期详情">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
