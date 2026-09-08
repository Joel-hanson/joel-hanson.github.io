import {Composition} from 'remotion';
import {
  AFTER_DURATION,
  BEFORE_DURATION,
  Bijou64After,
  Bijou64Before,
  FPS,
  HEIGHT,
  WIDTH,
} from './Bijou64';
import {NETWORK_DURATION, SensorNetwork} from './Network';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Bijou64Before"
        component={Bijou64Before}
        durationInFrames={BEFORE_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Bijou64After"
        component={Bijou64After}
        durationInFrames={AFTER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Bijou64Network"
        component={SensorNetwork}
        durationInFrames={NETWORK_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
