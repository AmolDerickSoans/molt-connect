import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";

type FadeInProps = {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
};

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0, duration = 20 }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      {children}
    </AbsoluteFill>
  );
};

type ScaleInProps = {
  children: React.ReactNode;
  delay?: number;
};

export const ScaleIn: React.FC<ScaleInProps> = ({ children, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, opacity }}>
      {children}
    </AbsoluteFill>
  );
};

type SlideInProps = {
  children: React.ReactNode;
  direction: "left" | "right" | "top" | "bottom";
  delay?: number;
};

export const SlideIn: React.FC<SlideInProps> = ({ children, direction, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
  });

  const axis = direction === "left" || direction === "right" ? "X" : "Y";
  const sign = direction === "left" || direction === "top" ? -1 : 1;
  const offset = interpolate(progress, [0, 1], [sign * 100, 0]);

  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        transform: `translate${axis}(${offset}px)`,
        opacity,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
