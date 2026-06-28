import React from "react";
import { Header } from "./components/Header/Header";
import HolidayPage from "./pages/HolidayPage/HolidayPage";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentKey="holiday" />
      <main className="pt-16 py-6">
        <HolidayPage />
      </main>
    </div>
  );
};

export default App;
