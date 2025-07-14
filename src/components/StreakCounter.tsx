"use client";

import { Flame } from "lucide-react";

export function StreakCounter({ streak }: { streak: number }) {
  return (
    <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-400">
      <Flame className="h-8 w-8 text-amber-500" />
      <span>{streak} Day Streak</span>
    </div>
  );
}
