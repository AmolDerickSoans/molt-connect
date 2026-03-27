import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

// Claude-inspired earthy color palette
const COLORS = {
  background: "#1a1612",
  cardBg: "#1e1915",
  headerBg: "#252019",
  border: "#3d3530",
  text: "#f5f0eb",
  accent1: "#c9a87c", // warm gold/tan - Agent A
  accent2: "#7c9a8a", // sage green - Agent B
  highlight: "#d4a574", // terracotta/copper
  subtle: "#3d3530", // warm gray
  muted: "#8a7f72",
};

type TerminalProps = {
  title?: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
  accentColor?: string;
  showWindowControls?: boolean;
  zoomProgress?: number; // 0-1, controls zoom level during typing
  enableZoom?: boolean;
};

export const Terminal: React.FC<TerminalProps> = ({
  title = "Terminal",
  children,
  width = 800,
  height = 450,
  accentColor = COLORS.accent1,
  showWindowControls = true,
  zoomProgress = 0,
  enableZoom = false,
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

  // Zoom animation: starts at 1.0, zooms in to 1.15 during typing
  const zoomScale = enableZoom 
    ? interpolate(zoomProgress, [0, 1], [1.0, 1.15], { extrapolateRight: "clamp" })
    : 1;

  // Warm glow color based on accent
  const glowColor = accentColor === COLORS.accent1 ? "201, 168, 124" : "124, 154, 138";

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        boxShadow: `0 0 40px rgba(${glowColor}, 0.15)`,
        transform: `scale(${scale * zoomScale})`,
        opacity,
        fontFamily: "monospace",
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* Terminal header */}
      <div
        style={{
          height: 36,
          backgroundColor: COLORS.headerBg,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        {showWindowControls && (
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#d4a574",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#c9a87c",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#7c9a8a",
              }}
            />
          </div>
        )}
        <span
          style={{
            marginLeft: showWindowControls ? 16 : 0,
            color: COLORS.muted,
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
  onProgress?: (progress: number) => void;
};

export const TerminalLine: React.FC<TerminalLineProps> = ({
  text,
  prefix = "$ ",
  startFrame = 0,
  color = COLORS.accent1,
  onProgress,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const charsToShow = Math.min(text.length, Math.max(0, localFrame * 2));
  const progress = text.length > 0 ? charsToShow / text.length : 0;

  return (
    <div style={{ color, marginBottom: 8 }}>
      <span style={{ color: COLORS.muted }}>{prefix}</span>
      {text.slice(0, charsToShow)}
    </div>
  );
};
