import { Composition, registerRoot } from "remotion";
import { MoltConnectVideo, FPS, WIDTH, HEIGHT } from "./Video";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MoltConnectDemo"
        component={MoltConnectVideo}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

registerRoot(RemotionRoot);
