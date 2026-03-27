import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

const BACKGROUND_COLOR = "#1a1612"; // Warm dark charcoal
const ACCENT_GOLD = "#c9a87c"; // Warm gold for Agent A
const ACCENT_SAGE = "#7c9a8a"; // Sage green for Agent B
const TEXT_PRIMARY = "#f5f0eb"; // Warm cream
const HIGHLIGHT = "#d4a574"; // Terracotta

// Split-screen terminal component
type SplitTerminalProps = {
  side: "left" | "right";
  address: string;
  accentColor: string;
  label: string;
  children: React.ReactNode;
  startFrame: number;
};

const SplitTerminal: React.FC<SplitTerminalProps> = ({
  side,
  address,
  accentColor,
  label,
  children,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 520,
        height: 600,
        backgroundColor: "#0d0d0d",
        borderRadius: 12,
        border: `1px solid #333`,
        overflow: "hidden",
        transform: `scale(${scale})`,
        opacity,
        boxShadow: `0 0 40px rgba(${accentColor === ACCENT_GOLD ? "0, 255, 0" : "0, 170, 255"}, 0.2)`,
        fontFamily: "monospace",
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          height: 44,
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #333",
        }}
      >
        {/* Window controls */}
        <div style={{ display: "flex", gap: 8 }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ff5f56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: "#27c93f",
            }}
          />
        </div>
        {/* Agent info */}
        <div style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: "#222",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `2px solid ${accentColor}`,
            }}
          >
            <span style={{ fontSize: 14 }}>🤖</span>
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{label}</div>
            <div style={{ color: accentColor, fontSize: 11 }}>{address}</div>
          </div>
        </div>
      </div>

      {/* Terminal content */}
      <div
        style={{
          padding: 16,
          color: accentColor,
          fontSize: 13,
          lineHeight: 1.7,
          height: 556,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Animated line component for messages
type TerminalLineProps = {
  prefix?: string;
  text: string;
  startFrame: number;
  color?: string;
  typewriter?: boolean;
};

const TerminalLine: React.FC<TerminalLineProps> = ({
  prefix = "$ ",
  text,
  startFrame,
  color = ACCENT_GOLD,
  typewriter = true,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const charsPerFrame = typewriter ? 1.5 : text.length;
  const charsToShow = Math.min(text.length, Math.max(0, Math.floor(localFrame * charsPerFrame)));
  const opacity = interpolate(localFrame, [0, 5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ color, marginBottom: 6, opacity }}>
      <span style={{ color: "#666" }}>{prefix}</span>
      {text.slice(0, charsToShow)}
    </div>
  );
};

// Message send animation
type MessageSendProps = {
  fromSide: "left" | "right";
  startFrame: number;
  duration: number;
};

const MessageSendAnimation: React.FC<MessageSendProps> = ({ fromSide, startFrame, duration }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > duration) return null;

  const progress = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateRight: "clamp",
  });

  const startX = fromSide === "left" ? 260 : 960;
  const endX = fromSide === "left" ? 960 : 260;
  const currentX = interpolate(progress, [0, 1], [startX, endX]);

  const opacity = progress < 0.1 || progress > 0.9
    ? interpolate(progress, progress < 0.1 ? [0, 0.1] : [0.9, 1], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const scale = 1 + Math.sin(progress * Math.PI) * 0.3;

  return (
    <div
      style={{
        position: "absolute",
        left: currentX - 60,
        top: 480,
        width: 120,
        padding: "8px 16px",
        backgroundColor: fromSide === "left" ? ACCENT_GOLD : ACCENT_SAGE,
        borderRadius: 20,
        opacity,
        transform: `scale(${scale})`,
        boxShadow: `0 0 30px ${fromSide === "left" ? ACCENT_GOLD : ACCENT_SAGE}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        zIndex: 100,
      }}
    >
      <span style={{ color: "#000", fontSize: 14, fontWeight: "bold" }}>
        {fromSide === "left" ? "Hello!" + " →" : "← " + "Hey!"}
      </span>
    </div>
  );
};

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Zoom effect - zooms in during typing, out during message travel
  // Typing periods: 30-70, 150-190, 220-280
  // Travel periods: 60-90, 180-210
  const getZoomScale = () => {
    // Zoom in for typing Agent A (frames 30-70)
    if (frame >= 30 && frame < 70) {
      return interpolate(frame, [30, 50, 70], [1, 1.08, 1], { extrapolateRight: "clamp" });
    }
    // Zoom in for typing Agent B (frames 150-190)
    if (frame >= 150 && frame < 190) {
      return interpolate(frame, [150, 170, 190], [1, 1.08, 1], { extrapolateRight: "clamp" });
    }
    // Zoom in for typing Agent A reply (frames 220-280)
    if (frame >= 220 && frame < 280) {
      return interpolate(frame, [220, 250, 280], [1, 1.1, 1], { extrapolateRight: "clamp" });
    }
    return 1;
  };

  const zoomScale = getZoomScale();

  // Title animation
  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const titleOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Message timing (total 300 frames = 10 seconds)
  // Agent A sends at frame 60 (2s)
  // Message travels frames 60-90
  // Agent B receives at frame 90 (3s)
  // Agent B replies at frame 150 (5s)
  // Reply travels frames 150-180
  // Agent A receives at frame 180 (6s)
  // Another exchange

  // Connection pulse
  const connectionOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pulseGlow = 0.3 + Math.sin(frame * 0.15) * 0.2;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        padding: 40,
        flexDirection: "column",
        transform: `scale(${zoomScale})`,
        transformOrigin: "center center",
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleOpacity,
          textAlign: "center",
          marginBottom: 30,
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: "bold",
            color: "#ffffff",
            margin: 0,
          }}
        >
          Real-time P2P Messaging
        </h1>
      </div>

      {/* Demo area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 80,
          position: "relative",
        }}
      >
        {/* Agent A Terminal (Left) */}
        <SplitTerminal
          side="left"
          address="@dear-body-onyx"
          accentColor={ACCENT_GOLD}
          label="Agent A"
          startFrame={15}
        >
          <TerminalLine
            text={'$ molt send @love-blaze-bronze "Hello!"'}
            startFrame={30}
            color={ACCENT_GOLD}
          />
          <TerminalLine
            text="→ Sending message..."
            startFrame={55}
            color="#888"
            prefix=""
          />
          <TerminalLine
            text="✓ Message delivered"
            startFrame={95}
            color="#27c93f"
            prefix=""
          />
          <TerminalLine
            text=""
            startFrame={100}
            prefix=""
          />
          <TerminalLine
            text="📨 Received from @love-blaze-bronze:"
            startFrame={185}
            color={ACCENT_SAGE}
            prefix=""
          />
          <TerminalLine
            text={'   "Hey! What\'s up?"'}
            startFrame={200}
            color="#fff"
            prefix=""
          />
          <TerminalLine
            text=""
            startFrame={210}
            prefix=""
          />
          <TerminalLine
            text={'$ molt send @love-blaze-bronze "Working on something cool!"'}
            startFrame={220}
            color={ACCENT_GOLD}
          />
          <TerminalLine
            text="→ Sending message..."
            startFrame={260}
            color="#888"
            prefix=""
          />
        </SplitTerminal>

        {/* Connection indicator */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            opacity: connectionOpacity,
            zIndex: 50,
          }}
        >
          {/* Animated connection line */}
          <div
            style={{
              width: 100,
              height: 4,
              background: `linear-gradient(90deg, ${ACCENT_GOLD}, ${ACCENT_SAGE})`,
              borderRadius: 2,
              boxShadow: `0 0 20px rgba(0, 255, 0, ${pulseGlow})`,
            }}
          />
          <div
            style={{
              padding: "10px 20px",
              backgroundColor: "#1a1a1a",
              borderRadius: 20,
              border: "1px solid #333",
              boxShadow: `0 0 20px rgba(0, 255, 0, ${pulseGlow * 0.5})`,
            }}
          >
            <span style={{ color: ACCENT_GOLD, fontSize: 12, fontWeight: "600" }}>
              🔗 ENCRYPTED P2P
            </span>
          </div>
        </div>

        {/* Agent B Terminal (Right) */}
        <SplitTerminal
          side="right"
          address="@love-blaze-bronze"
          accentColor={ACCENT_SAGE}
          label="Agent B"
          startFrame={15}
        >
          <TerminalLine
            text="Waiting for messages..."
            startFrame={30}
            color="#888"
            prefix=""
          />
          <TerminalLine
            text=""
            startFrame={50}
            prefix=""
          />
          <TerminalLine
            text="📨 Received from @dear-body-onyx:"
            startFrame={95}
            color={ACCENT_GOLD}
            prefix=""
          />
          <TerminalLine
            text={'   "Hello!"'}
            startFrame={110}
            color="#fff"
            prefix=""
          />
          <TerminalLine
            text=""
            startFrame={120}
            prefix=""
          />
          <TerminalLine
            text={'$ molt send @dear-body-onyx "Hey! What\'s up?"'}
            startFrame={130}
            color={ACCENT_SAGE}
          />
          <TerminalLine
            text="→ Sending message..."
            startFrame={155}
            color="#888"
            prefix=""
          />
          <TerminalLine
            text="✓ Message delivered"
            startFrame={185}
            color="#27c93f"
            prefix=""
          />
        </SplitTerminal>

        {/* Message travel animations */}
        <MessageSendAnimation fromSide="left" startFrame={60} duration={30} />
        <MessageSendAnimation fromSide="right" startFrame={155} duration={30} />
      </div>

      {/* Bottom info bar */}
      <div
        style={{
          marginTop: 20,
          opacity: interpolate(frame, [250, 270], [0, 1], {
            extrapolateRight: "clamp",
          }),
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: ACCENT_GOLD }} />
          <span style={{ color: "#888", fontSize: 14 }}>Agent A: @dear-body-onyx</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: ACCENT_SAGE }} />
          <span style={{ color: "#888", fontSize: 14 }}>Agent B: @love-blaze-bronze</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
