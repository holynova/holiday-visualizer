import { ArrowUpRight, CalendarDays, Github } from "lucide-react";
import HolidayPage from "./pages/HolidayPage/HolidayPage";

const repository = "https://github.com/holynova/holiday-visualizer";

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="shell site-header-inner">
          <a className="brand" href={import.meta.env.BASE_URL}>
            <span className="brand-mark"><CalendarDays size={20} aria-hidden="true" /></span>
            <span>节假日历</span>
          </a>
          <a className="source-link" href={repository} aria-label="GitHub 源码">
            <Github size={18} aria-hidden="true" />
            <span>GitHub</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </header>
      <HolidayPage />
    </>
  );
}
