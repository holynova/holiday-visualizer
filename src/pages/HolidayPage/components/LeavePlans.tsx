import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { LeaveStrategy } from "../../../utils/holidays";
import PlanCalendar from "./PlanCalendar";

const restingDate = (date: string) => format(parseISO(date), "M月d日");
const previewCount = 4;

interface LeavePlansProps {
  plans: LeaveStrategy[];
  today: string;
  canFilterUpcoming: boolean;
  activePlan?: LeaveStrategy;
  onSelectPlan: (plan: LeaveStrategy | undefined) => void;
  onShowOnCalendar: (plan: LeaveStrategy) => void;
}

export default function LeavePlans({
  plans, today, canFilterUpcoming, activePlan, onSelectPlan, onShowOnCalendar,
}: LeavePlansProps) {
  const [sort, setSort] = useState<"ratio" | "length">("ratio");
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function orderedPlans(order: typeof sort, upcoming: boolean) {
    const result = upcoming ? plans.filter(({ startDate }) => startDate >= today) : [...plans];
    if (order === "length") result.sort((a, b) => b.totalRestDays - a.totalRestDays || b.ratio - a.ratio);
    return result;
  }
  const ordered = orderedPlans(sort, showUpcoming);
  const preview = ordered.slice(0, previewCount);

  function updateOptions(order: typeof sort, upcoming: boolean) {
    setSort(order);
    setShowUpcoming(upcoming);
    setShowAll(false);
    if (activePlan && !orderedPlans(order, upcoming).slice(0, previewCount).includes(activePlan)) {
      onSelectPlan(undefined);
    }
  }

  function renderPlan(plan: LeaveStrategy) {
    const isActive = activePlan?.startDate === plan.startDate;
    const detailsId = `plan-${plan.startDate}`;
    return (
      <li className={`plan${isActive ? " plan--active" : ""}`} key={plan.startDate}>
        <button
          type="button"
          className="plan-summary"
          aria-expanded={isActive}
          aria-controls={detailsId}
          onClick={(event) => {
            const button = event.currentTarget;
            onSelectPlan(isActive ? undefined : plan);
            if (!isActive) {
              requestAnimationFrame(() => {
                if (button.getBoundingClientRect().top < 0) button.scrollIntoView({ block: "start" });
              });
            }
          }}
        >
          <span className="plan-title">{plan.label}</span>
          <span className="plan-totals">请 <b>{plan.leaveDays}</b> 天 <i>·</i> 连休 <b>{plan.totalRestDays}</b> 天</span>
          <span className="plan-range">{restingDate(plan.startDate)} — {restingDate(plan.endDate)}</span>
          <span className="plan-ratio">{plan.ratio} 倍</span>
          <ChevronRight className="plan-chevron" size={17} aria-hidden="true" />
        </button>
        <div className="plan-details" id={detailsId} hidden={!isActive}>
          {isActive && (
            <>
              <PlanCalendar plan={plan} />
              <button className="plan-jump" type="button" onClick={() => onShowOnCalendar(plan)}>
                在全年日历查看 <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </li>
    );
  }

  return (
    <>
      <div className="plans-head">
        <h2 id="plans-heading">请假方案</h2>
        <div className="segmented sort-options" role="group" aria-label="方案排序">
          <button type="button" aria-pressed={sort === "ratio"} onClick={() => sort !== "ratio" && updateOptions("ratio", showUpcoming)}>按效率</button>
          <button type="button" aria-pressed={sort === "length"} onClick={() => sort !== "length" && updateOptions("length", showUpcoming)}>按连休</button>
        </div>
      </div>
      {canFilterUpcoming && (
        <label className="plan-filter">
          <input type="checkbox" checked={showUpcoming} onChange={(event) => updateOptions(sort, event.target.checked)} />
          仅看未开始的方案
        </label>
      )}
      <ul className="plans-list" aria-label="优先方案">
        {preview.map(renderPlan)}
      </ul>
      {preview.length === 0 && <p className="plans-empty" role="status">该年份暂无符合条件的方案。</p>}
      {ordered.length > previewCount && (
        <button
          className="show-all"
          type="button"
          aria-expanded={showAll}
          aria-controls="more-plans"
          onClick={() => {
            if (showAll && activePlan && !preview.includes(activePlan)) {
              onSelectPlan(undefined);
            }
            setShowAll(!showAll);
          }}
        >
          {showAll ? "收起方案" : `查看全部 ${ordered.length} 个方案`}
          <ChevronDown className={showAll ? "rotate" : undefined} size={16} aria-hidden="true" />
        </button>
      )}
      <ul className="plans-list plans-list--more" id="more-plans" aria-label="更多方案" hidden={!showAll}>
        {showAll && ordered.slice(previewCount).map(renderPlan)}
      </ul>
    </>
  );
}
