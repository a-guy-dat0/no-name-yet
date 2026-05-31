"use client";

// Dark mesh gradient background.
// Each radial-gradient node fades to transparent so the near-black base
// bleeds through between them — colour only pools at the anchor points.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{
        zIndex: 0,
        backgroundColor: "#050508",
        backgroundImage: [
          // top-left  — purple
          "radial-gradient(ellipse 55% 50% at 8% 12%,   rgba(109,40,217,0.55)  0%, transparent 100%)",
          // top-right — blue
          "radial-gradient(ellipse 50% 45% at 90% 8%,   rgba(37,99,235,0.50)   0%, transparent 100%)",
          // bottom-left — green
          "radial-gradient(ellipse 50% 45% at 10% 90%,  rgba(5,150,105,0.50)   0%, transparent 100%)",
          // bottom-right — indigo
          "radial-gradient(ellipse 48% 42% at 92% 88%,  rgba(79,70,229,0.48)   0%, transparent 100%)",
          // center — cyan, smaller so darkness dominates mid-screen
          "radial-gradient(ellipse 35% 32% at 50% 52%,  rgba(8,145,178,0.38)   0%, transparent 100%)",
          // left-center — violet accent
          "radial-gradient(ellipse 30% 28% at 18% 50%,  rgba(139,92,246,0.30)  0%, transparent 100%)",
          // right-center — teal accent
          "radial-gradient(ellipse 28% 26% at 80% 55%,  rgba(6,182,212,0.28)   0%, transparent 100%)",
          // top-center — soft blue bridge
          "radial-gradient(ellipse 38% 22% at 50% 5%,   rgba(59,130,246,0.28)  0%, transparent 100%)",
          // bottom-center — green bridge
          "radial-gradient(ellipse 38% 22% at 50% 98%,  rgba(16,185,129,0.28)  0%, transparent 100%)",
        ].join(", "),
      }}
    />
  );
}
