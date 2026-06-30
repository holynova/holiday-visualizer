import React, { useEffect, useState } from "react";
import ContributionGraph from "./components/ContributionGraph";
import { getDateType, getLeaveStrategies } from "../../utils/holidays";
import { eachDayOfInterval, startOfYear, endOfYear } from "date-fns";
import "./HolidayPage.scss";

interface YearStats {
  year: number;
  totalDays: number;
  holidayDays: number;
  workdayWeekendDays: number;
  weekendDays: number;
  workDays: number;
}

const HolidayPage: React.FC = () => {
  const [yearStats, setYearStats] = useState<YearStats[]>([]);
  const [hoveredStrategy, setHoveredStrategy] = useState<{ [year: number]: any | null }>({});
  const [lockedStrategy, setLockedStrategy] = useState<{ [year: number]: any | null }>({});
  const [expandedYears, setExpandedYears] = useState<{ [year: number]: boolean }>({});

  useEffect(() => {
    // 生成 2016-2026 年的年份数组（倒序）
    const years = Array.from({ length: 11 }, (_, i) => 2026 - i);

    // 计算每年的统计数据
    const stats = years.map((year) => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 0, 1));
      const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

      let holidayDays = 0;
      let workdayWeekendDays = 0;
      let weekendDays = 0;
      let workDays = 0;

      allDays.forEach((date) => {
        const dateType = getDateType(date);
        switch (dateType) {
          case "holiday":
            holidayDays++;
            break;
          case "workday-weekend":
            workdayWeekendDays++;
            break;
          case "weekend":
            weekendDays++;
            break;
          case "workday":
            workDays++;
            break;
        }
      });

      return {
        year,
        totalDays: allDays.length,
        holidayDays,
        workdayWeekendDays,
        weekendDays,
        workDays,
      };
    });

    setYearStats(stats);
  }, []);

  return (
    <div className="holiday-page">
      <div className="holiday-page__header">
        <h1>节假日日历</h1>
      </div>
      <div className="holiday-page__content">
        {yearStats.map(
          ({
            year,
            totalDays,
            holidayDays,
            workdayWeekendDays,
            weekendDays,
            workDays,
          }) => (
            <div key={year} className="holiday-page__year-section">
              <div className="holiday-page__year-header">
                <h2>{year}年</h2>
                <div className="holiday-page__stats">
                  <span>全年天数：{totalDays}天</span>
                  <span>法定假日：{holidayDays}天</span>
                  <span>调休工作日：{workdayWeekendDays}天</span>
                  <span>普通周末：{weekendDays}天</span>
                  <span>普通工作日：{workDays}天</span>
                </div>
              </div>
              <ContributionGraph
                year={year}
                highlightedRange={
                  (hoveredStrategy[year] || lockedStrategy[year])
                    ? {
                        start: (hoveredStrategy[year] || lockedStrategy[year])!.startDate,
                        end: (hoveredStrategy[year] || lockedStrategy[year])!.endDate,
                      }
                    : null
                }
                leaveDates={(hoveredStrategy[year] || lockedStrategy[year]) ? (hoveredStrategy[year] || lockedStrategy[year])!.leaveDates : []}
              />
              
              {(() => {
                const strategies = getLeaveStrategies(year);
                if (strategies.length === 0) return null;
                const isExpanded = !!expandedYears[year];
                const displayedStrategies = isExpanded ? strategies : strategies.slice(0, 4);

                return (
                  <div className="holiday-page__strategies-section">
                    <h3 className="holiday-page__strategies-title">💡 最佳请假攻略</h3>
                    <div className="holiday-page__strategies-grid">
                      {displayedStrategies.map((strat, idx) => {
                        const isHovered = hoveredStrategy[year]?.startDate === strat.startDate;
                        const isLocked = lockedStrategy[year]?.startDate === strat.startDate;
                        const isActive = isHovered || isLocked;

                        return (
                          <div
                            key={idx}
                            className={`holiday-page__strategy-card ${isActive ? "holiday-page__strategy-card--active" : ""}`}
                            onMouseEnter={() => setHoveredStrategy(prev => ({ ...prev, [year]: strat }))}
                            onMouseLeave={() => setHoveredStrategy(prev => ({ ...prev, [year]: null }))}
                            onClick={() => {
                              setLockedStrategy(prev => {
                                const current = prev[year];
                                if (current && current.startDate === strat.startDate) {
                                  return { ...prev, [year]: null };
                                }
                                return { ...prev, [year]: strat };
                              });
                            }}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="holiday-page__strategy-badge">
                              <span className="strategy-tag">请 {strat.leaveDays} 休 {strat.totalRestDays} 天</span>
                              <span className="strategy-ratio">放大 {strat.ratio} 倍</span>
                            </div>
                            <div className="holiday-page__strategy-label">{strat.label}</div>
                            <div className="holiday-page__strategy-dates">
                              <div className="range">{strat.startDate} 至 {strat.endDate}</div>
                              <div className="leave-days">
                                请假日期: {strat.leaveDates.map(d => d.substring(5).split("-").map(Number).join("月") + "日").join(", ")}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {strategies.length > 4 && (
                      <div className="holiday-page__strategies-expand-bar">
                        <button
                          onClick={() => setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }))}
                          className="holiday-page__expand-btn"
                        >
                          {isExpanded ? "收起部分方案" : `展开更多方案 (${strategies.length - 4}个)`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default HolidayPage;
