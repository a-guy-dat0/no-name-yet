"use client";

// Static flowing-line background inspired by the Apple "Hello" dark wallpaper.
// Deep dark base with thin glowing curves in purple, blue, and green.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
    >
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          {/* ── Colour gradients ── */}
          <linearGradient id="gPurpleBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="gBlueGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#2563eb" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gGreenCyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#059669" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gCyanPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id="gPurpleGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="gBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="gGreen" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#065f46" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          {/* ── Glow filter — blurred copy merged under the sharp stroke ── */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glowHeavy" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* ── Background ── */}
        <rect width="1440" height="900" fill="#050508" />

        {/* ── Soft ambient colour washes (no glow, just atmosphere) ── */}
        <ellipse cx="180"  cy="160"  rx="320" ry="200" fill="rgba(109,40,217,0.09)" filter="url(#softBlur)" />
        <ellipse cx="1260" cy="740"  rx="280" ry="180" fill="rgba(37,99,235,0.08)"  filter="url(#softBlur)" />
        <ellipse cx="900"  cy="820"  rx="260" ry="150" fill="rgba(5,150,105,0.07)"  filter="url(#softBlur)" />
        <ellipse cx="1380" cy="120"  rx="200" ry="130" fill="rgba(8,145,178,0.07)"  filter="url(#softBlur)" />

        {/* ═══════════════════════════════════════════════════════════════
            FLOWING LINES — thick accent curves first, then fine details
            ═══════════════════════════════════════════════════════════════ */}

        {/* — Wide sweeping arcs across upper half — */}
        <path d="M-60,220 C180,80  480,300  780,160 C1020,40  1260,200 1500,90"
              fill="none" stroke="url(#gPurpleBlue)" strokeWidth="1.8"
              opacity="0.75" filter="url(#glow)" />

        <path d="M-60,260 C220,140 520,340  820,200 C1060,80  1280,240 1500,140"
              fill="none" stroke="url(#gPurpleBlue)" strokeWidth="0.5"
              opacity="0.35" />

        <path d="M-60,310 C150,200 400,380  700,260 C950,160  1200,320 1500,210"
              fill="none" stroke="url(#gBlueGreen)" strokeWidth="1.4"
              opacity="0.60" filter="url(#glow)" />

        {/* — Curves crossing the center — */}
        <path d="M200,0 C320,220 480,120  620,400 C740,620 880,300  980,600 C1060,800 1180,420 1380,560"
              fill="none" stroke="url(#gPurpleGreen)" strokeWidth="1.6"
              opacity="0.55" filter="url(#glow)" />

        <path d="M60,0 C200,300 350,100  550,500 C700,750 900,350  1100,700 C1240,900 1380,580 1500,700"
              fill="none" stroke="url(#gBlueGreen)" strokeWidth="0.6"
              opacity="0.30" />

        <path d="M1440,200 C1200,350 900,180  680,420 C480,620 280,380  -60,500"
              fill="none" stroke="url(#gCyanPurple)" strokeWidth="1.5"
              opacity="0.60" filter="url(#glow)" />

        {/* — Lower sweeping arcs — */}
        <path d="M-60,680 C250,560 580,760  880,620 C1140,500 1320,680 1500,580"
              fill="none" stroke="url(#gGreenCyan)" strokeWidth="1.6"
              opacity="0.65" filter="url(#glow)" />

        <path d="M-60,730 C300,620 620,800  920,660 C1160,540 1340,720 1500,630"
              fill="none" stroke="url(#gGreenCyan)" strokeWidth="0.5"
              opacity="0.30" />

        <path d="M-60,620 C200,500 500,700  800,560 C1060,440 1260,640 1500,520"
              fill="none" stroke="url(#gBlue)" strokeWidth="0.8"
              opacity="0.40" />

        {/* — Tight accent loops — */}
        <path d="M300,0 C260,140 380,220  320,360 C260,480 160,380  200,560"
              fill="none" stroke="url(#gPurpleBlue)" strokeWidth="1.2"
              opacity="0.50" filter="url(#glow)" />

        <path d="M1100,900 C1060,740 1180,640 1120,480 C1060,320 960,420  1000,240"
              fill="none" stroke="url(#gGreen)" strokeWidth="1.3"
              opacity="0.55" filter="url(#glow)" />

        <path d="M700,900 C660,720 780,620  720,440 C660,280 560,380  600,180"
              fill="none" stroke="url(#gCyanPurple)" strokeWidth="0.9"
              opacity="0.40" />

        {/* — Ultra-fine ghost lines for depth — */}
        <path d="M-60,180 C300,60  700,260  1000,120 C1200,20  1380,180 1500,60"
              fill="none" stroke="#8b5cf6" strokeWidth="0.35" opacity="0.25" />

        <path d="M-60,340 C250,220 600,420  900,280 C1150,160 1320,340 1500,240"
              fill="none" stroke="#06b6d4" strokeWidth="0.35" opacity="0.20" />

        <path d="M-60,580 C280,460 620,660  920,520 C1160,400 1320,580 1500,460"
              fill="none" stroke="#10b981" strokeWidth="0.35" opacity="0.22" />

        <path d="M-60,780 C240,660 560,840  860,700 C1100,580 1300,760 1500,660"
              fill="none" stroke="#7c3aed" strokeWidth="0.35" opacity="0.20" />

        {/* — Bright highlight: one vivid line with heavy glow — */}
        <path d="M-60,400 C300,260 700,500  1000,340 C1200,220 1380,420 1500,300"
              fill="none" stroke="url(#gBlueGreen)" strokeWidth="2.2"
              opacity="0.55" filter="url(#glowHeavy)" />

        {/* — Right-side accent — */}
        <path d="M1440,0 C1380,180 1200,100 1060,320 C920,520 1040,620 880,820"
              fill="none" stroke="url(#gGreenCyan)" strokeWidth="1.4"
              opacity="0.50" filter="url(#glow)" />

        <path d="M1440,60 C1360,240 1180,160 1040,380 C900,580 1020,680 860,880"
              fill="none" stroke="url(#gGreenCyan)" strokeWidth="0.4"
              opacity="0.25" />
      </svg>
    </div>
  );
}
