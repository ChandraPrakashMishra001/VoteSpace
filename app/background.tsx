"use client";

import ElectricMist from "@/components/ui/electric-mist";

export function BackgroundEffect() {
  return (
    <div className="fixed inset-0 z-0">
      <ElectricMist color="#1a0a3c" speed={0.75} brightness={1.05} distortion={3.5} />
    </div>
  );
}
