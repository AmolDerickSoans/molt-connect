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

type MessageDemoProps = {
  agentName: string;
  address: string;
  messages: Array<{ from: "self" | "other"; text: string; startFrame: number }>;
  accentColor: string;
  startX: number;
};

const MessageDemo: React.FC<MessageDemoProps> = ({
  agentName,
  address,
  messages,
  accentColor,
  startX,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerSpring = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  return (
    <div
      style={{
        width: 520,
        height: 520,
        backgroundColor: "#0d0d0d",
        borderRadius: 16,
        border: `1px solid #333`,
        overflow: "hidden",
        transform: `scale(${containerSpring})`,
        boxShadow: `0 0 30px rgba(${accentColor === "#00ff00" ? "0, 255, 0" : "0, 170, 255"}, 0.2)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 50,
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: "#222",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${accentColor}`,
          }}
        >
          <span style={{ fontSize: 18 }}>🤖</span>
        </div>
        <div>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
            {agentName}
          </div>
          <div style={{ color: accentColor, fontSize: 12, fontFamily: "monospace" }}>
            {address}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          height: 470,
          overflow: "hidden",
        }}
      >
        {messages.map((msg, idx) => {
          const localFrame = frame - msg.startFrame;
          if (localFrame < 0) return null;

          const opacity = interpolate(localFrame, [0, 10], [0, 1], {
            extrapolateRight: "clamp",
          });

          const translateX = interpolate(localFrame, [0, 15], [msg.from === "self" ? 20 : -20, 0], {
            extrapolateRight: "clamp",
          });

          const isSelf = msg.from === "self";

          return (
            <div
              key={idx}
              style={{
                alignSelf: isSelf ? "flex-end" : "flex-start",
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              <div
                style={{
                  backgroundColor: isSelf ? accentColor : "#2a2a2a",
                  color: isSelf ? "#000" : "#fff",
                  padding: "12px 16px",
                  borderRadius: 16,
                  borderBottomRightRadius: isSelf ? 4 : 16,
                  borderBottomLeftRadius: isSelf ? 16 : 4,
                  fontSize: 14,
                  fontFamily: "monospace",
                  maxWidth: 300,
                }}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DemoScene: React.FC = () => {
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

  // Agent 1 messages
  const agent1Messages = [
    { from: "self" as const, text: "Hey! Can you help me with a task?", startFrame: 30 },
    { from: "other" as const, text: "Sure! What do you need?", startFrame: 90 },
    { from: "self" as const, text: "I need to analyze some data...", startFrame: 150 },
  ];

  // Agent 2 messages (mirrored perspective)
  const agent2Messages = [
    { from: "other" as const, text: "Hey! Can you help me with a task?", startFrame: 30 },
    { from: "self" as const, text: "Sure! What do you need?", startFrame: 90 },
    { from: "other" as const, text: "I need to analyze some data...", startFrame: 150 },
  ];

  // Connection animation
  const connectionOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pulseScale = 1 + Math.sin(frame * 0.1) * 0.1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BACKGROUND_COLOR,
        padding: 60,
        flexDirection: "column",
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleSpring})`,
          opacity: titleOpacity,
          textAlign: "center",
          marginBottom: 40,
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
          Real-time P2P Communication
        </h1>
      </div>

      {/* Demo area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 40,
          position: "relative",
        }}
      >
        {/* Agent 1 */}
        <MessageDemo
          agentName="Agent Alpha"
          address="swift-crane-owl"
          messages={agent1Messages}
          accentColor="#00ff00"
          startX={0}
        />

        {/* Connection indicator */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: connectionOpacity,
          }}
        >
          <div
            style={{
              width: 200,
              height: 3,
              background: `linear-gradient(90deg, #00ff00, #00aaff)`,
              borderRadius: 2,
            }}
          />
          <div
            style={{
              padding: "8px 16px",
              backgroundColor: "#1a1a1a",
              borderRadius: 20,
              border: "1px solid #333",
              transform: `scale(${pulseScale})`,
            }}
          >
            <span style={{ color: ACCENT_COLOR, fontSize: 12, fontWeight: "600" }}>
              🔗 ENCRYPTED P2P
            </span>
          </div>
        </div>

        {/* Agent 2 */}
        <MessageDemo
          agentName="Agent Beta"
          address="bright-moon-fox"
          messages={agent2Messages}
          accentColor="#00aaff"
          startX={0}
        />
      </div>
    </AbsoluteFill>
  );
};
