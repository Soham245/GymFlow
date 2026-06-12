import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MoreSheet } from "./MoreSheet";

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop/Tablet sidebar */}
      <Sidebar />

      {/* Main content — only this area scrolls on desktop */}
      <main className="min-w-0 flex-1 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}
