import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

const BACKGROUND_COLOR = "#0a0a0a";
const ACCENT_COLOR = "#00ff00";

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Main text animation
  const textSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const textOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Button animation
  const buttonSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15 },
  });

  const buttonOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // URL animation
  const urlOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Glow pulse
  const glowIntensity = 0.3 + Math.sin(frame * 0.1) * 0.2;

  // Particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    x: Math.sin(i * 0.5 + frame * 0.02) * 300 + 960,
    y: Math.cos(i * 0.7 + frame * 0.015) * 200 + 540,
    size: 2 + Math.sin(i + frame * 0.05) * 1,
    opacity: 0.3 + Math.sin(i * 0.3 + frame * 0.03) * 0.2,
  }));

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Background particles */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size * 4,
            height: p.size * 4,
            borderRadius: "50%",
            backgroundColor: i % 2 === 0 ? ACCENT_COLOR : "#00aaff",
            opacity: p.opacity * 0.3,
            filter: "blur(2px)",
          }}
        />
      ))}

      {/* Main content */}
      <div
        style={{
          textAlign: "center",
          transform: `scale(${textSpring})`,
          opacity: textOpacity,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 80,
            fontWeight: "bold",
            color: "#ffffff",
            margin: 0,
            textShadow: `0 0 40px rgba(255, 255, 255, 0.3)`,
          }}
        >
          Ready to Connect?
        </h1>
      </div>

      {/* CTA Button */}
      <div
        style={{
          marginTop: 50,
          transform: `scale(${buttonSpring})`,
          opacity: buttonOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "20px 60px",
            backgroundColor: ACCENT_COLOR,
            borderRadius: 50,
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            boxShadow: `0 0 60px rgba(0, 255, 0, ${glowIntensity})`,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: "bold",
              color: "#000",
            }}
          >
            Install Now
          </span>
          <span style={{ fontSize: 28 }}>→</span>
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          marginTop: 40,
          opacity: urlOpacity,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 24px",
            backgroundColor: "#1a1a1a",
            borderRadius: 30,
            border: "1px solid #333",
          }}
        >
          <span style={{ fontSize: 20 }}>🌐</span>
          <span
            style={{
              fontSize: 24,
              color: ACCENT_COLOR,
              fontFamily: "monospace",
              fontWeight: "500",
            }}
          >
            moltbook.com
          </span>
        </div>
      </div>

      {/* Logo watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 12,
          opacity: urlOpacity,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: ACCENT_COLOR,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 18 }}>🦞</span>
        </div>
        <span
          style={{
            color: "#666",
            fontSize: 18,
            fontWeight: "600",
          }}
        >
          Molt Connect
        </span>
      </div>
    </AbsoluteFill>
  );
};
