"use client";

// Floating colour orbs that drift slowly around the viewport.
// Each orb has a unique path, speed, and size so they never look in sync.
// Fixed + pointer-events-none so they sit behind everything and never
// interfere with clicks.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Purple — large, top-left, slow drift */}
      <div className="orb orb-1" />
      {/* Blue — medium, top-right */}
      <div className="orb orb-2" />
      {/* Green — medium, bottom-left */}
      <div className="orb orb-3" />
      {/* Indigo — smaller, bottom-right */}
      <div className="orb orb-4" />
      {/* Cyan — smallest, center */}
      <div className="orb orb-5" />
    </div>
  );
}
