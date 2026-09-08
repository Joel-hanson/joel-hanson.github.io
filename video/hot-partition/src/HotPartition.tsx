import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import {useSiteFonts} from './fonts';
import {font, theme} from './theme';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const BEFORE_DURATION = 24 * FPS;
export const AFTER_DURATION = 20 * FPS;

const COL_W = 210;
const GAP = 48;
const COLS = 4;
const STAGE_W = COLS * COL_W + (COLS - 1) * GAP;
const START_X = (WIDTH - STAGE_W) / 2;
const WELL_TOP = 348;
const WELL_H = 392;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

const formatCount = (n: number) => Math.round(n).toLocaleString('en-US');

type Msg = {
  start: number;
  duration: number;
  partition: number;
  key: string;
  hot: boolean;
};

const hotMessages: Msg[] = Array.from({length: 32}, (_, i) => {
  const hot = i % 10 !== 7;
  return {
    start: 230 + i * 8,
    duration: 28,
    partition: hot ? 0 : [1, 2, 3][i % 3],
    key: hot ? 'tenant-vip' : `order-${1840 + i * 13}`,
    hot,
  };
});

const evenMessages: Msg[] = Array.from({length: 28}, (_, i) => ({
  start: 150 + i * 7,
  duration: 26,
  partition: i % 4,
  key: `order-${4200 + i * 11}`,
  hot: false,
}));

const colX = (partition: number) => START_X + partition * (COL_W + GAP);

type Part = 'before' | 'after';

const HotPartitionBefore: React.FC = () => <Film part="before" />;
const HotPartitionAfter: React.FC = () => <Film part="after" />;

