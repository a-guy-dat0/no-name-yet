"use client";

// Animated mesh gradient — 7 colour nodes drift independently via
// CSS @property + @keyframes. Each node animates its own x/y position
// inside the radial-gradient() so colours flow smoothly with no lines or orbs.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="mesh-bg pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    />
  );
}
