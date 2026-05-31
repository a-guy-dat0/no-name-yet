"use client";

// Fluid colour background using SVG feTurbulence + feDisplacementMap.
// The filter warps the colour blobs into aurora/lava-lamp shapes.
// Animating baseFrequency makes the distortion pattern itself shift over time.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* SVG filter definition — hidden, just registers #fluid in the DOM */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="fluid" x="-30%" y="-30%" width="160%" height="160%">
            {/* Fractal noise whose frequency slowly shifts — drives the warp */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.0035"
              numOctaves="2"
              seed="12"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.0025;0.005;0.0035;0.002;0.0025"
                dur="22s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            {/* Displace source graphic using the noise channels */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="320"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Blobs container — extends beyond viewport so warped edges don't clip */}
      <div
        style={{
          filter: "url(#fluid)",
          position: "absolute",
          inset: "-25%",
          width: "150%",
          height: "150%",
        }}
      >
        {/* Purple — top-left */}
        <div className="flow-blob" style={{
          width: "65%", height: "65%",
          left: "0%", top: "0%",
          background: "rgba(120,40,230,0.70)",
          animation: "drift-1 26s ease-in-out infinite",
        }} />

        {/* Blue — top-right */}
        <div className="flow-blob" style={{
          width: "55%", height: "55%",
          right: "0%", top: "5%",
          background: "rgba(37,99,235,0.65)",
          animation: "drift-2 21s ease-in-out infinite",
        }} />

        {/* Green — bottom-left */}
        <div className="flow-blob" style={{
          width: "52%", height: "52%",
          left: "5%", bottom: "0%",
          background: "rgba(5,150,105,0.62)",
          animation: "drift-3 24s ease-in-out infinite",
        }} />

        {/* Indigo — bottom-right */}
        <div className="flow-blob" style={{
          width: "50%", height: "50%",
          right: "5%", bottom: "5%",
          background: "rgba(79,70,229,0.62)",
          animation: "drift-4 18s ease-in-out infinite",
        }} />

        {/* Cyan — center, drifts around */}
        <div className="flow-blob" style={{
          width: "42%", height: "42%",
          left: "30%", top: "28%",
          background: "rgba(8,145,178,0.55)",
          animation: "drift-5 15s ease-in-out infinite",
        }} />

        {/* Violet accent — wanders diagonally */}
        <div className="flow-blob" style={{
          width: "38%", height: "38%",
          left: "55%", top: "40%",
          background: "rgba(139,92,246,0.50)",
          animation: "drift-6 19s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}
