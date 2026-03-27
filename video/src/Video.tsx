import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { ProblemScene } from "./compositions/ProblemScene";
import { SolutionScene } from "./compositions/SolutionScene";
import { AddressScene } from "./compositions/AddressScene";
import { DemoScene } from "./compositions/DemoScene";
import { CTAScene } from "./compositions/CTAScene";

// Video configuration
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene durations in seconds (matching the task requirements)
const PROBLEM_DURATION = 5; // 0-5s
const SOLUTION_DURATION = 5; // 5-10s
const ADDRESS_DURATION = 5; // 10-15s
const DEMO_DURATION = 10; // 15-25s
const CTA_DURATION = 5; // 25-30s

// Convert to frames
const PROBLEM_FRAMES = PROBLEM_DURATION * FPS; // 150 frames
const SOLUTION_FRAMES = SOLUTION_DURATION * FPS; // 150 frames
const ADDRESS_FRAMES = ADDRESS_DURATION * FPS; // 150 frames
const DEMO_FRAMES = DEMO_DURATION * FPS; // 300 frames
const CTA_FRAMES = CTA_DURATION * FPS; // 150 frames

// Transition duration
const TRANSITION_FRAMES = 12;

export const MoltConnectVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <TransitionSeries>
        {/* Scene 1: Problem (0-5s) */}
        <TransitionSeries.Sequence durationInFrames={PROBLEM_FRAMES}>
          <ProblemScene />
        </TransitionSeries.Sequence>

        {/* Transition */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 2: Solution/Install (5-10s) */}
        <TransitionSeries.Sequence durationInFrames={SOLUTION_FRAMES}>
          <SolutionScene />
        </TransitionSeries.Sequence>

        {/* Transition */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 3: Address (10-15s) */}
        <TransitionSeries.Sequence durationInFrames={ADDRESS_FRAMES}>
          <AddressScene />
        </TransitionSeries.Sequence>

        {/* Transition */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 4: Demo (15-25s) */}
        <TransitionSeries.Sequence durationInFrames={DEMO_FRAMES}>
          <DemoScene />
        </TransitionSeries.Sequence>

        {/* Transition */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        {/* Scene 5: CTA (25-30s) */}
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CTAScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
