import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MoreSheet } from "./MoreSheet";
import { QuickAddFAB } from "./QuickAddFAB";

export function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop/Tablet sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onMoreClick={() => setMoreOpen(true)} />
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      {/* Global Quick Add FAB (mobile) */}
      <QuickAddFAB />
    </div>
  );
}
