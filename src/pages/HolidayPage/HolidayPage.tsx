import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCalendarDays, getLeaveStrategies, todayInChina, years, yearSources,
} from "../../utils/holidays";
import type { CalendarDay, DateType, LeaveStrategy } from "../../utils/holidays";
import LeavePlans from "./components/LeavePlans";
import YearCalendar, { dateLabels } from "./components/YearCalendar";
import "./HolidayPage.css";

const newestYear = years[0];
const oldestYear = years[years.length - 1];
const categories: DateType[] = ["holiday", "weekend", "workday-weekend", "workday"];

function requestedYear(currentYear: number) {
  const value = Number(new URLSearchParams(window.location.search).get("year"));
  if (years.includes(value)) return value;
  return Math.min(newestYear, Math.max(oldestYear, currentYear));
}

function YearWorkspace({ year, today }: { year: number; today: string }) {
  const days = useMemo(() => getCalendarDays(year), [year]);
  const plans = useMemo(() => getLeaveStrategies(days), [days]);
  const [activePlan, setActivePlan] = useState<LeaveStrategy>();
  const [selectedDay, setSelectedDay] = useState<CalendarDay>();
  const [view, setView] = useState<"calendar" | "plans">("calendar");
  const stats: Record<DateType, number> = { holiday: 0, weekend: 0, "workday-weekend": 0, workday: 0 };
  for (const { type } of days) stats[type]++;

  function showOnCalendar(plan: LeaveStrategy) {
    setView("calendar");
    const target = days.find(({ key }) => key === plan.leaveDates[0]);
    if (!target) return;
    setSelectedDay(target);
    window.requestAnimationFrame(() => {
      const button = document.getElementById(`date-${target.key}`);
      button?.focus({ preventScroll: true });
      button?.scrollIntoView({ block: "center" });
    });
  }

  return (
    <>
      <dl className="year-stats" aria-label={`${year}年日期统计`}>
        {categories.map((type) => (
          <div className="metric" key={type}>
            <dt><i className={`swatch swatch--${type}`} />{dateLabels[type]}</dt>
            <dd>{stats[type]}<small>天</small></dd>
          </div>
        ))}
      </dl>
      <div className="segmented view-switch" role="group" aria-label="查看日历或方案">
        <button type="button" aria-pressed={view === "calendar"} onClick={() => setView("calendar")}>全年日历</button>
        <button type="button" aria-pressed={view === "plans"} onClick={() => setView("plans")}>请假方案</button>
      </div>
      <div className="workspace" data-view={view}>
        <section className="panel calendar-panel" aria-labelledby="calendar-heading">
          <YearCalendar
            year={year}
            days={days}
            today={today}
            activePlan={activePlan}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
          />
        </section>
        <aside className="panel plans-panel" aria-labelledby="plans-heading">
          <LeavePlans
            plans={plans}
            today={today}
            canFilterUpcoming={String(year) === today.slice(0, 4)}
            activePlan={activePlan}
            onSelectPlan={setActivePlan}
            onShowOnCalendar={showOnCalendar}
          />
        </aside>
      </div>
    </>
  );
}

export default function HolidayPage() {
  const today = todayInChina();
  const currentYear = Number(today.slice(0, 4));
  const [year, setYear] = useState(() => requestedYear(currentYear));

  useEffect(() => {
    function syncYear() {
      setYear(requestedYear(currentYear));
    }
    window.addEventListener("popstate", syncYear);
    return () => window.removeEventListener("popstate", syncYear);
  }, [currentYear]);

  useEffect(() => {
    document.title = `${year} 年节假日历 · 中国大陆放假与调休`;
  }, [year]);

  function selectYear(next: number) {
    if (year === next || !years.includes(next)) return;
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(next));
    window.history.pushState(null, "", url);
    setYear(next);
  }

  const source = yearSources[year];
  const yearLength = new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
  return (
    <main className="shell holiday-app">
      <div className="year-banner">
        <div className="banner-art" aria-hidden="true" />
        <div className="banner-content">
          <h1><span>{year}</span> 年节假日</h1>
          <p>中国大陆 <span aria-hidden="true">·</span> 全年 {yearLength} 天</p>
          <div className="banner-controls">
            <div className="year-switch">
              <button
                type="button"
                aria-label="上一年"
                disabled={year === oldestYear}
                onClick={() => selectYear(year - 1)}
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <div className="year-select">
                <select aria-label="选择年份" value={year} onChange={(event) => selectYear(Number(event.target.value))}>
                  {years.map((option) => <option key={option} value={option}>{option} 年</option>)}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </div>
              <button
                type="button"
                aria-label="下一年"
                disabled={year === newestYear}
                onClick={() => selectYear(year + 1)}
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
            {year === currentYear && newestYear > currentYear && (
              <button className="newest-year" type="button" onClick={() => selectYear(newestYear)}>
                查看 {newestYear} 年 <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      <YearWorkspace year={year} today={today} key={year} />

      <footer className="app-footer">
        <span>涵盖 {oldestYear}–{newestYear} 年 <span aria-hidden="true">·</span> {import.meta.env.VITE_APP_VERSION}</span>
        <nav aria-label="相关链接">
          {source && <a href={source}>{year} 年放假通知 <ArrowUpRight size={13} aria-hidden="true" /></a>}
          <a href="https://xiaosang.cc/">小桑作品集 <ArrowUpRight size={13} aria-hidden="true" /></a>
        </nav>
      </footer>
    </main>
  );
}
