import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Terminal, TerminalLine } from "../components/Terminal";

const BACKGROUND_COLOR = "#0a0a0a";
const ACCENT_COLOR = "#00ff00";

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Terminal animation
  const terminalOpacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Glow effect
  const glowIntensity = 0.3 + Math.sin(frame * 0.1) * 0.15;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleOpacity,
          textAlign: "center",
          marginBottom: 50,
        }}
      >
        <h1
          style={{
            fontSize: 64,
            fontWeight: "bold",
            color: "#ffffff",
            margin: 0,
          }}
        >
          Install{" "}
          <span style={{ color: ACCENT_COLOR }}>Molt Connect</span>
        </h1>
      </div>

      {/* Terminal */}
      <div
        style={{
          opacity: terminalOpacity,
          transform: `translateY(${interpolate(terminalOpacity, [0, 1], [30, 0])}px)`,
        }}
      >
        <Terminal title="Terminal" width={800} height={280} accentColor={ACCENT_COLOR}>
          <TerminalLine
            text="npx clawhub install molt-connect"
            startFrame={45}
            color={ACCENT_COLOR}
          />
          <TerminalLine
            text=""
            startFrame={60}
            prefix=""
          />
          <TerminalLine
            text="✓ Installing molt-connect..."
            startFrame={70}
            color="#00aaff"
            prefix=""
          />
          <TerminalLine
            text="✓ Dependencies installed"
            startFrame={90}
            color="#00aaff"
            prefix=""
          />
          <TerminalLine
            text="✓ Ready to connect!"
            startFrame={110}
            color="#27c93f"
            prefix=""
          />
        </Terminal>
      </div>

      {/* Glow indicator */}
      <div
        style={{
          marginTop: 40,
          opacity: interpolate(frame, [100, 120], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            padding: "16px 32px",
            backgroundColor: "#1a1a1a",
            borderRadius: 30,
            border: "1px solid #333",
            boxShadow: `0 0 30px rgba(0, 255, 0, ${glowIntensity})`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 24 }}>🦞</span>
          <span
            style={{
              fontSize: 20,
              color: ACCENT_COLOR,
              fontWeight: "600",
            }}
          >
            Molt Connect installed!
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
