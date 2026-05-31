"use client";

// Fluid colour background — SVG warp filter over sparse colour blobs.
// Blobs are intentionally small and low-opacity so the dark base shows
// through in large organic dark patches between them.

export default function DynamicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* SVG filter — warps circles into flowing organic shapes */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="fluid" x="-40%" y="-40%" width="180%" height="180%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.004"
              numOctaves="2"
              seed="7"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.003;0.006;0.004;0.0025;0.003"
                dur="24s"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="280"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* Blobs — sparse and semi-transparent so dark gaps are prominent */}
      <div
        style={{
          filter: "url(#fluid)",
          position: "absolute",
          inset: "-30%",
          width: "160%",
          height: "160%",
        }}
      >
        {/* Purple — upper-left corner only */}
        <div className="flow-blob" style={{
          width: "38%", height: "38%",
          left: "4%", top: "4%",
          background: "rgba(120,40,230,0.42)",
          animation: "drift-1 28s ease-in-out infinite",
        }} />

        {/* Blue — upper-right */}
        <div className="flow-blob" style={{
          width: "32%", height: "32%",
          right: "6%", top: "8%",
          background: "rgba(37,99,235,0.38)",
          animation: "drift-2 22s ease-in-out infinite",
        }} />

        {/* Green — lower-left */}
        <div className="flow-blob" style={{
          width: "30%", height: "30%",
          left: "8%", bottom: "6%",
          background: "rgba(5,150,105,0.36)",
          animation: "drift-3 25s ease-in-out infinite",
        }} />

        {/* Indigo — lower-right */}
        <div className="flow-blob" style={{
          width: "28%", height: "28%",
          right: "8%", bottom: "8%",
          background: "rgba(79,70,229,0.36)",
          animation: "drift-4 19s ease-in-out infinite",
        }} />

        {/* Cyan — mid-left, wanders */}
        <div className="flow-blob" style={{
          width: "22%", height: "22%",
          left: "38%", top: "42%",
          background: "rgba(8,145,178,0.32)",
          animation: "drift-5 16s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}
