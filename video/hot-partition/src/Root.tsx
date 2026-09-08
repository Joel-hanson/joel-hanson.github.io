import {Composition} from 'remotion';
import {
  AFTER_DURATION,
  BEFORE_DURATION,
  FPS,
  HEIGHT,
  HotPartitionAfter,
  HotPartitionBefore,
  WIDTH,
} from './HotPartition';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="HotPartitionBefore"
        component={HotPartitionBefore}
        durationInFrames={BEFORE_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="HotPartitionAfter"
        component={HotPartitionAfter}
        durationInFrames={AFTER_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
