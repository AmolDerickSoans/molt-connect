import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

type TypewriterTextProps = {
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
  style?: React.CSSProperties;
  cursorColor?: string;
  showCursor?: boolean;
  cursorBlinkRate?: number;
};

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame = 0,
  charsPerFrame = 1,
  style = {},
  cursorColor = "#00ff00",
  showCursor = true,
  cursorBlinkRate = 15,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - startFrame;
  const charsToShow = Math.min(
    text.length,
    Math.max(0, Math.floor(localFrame * charsPerFrame))
  );
  const displayedText = text.slice(0, charsToShow);

  const cursorOpacity =
    showCursor && localFrame >= 0
      ? Math.sin((frame * Math.PI * 2) / cursorBlinkRate) > 0
        ? 1
        : 0
      : 0;

  return (
    <span style={{ ...style, fontFamily: "monospace" }}>
      {displayedText}
      <span
        style={{
          opacity: cursorOpacity,
          color: cursorColor,
          marginLeft: "2px",
        }}
      >
        |
      </span>
    </span>
  );
};
