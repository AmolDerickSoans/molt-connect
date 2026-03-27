import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type TerminalProps = {
  title?: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
  accentColor?: string;
  showWindowControls?: boolean;
};

export const Terminal: React.FC<TerminalProps> = ({
  title = "Terminal",
  children,
  width = 800,
  height = 450,
  accentColor = "#00ff00",
  showWindowControls = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: "#0d0d0d",
        borderRadius: 12,
        border: `1px solid #333`,
        overflow: "hidden",
        boxShadow: `0 0 40px rgba(0, 255, 0, 0.15)`,
        transform: `scale(${scale})`,
        opacity,
        fontFamily: "monospace",
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          height: 36,
          backgroundColor: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: "1px solid #333",
        }}
      >
        {showWindowControls && (
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
        )}
        <span
          style={{
            marginLeft: showWindowControls ? 16 : 0,
            color: "#666",
            fontSize: 13,
          }}
        >
          {title}
        </span>
      </div>

      {/* Terminal content */}
      <div
        style={{
          padding: 20,
          color: accentColor,
          fontSize: 14,
          lineHeight: 1.6,
          height: height - 36,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
};

type TerminalLineProps = {
  text: string;
  prefix?: string;
  startFrame?: number;
  color?: string;
};

export const TerminalLine: React.FC<TerminalLineProps> = ({
  text,
  prefix = "$ ",
  startFrame = 0,
  color = "#00ff00",
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const charsToShow = Math.min(text.length, Math.max(0, localFrame * 2));

  return (
    <div style={{ color, marginBottom: 8 }}>
      <span style={{ color: "#888" }}>{prefix}</span>
      {text.slice(0, charsToShow)}
    </div>
  );
};
