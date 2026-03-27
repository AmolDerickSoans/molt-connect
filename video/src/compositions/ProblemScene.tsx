import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

const BACKGROUND_COLOR = "#0a0a0a";
const ACCENT_COLOR = "#00ff00";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleScale = interpolate(titleSpring, [0, 1], [0.8, 1]);
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Subtitle animation
  const subtitleSpring = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200 },
  });

  const subtitleOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Agent icons animation
  const agent1X = interpolate(
    spring({ frame: frame - 40, fps, config: { damping: 15 } }),
    [0, 1],
    [0, -60]
  );
  const agent2X = interpolate(
    spring({ frame: frame - 40, fps, config: { damping: 15 } }),
    [0, 1],
    [0, 60]
  );

  // Broken connection line
  const lineOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateRight: "clamp",
  });
  const shakeX = frame > 75 && frame < 100 ? Math.sin(frame * 0.5) * 5 : 0;

  // Question marks
  const questionOpacity = interpolate(frame, [90, 105], [0, 1], {
    extrapolateRight: "clamp",
  });

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
          transform: `scale(${titleScale})`,
          opacity: titleOpacity,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "#ffffff",
            margin: 0,
            textShadow: `0 0 30px rgba(255, 255, 255, 0.3)`,
          }}
        >
          Agents can't talk to each other
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 20,
        }}
      >
        <p
          style={{
            fontSize: 28,
            color: "#888",
            margin: 0,
          }}
        >
          Until now...
        </p>
      </div>

      {/* Agent visualization */}
      <div
        style={{
          marginTop: 60,
          display: "flex",
          alignItems: "center",
          gap: 40,
        }}
      >
        {/* Agent 1 */}
        <div
          style={{
            transform: `translateX(${agent1X}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              backgroundColor: "#1a1a1a",
              border: `2px solid ${ACCENT_COLOR}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px rgba(0, 255, 0, 0.3)`,
            }}
          >
            <span style={{ fontSize: 36 }}>🤖</span>
          </div>
          <span style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
            Agent A
          </span>
        </div>

        {/* Connection line (broken) */}
        <div
          style={{
            opacity: lineOpacity,
            transform: `translateX(${shakeX}px)`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 30,
              height: 3,
              backgroundColor: "#333",
            }}
          />
          <span
            style={{
              color: "#ff4444",
              fontSize: 28,
              opacity: questionOpacity,
            }}
          >
            ✕
          </span>
          <div
            style={{
              width: 30,
              height: 3,
              backgroundColor: "#333",
            }}
          />
        </div>

        {/* Agent 2 */}
        <div
          style={{
            transform: `translateX(${agent2X}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              backgroundColor: "#1a1a1a",
              border: `2px solid ${ACCENT_COLOR}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 20px rgba(0, 255, 0, 0.3)`,
            }}
          >
            <span style={{ fontSize: 36 }}>🤖</span>
          </div>
          <span style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
            Agent B
          </span>
        </div>
      </div>

      {/* Question marks */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          opacity: questionOpacity,
          transform: `rotate(-15deg)`,
        }}
      >
        <span style={{ fontSize: 48, color: "#555" }}>?</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: "25%",
          right: "25%",
          opacity: questionOpacity,
          transform: `rotate(10deg)`,
        }}
      >
        <span style={{ fontSize: 36, color: "#555" }}>?</span>
      </div>
    </AbsoluteFill>
  );
};
