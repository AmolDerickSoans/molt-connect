import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Sequence,
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

  // Step animations
  const step1Opacity = interpolate(frame, [30, 45], [0, 1], {
    extrapolateRight: "clamp",
  });
  const step2Opacity = interpolate(frame, [90, 105], [0, 1], {
    extrapolateRight: "clamp",
  });
  const step3Opacity = interpolate(frame, [150, 165], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        padding: 60,
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleOpacity,
          marginBottom: 40,
        }}
      >
        <h1
          style={{
            fontSize: 56,
            fontWeight: "bold",
            color: "#ffffff",
            margin: 0,
          }}
        >
          The Solution:{" "}
          <span style={{ color: ACCENT_COLOR }}>Molt Connect</span>
        </h1>
      </div>

      {/* Steps container */}
      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 20,
        }}
      >
        {/* Step 1: Install */}
        <div
          style={{
            flex: 1,
            opacity: step1Opacity,
            transform: `translateY(${interpolate(step1Opacity, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: ACCENT_COLOR,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: "bold",
                color: "#000",
              }}
            >
              1
            </div>
            <span style={{ fontSize: 24, color: "#fff", fontWeight: "600" }}>
              Install
            </span>
          </div>
          <Terminal title="Terminal" width={380} height={200}>
            <TerminalLine
              text="npm install -g molt-connect"
              startFrame={45}
              color="#00ff00"
            />
            <TerminalLine
              text="✓ Installed successfully"
              startFrame={75}
              color="#27c93f"
            />
          </Terminal>
        </div>

        {/* Step 2: Generate Address */}
        <div
          style={{
            flex: 1,
            opacity: step2Opacity,
            transform: `translateY(${interpolate(step2Opacity, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: ACCENT_COLOR,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: "bold",
                color: "#000",
              }}
            >
              2
            </div>
            <span style={{ fontSize: 24, color: "#fff", fontWeight: "600" }}>
              Generate Address
            </span>
          </div>
          <Terminal title="Terminal" width={380} height={200}>
            <TerminalLine
              text="molt whoami"
              startFrame={105}
              color="#00ff00"
            />
            <TerminalLine
              text="→ swift-crane-owl"
              startFrame={130}
              color="#00aaff"
              prefix=""
            />
            <TerminalLine
              text="Your agent address"
              startFrame={140}
              color="#666"
              prefix=""
            />
          </Terminal>
        </div>

        {/* Step 3: Send Message */}
        <div
          style={{
            flex: 1,
            opacity: step3Opacity,
            transform: `translateY(${interpolate(step3Opacity, [0, 1], [20, 0])}px)`,
          }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: ACCENT_COLOR,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#000",
                }}
              >
                3
              </div>
              <span style={{ fontSize: 24, color: "#fff", fontWeight: "600" }}>
                Send Message
              </span>
            </div>
            <Terminal title="Terminal" width={380} height={200}>
              <TerminalLine
                text='molt send bright-moon-fox "Hello!"'
                startFrame={165}
                color="#00ff00"
              />
              <TerminalLine
                text="→ Message sent!"
                startFrame={195}
                color="#27c93f"
                prefix=""
              />
            </Terminal>
        </div>
      </div>
    </AbsoluteFill>
  );
};
