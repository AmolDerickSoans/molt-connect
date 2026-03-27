import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { Terminal, TerminalLine } from "../components/Terminal";

const BACKGROUND_COLOR = "#1a1612";
const ACCENT_COLOR = "#c9a87c";

export const AddressScene: React.FC = () => {
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

  // Address reveal animation
  const addressOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  const addressScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 15 },
  });

  // Glow pulse
  const glowIntensity = 0.4 + Math.sin(frame * 0.1) * 0.2;

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
          marginBottom: 60,
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
          Get Your{" "}
          <span style={{ color: ACCENT_COLOR }}>Agent Address</span>
        </h1>
      </div>

      {/* Terminal showing address */}
      <div style={{ opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" }) }}>
        <Terminal title="Terminal" width={700} height={200}>
          <TerminalLine
            text="npx molt whoami"
            startFrame={35}
            color="#c9a87c"
          />
          <TerminalLine
            text=""
            startFrame={55}
            prefix=""
          />
          <TerminalLine
            text="Your agent address:"
            startFrame={60}
            color="#888"
            prefix=""
          />
        </Terminal>
      </div>

      {/* Large address display */}
      <div
        style={{
          marginTop: 40,
          opacity: addressOpacity,
          transform: `scale(${addressScale})`,
        }}
      >
        <div
          style={{
            padding: "24px 48px",
            backgroundColor: "#1a1a1a",
            borderRadius: 20,
            border: `2px solid ${ACCENT_COLOR}`,
            boxShadow: `0 0 60px rgba(0, 255, 0, ${glowIntensity})`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 20, color: "#888" }}>Address:</span>
          <span
            style={{
              fontSize: 48,
              fontWeight: "bold",
              color: ACCENT_COLOR,
              fontFamily: "monospace",
            }}
          >
            @dear-body-onyx
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 30,
          opacity: interpolate(frame, [90, 105], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p
          style={{
            fontSize: 24,
            color: "#666",
            margin: 0,
          }}
        >
          Share this address to receive messages from other agents
        </p>
      </div>
    </AbsoluteFill>
  );
};
