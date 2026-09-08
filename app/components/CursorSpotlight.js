"use client";

import React, { useEffect, useState } from "react";

export default function CursorSpotlight() {
  const [mousePosition, setMousePosition] = useState({ x: -500, y: -500 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
      // Also update CSS variables for dynamic CSS calculations
      document.documentElement.style.setProperty("--mouse-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--mouse-y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  if (!isClient) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-opacity duration-700">
      {/* Dynamic Cursor Reactive Spotlight */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-[110px] opacity-40 mix-blend-screen transition-transform duration-100 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.45) 0%, rgba(20, 184, 166, 0.25) 40%, transparent 70%)",
          transform: `translate3d(${mousePosition.x - 300}px, ${mousePosition.y - 300}px, 0)`
        }}
      />

      {/* Secondary Lagging Ambient Cloud (Creates depth and fluid tail) */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[130px] opacity-25 mix-blend-screen transition-transform duration-300 ease-out"
        style={{
          background: "radial-gradient(circle, rgba(14, 165, 233, 0.4) 0%, rgba(99, 102, 241, 0.2) 50%, transparent 75%)",
          transform: `translate3d(${mousePosition.x - 225}px, ${mousePosition.y - 225}px, 0)`
        }}
      />
    </div>
  );
}
