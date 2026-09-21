import {Composition} from 'remotion';
import {DURATION, FPS, HEIGHT, StuckKafkaIsr, WIDTH} from './StuckKafkaIsr';
import {
  FAILURE_DURATION,
  FAILURE_FPS,
  FAILURE_HEIGHT,
  FAILURE_WIDTH,
  StuckKafkaIsrFailure,
} from './StuckKafkaIsrFailure';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StuckKafkaIsr"
        component={StuckKafkaIsr}
        durationInFrames={DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="StuckKafkaIsrFailure"
        component={StuckKafkaIsrFailure}
        durationInFrames={FAILURE_DURATION}
        fps={FAILURE_FPS}
        width={FAILURE_WIDTH}
        height={FAILURE_HEIGHT}
      />
    </>
  );
};