const Film: React.FC<{part: Part}> = ({part}) => {
  useSiteFonts();
  const frame = useCurrentFrame();
  const before = part === 'before';

  const hookOut = before
    ? interpolate(frame, [108, 136], [1, 0], clamp)
    : interpolate(frame, [88, 116], [1, 0], clamp);
  const diagramIn = before ? fade(frame, 112, 148) : fade(frame, 96, 128);
  const endIn = before ? 0 : fade(frame, 500, 534);
  const diagramDim = before ? 1 : interpolate(frame, [492, 534], [1, 0], clamp);
  const loopOut = before ? interpolate(frame, [688, 718], [1, 0], clamp) : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: font.sans,
        opacity: loopOut,
      }}
    >
      <Grid />
      <div style={{opacity: hookOut}}>
        <Hook
          frame={frame}
          kicker={before ? 'Before · hot partition' : 'After · the key'}
          line1={before ? 'You scaled consumers.' : 'Change the key.'}
          line2={before ? "Lag didn't move." : 'New traffic spreads.'}
        />
      </div>
      <div style={{opacity: diagramIn * diagramDim}}>
        <Diagram frame={frame} part={part} />
      </div>
      {before ? null : (
        <div style={{opacity: endIn}}>
          <EndCard frame={frame} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Grid: React.FC = () => {
  const cells = [
    [0, 0],
    [216, 0],
    [72, 936],
  ];
  return (
    <AbsoluteFill>
      {cells.map(([x, y]) => (
        <div
          key={`${x}-${y}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 70,
            height: 70,
            background: '#262626',
            opacity: 0.35,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

const Hook: React.FC<{frame: number; kicker: string; line1: string; line2: string}> = ({
  frame,
  kicker,
  line1,
  line2,
}) => {
  const l1 = fade(frame, 10, 28);
  const l2 = fade(frame, 34, 54);
  const rule = interpolate(frame, [62, 92], [0, 148], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{padding: '120px 140px'}}>
      <Kicker>{kicker}</Kicker>
      <div style={{marginTop: 220}}>
        <div
          style={{
            fontSize: 84,
            fontWeight: 520,
            letterSpacing: -1.6,
            lineHeight: 1.05,
            opacity: l1,
            transform: `translateY(${(1 - l1) * 16}px)`,
          }}
        >
          {line1}
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 84,
            fontWeight: 520,
            letterSpacing: -1.6,
            lineHeight: 1.05,
            color: theme.muted,
            opacity: l2,
            transform: `translateY(${(1 - l2) * 16}px)`,
          }}
        >
          {line2}
        </div>
        <div
          style={{
            marginTop: 36,
            width: rule,
            height: 3,
            background: theme.crimson,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

const Diagram: React.FC<{frame: number; part: Part}> = ({frame, part}) => {
  const before = part === 'before';
  const consumers = before
    ? Math.round(interpolate(frame, [170, 250], [3, 12], {...clamp, easing: ease}))
    : 12;
  const balanced = !before;

  const hotFill = [0.9, 0.13, 0.11, 0.12];
  const evenFill = [0.32, 0.3, 0.31, 0.31];
  const grow = interpolate(frame, [220, 520], [0.72, 1], clamp);
  const evenGrow = interpolate(frame, [140, 460], [0.15, 1], {...clamp, easing: ease});

  const fills = [0, 1, 2, 3].map((i) => {
    if (before) {
      return hotFill[i] * (i === 0 ? grow : 0.85 + grow * 0.15);
    }
    return evenFill[i] * evenGrow;
  });

  const counts = before
    ? [9100, 340, 310, 280].map((n) => n * interpolate(frame, [150, 520], [0.92, 1], clamp))
    : [2480, 2510, 2460, 2550].map((n) => n * interpolate(frame, [140, 460], [0, 1], clamp));

  const topic = before ? 'orders.hot' : 'orders.balanced';
  const caption = before ? captionBefore(frame) : 'Unique order ids. New traffic finally spreads.';

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Kicker>{before ? 'Before · hot partition' : 'After · the key'}</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: font.mono,
              fontSize: 28,
              letterSpacing: -0.4,
            }}
          >
            {topic}
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div style={{fontFamily: font.mono, fontSize: 13, letterSpacing: '0.16em', color: theme.dim, textTransform: 'uppercase'}}>
            consumer group
          </div>
          <div style={{marginTop: 6, fontFamily: font.mono, fontSize: 42, letterSpacing: -1, lineHeight: 1}}>
            {String(consumers).padStart(2, '0')}
          </div>
          <div style={{marginTop: 6, fontFamily: font.mono, fontSize: 13, color: theme.dim}}>
            {balanced ? 'same group, even keys' : '1 on the hot partition'}
          </div>
        </div>
      </div>

      <Producer frame={frame} balanced={balanced} showAt={before ? 140 : 110} />

      {(before ? hotMessages : evenMessages).map((msg, i) => (
        <MessagePill key={`${part}-${i}`} msg={msg} frame={frame} />
      ))}

      {[0, 1, 2, 3].map((i) => (
        <Partition
          key={i}
          index={i}
          fill={fills[i]}
          count={counts[i]}
          hot={before && i === 0}
          consumers={assigned(i, consumers)}
          active={before && i === 0}
          balanced={balanced}
        />
      ))}

      <Brokers hot={before} heat={before ? interpolate(frame, [150, 520], [0.7, 0.94], clamp) : 0.32} />

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 56,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 40,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            letterSpacing: -0.6,
            maxWidth: 1100,
            opacity: before ? interpolate(frame, [660, 700], [1, 0.85], clamp) : interpolate(frame, [470, 500], [1, 0], clamp),
          }}
        >
          {caption}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 14, color: theme.dim, letterSpacing: '0.08em'}}>
          joelhanson.com
        </div>
      </div>

      {before ? <KeyCallout frame={frame} /> : null}
    </AbsoluteFill>
  );
};

const assigned = (partition: number, consumers: number) => {
  if (consumers <= 0) {
    return 0;
  }
  if (partition === 0) {
    return 1;
  }
  const rest = Math.max(0, consumers - 1);
  const base = Math.floor(rest / 3);
  const extra = rest % 3;
  return base + (partition - 1 < extra ? 1 : 0);
};

const captionBefore = (frame: number) => {
  if (frame < 250) {
    return 'Kafka assigns partitions, not a fair share of the work.';
  }
  if (frame < 520) {
    return 'Most of the produce traffic hashed onto one slice.';
  }
  return 'One key. Same partition. Every time.';
};

const Kicker: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      fontFamily: font.mono,
      fontSize: 14,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: theme.crimson,
    }}
  >
    {children}
  </div>
);

const Producer: React.FC<{frame: number; balanced: boolean; showAt: number}> = ({frame, balanced, showAt}) => {
  const show = fade(frame, showAt, showAt + 28);
  return (
    <div
      style={{
        position: 'absolute',
        left: WIDTH / 2 - 130,
        top: 198,
        width: 260,
        opacity: show,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          padding: '10px 14px 12px',
          border: `1px solid ${theme.line}`,
          background: theme.surface,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 99,
              background: balanced ? theme.muted : theme.crimson,
            }}
          />
          <span style={{fontFamily: font.mono, fontSize: 12, letterSpacing: '0.16em', color: theme.dim}}>
            PRODUCER
          </span>
        </div>
        <div style={{fontFamily: font.mono, fontSize: 16, color: theme.text}}>
          {balanced ? 'order-id' : 'tenant-vip'}
        </div>
      </div>
    </div>
  );
};

const MessagePill: React.FC<{msg: Msg; frame: number}> = ({msg, frame}) => {
  const t = interpolate(frame, [msg.start, msg.start + msg.duration], [0, 1], clamp);
  if (t <= 0 || t >= 1) {
    return null;
  }
  const x = colX(msg.partition) + 18;
  const y = interpolate(t, [0, 1], [250, WELL_TOP + 180], {...clamp, easing: Easing.in(Easing.quad)});
  if (y < WELL_TOP + 6) {
    return null;
  }
  const opacity = interpolate(t, [0.35, 0.5, 0.82, 1], [0, 1, 1, 0], clamp);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: COL_W - 36,
        padding: '6px 8px',
        border: `1px solid ${msg.hot ? theme.crimson : theme.line}`,
        background: theme.bg,
        color: msg.hot ? theme.text : theme.muted,
        fontFamily: font.mono,
        fontSize: 13,
        opacity,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        zIndex: 3,
      }}
    >
      {msg.key}
    </div>
  );
};

const Partition: React.FC<{
  index: number;
  fill: number;
  count: number;
  hot: boolean;
  consumers: number;
  active: boolean;
  balanced: boolean;
}> = ({index, fill, count, hot, consumers, active, balanced}) => {
  const x = colX(index);
  const h = Math.max(0, fill) * (WELL_H - 16);
  return (
    <div style={{position: 'absolute', left: x, top: WELL_TOP - 36, width: COL_W}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, height: 18}}>
        <div style={{fontFamily: font.mono, fontSize: 15, color: hot ? theme.crimson : theme.dim, letterSpacing: '0.12em'}}>
          P{index}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 12, color: hot ? theme.crimson : theme.faint}}>
          {index === 0 ? 'leader' : ''}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          height: WELL_H,
          border: `1px solid ${hot ? 'rgba(220, 20, 60, 0.55)' : theme.line}`,
          background: theme.surface,
          overflow: 'hidden',
        }}
      >
        {hot ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '70%',
              background: 'radial-gradient(circle at 50% 100%, rgba(220,20,60,0.28), transparent 70%)',
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 8,
            height: h,
            background: hot ? theme.crimson : '#3a3a3a',
          }}
        />
      </div>
      <div style={{marginTop: 12, fontFamily: font.mono, fontSize: 26, letterSpacing: -0.6, color: hot ? theme.text : theme.muted}}>
        {formatCount(count)}
      </div>
      <div style={{marginTop: 2, fontFamily: font.mono, fontSize: 12, letterSpacing: '0.14em', color: theme.faint, textTransform: 'uppercase'}}>
        offsets
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: font.mono,
          fontSize: 13,
          letterSpacing: '0.04em',
          color: active ? theme.crimson : theme.dim,
        }}
      >
        {consumers} {balanced ? 'assigned' : active ? 'working' : 'idle'}
      </div>
    </div>
  );
};

const Brokers: React.FC<{hot: boolean; heat: number}> = ({hot, heat}) => {
  const levels = hot ? [heat, 0.16, 0.14] : [0.32, 0.3, 0.31];
  return (
    <div
      style={{
        position: 'absolute',
        left: START_X,
        top: 868,
        width: STAGE_W,
        display: 'flex',
        gap: 28,
      }}
    >
      {levels.map((value, i) => (
        <div key={i} style={{flex: 1}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12}}>
            <div style={{fontFamily: font.mono, fontSize: 13, color: theme.dim, letterSpacing: '0.12em'}}>
              BROKER-{i}
            </div>
            <div style={{fontFamily: font.mono, fontSize: 13, color: i === 0 && hot ? theme.crimson : theme.faint}}>
              {i === 0 && hot ? 'hot' : 'cool'}
            </div>
          </div>
          <div style={{height: 6, background: theme.line}}>
            <div
              style={{
                width: `${value * 100}%`,
                height: '100%',
                background: i === 0 && hot ? theme.crimson : '#525252',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const KeyCallout: React.FC<{frame: number}> = ({frame}) => {
  const opacity = interpolate(frame, [520, 550, 680, 710], [0, 1, 1, 0.9], clamp);
  if (opacity <= 0) {
    return null;
  }
  const chips = ['status', 'country', 'null', 'tenantId'];
  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        top: 214,
        width: 280,
        opacity,
        border: `1px solid ${theme.line}`,
        background: 'rgba(10,10,10,0.92)',
        padding: '18px 18px 16px',
      }}
    >
      <div style={{fontFamily: font.mono, fontSize: 12, letterSpacing: '0.16em', color: theme.crimson, textTransform: 'uppercase'}}>
        the key
      </div>
      <div style={{marginTop: 10, fontFamily: font.mono, fontSize: 22}}>tenant-vip</div>
      <div style={{marginTop: 8, fontFamily: font.mono, fontSize: 15, color: theme.muted}}>
        hash(key) % 4 → p0
      </div>
      <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6}}>
        {chips.map((chip) => (
          <div key={chip} style={{fontFamily: font.mono, fontSize: 14, color: theme.muted}}>
            {chip}
          </div>
        ))}
      </div>
    </div>
  );
};

const EndCard: React.FC<{frame: number}> = ({frame}) => {
  const y = interpolate(frame, [508, 548], [18, 0], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px'}}>
      <div style={{transform: `translateY(${y}px)`}}>
        <Kicker>Kafka common problems</Kicker>
        <div
          style={{
            marginTop: 22,
            maxWidth: 1100,
            fontSize: 68,
            fontWeight: 520,
            letterSpacing: -1.4,
            lineHeight: 1.08,
          }}
        >
          Check the keys before
          <br />
          the cluster size.
        </div>
        <div style={{marginTop: 28, fontFamily: font.mono, fontSize: 16, color: theme.dim, letterSpacing: '0.08em'}}>
          joelhanson.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

export {HotPartitionBefore, HotPartitionAfter};
