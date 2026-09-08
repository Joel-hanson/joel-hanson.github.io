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
export const NETWORK_DURATION = 22 * FPS;

const LONG_BYTES = 8;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

type Reading = {
  metric: string;
  value: string;
  fit: number;
};

const readings: Reading[] = [
  {metric: 'temp', value: '23', fit: 1},
  {metric: 'humidity', value: '41', fit: 1},
  {metric: 'battery', value: '88', fit: 1},
  {metric: 'seq', value: '14', fit: 1},
];

const longTotal = readings.length * LONG_BYTES;
const fitTotal = readings.reduce((sum, reading) => sum + reading.fit, 0);

const LONG_LAUNCH = 248;
const BIJOU_LAUNCH = 408;
const LAUNCH_GAP = 34;
const TRAVEL = 34;

const WIRE_X = 620;
const WIRE_W = 900;
const LONG_Y = 392;
const BIJOU_Y = 668;

export const SensorNetwork: React.FC = () => {
  useSiteFonts();
  const frame = useCurrentFrame();

  const hookOut = interpolate(frame, [108, 136], [1, 0], clamp);
  const diagramIn = fade(frame, 112, 148);
  const loopOut = interpolate(frame, [628, 658], [1, 0], clamp);

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
        <Hook frame={frame} />
      </div>
      <div style={{opacity: diagramIn}}>
        <Diagram frame={frame} />
      </div>
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

const Hook: React.FC<{frame: number}> = ({frame}) => {
  const l1 = fade(frame, 10, 28);
  const l2 = fade(frame, 34, 54);
  const rule = interpolate(frame, [62, 92], [0, 148], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{padding: '120px 140px'}}>
      <Kicker>Network · sensor-07</Kicker>
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
          Four readings a second.
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
          The network still pays for 32.
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

const arrived = (frame: number, launch: number) =>
  readings.filter((_, i) => frame >= launch + i * LAUNCH_GAP + TRAVEL).length;

const Diagram: React.FC<{frame: number}> = ({frame}) => {
  const longIn = arrived(frame, LONG_LAUNCH);
  const bijouIn = arrived(frame, BIJOU_LAUNCH);
  const longBytes = longIn * LONG_BYTES;
  const bijouBytes = readings.slice(0, bijouIn).reduce((sum, reading) => sum + reading.fit, 0);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 72,
          left: 140,
          right: 140,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Kicker>Network · sensor-07</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: font.mono,
              fontSize: 28,
              letterSpacing: -0.4,
            }}
          >
            sensors.metrics
          </div>
        </div>
        <div style={{textAlign: 'right'}}>
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 13,
              letterSpacing: '0.16em',
              color: theme.dim,
              textTransform: 'uppercase',
            }}
          >
            egress this second
          </div>
          <div style={{marginTop: 6, fontFamily: font.mono, fontSize: 42, letterSpacing: -1, lineHeight: 1}}>
            <span style={{color: theme.crimson}}>{longBytes}</span>
            <span style={{color: theme.dim}}> / </span>
            <span>{bijouBytes}</span>
            <span style={{fontSize: 18, color: theme.dim}}> B</span>
          </div>
          <div style={{marginTop: 6, fontFamily: font.mono, fontSize: 13, color: theme.dim}}>
            long / bijou64 · same 4 readings
          </div>
        </div>
      </div>

      <Sensor frame={frame} />
      <Lane frame={frame} kind="long" y={LONG_Y} sent={longBytes} />
      <Lane frame={frame} kind="bijou" y={BIJOU_Y} sent={bijouBytes} />
      <Broker />

      {readings.map((reading, i) => (
        <Packet
          key={`long-${reading.metric}`}
          reading={reading}
          frame={frame}
          start={LONG_LAUNCH + i * LAUNCH_GAP}
          y={LONG_Y}
          bytes={LONG_BYTES}
          hot
        />
      ))}
      {readings.map((reading, i) => (
        <Packet
          key={`bijou-${reading.metric}`}
          reading={reading}
          frame={frame}
          start={BIJOU_LAUNCH + i * LAUNCH_GAP}
          y={BIJOU_Y}
          bytes={reading.fit}
          hot={false}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 140,
          right: 140,
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
            maxWidth: 1280,
            opacity: interpolate(frame, [600, 640], [1, 0.85], clamp),
          }}
        >
          {caption(frame)}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 14, color: theme.dim, letterSpacing: '0.08em'}}>
          joelhanson.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

const caption = (frame: number) => {
  if (frame < 250) {
    return 'temp 23, humidity 41, battery 88, sequence 14.';
  }
  if (frame < 400) {
    return 'LongSerializer. Every reading is 8 bytes on the wire.';
  }
  if (frame < 540) {
    return 'Same readings. Bijou64 sends the bytes the number needs.';
  }
  return `${longTotal} bytes a second, or ${fitTotal}. The network bill is the width.`;
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

const Sensor: React.FC<{frame: number}> = ({frame}) => {
  const show = fade(frame, 148, 172);
  return (
    <div
      style={{
        position: 'absolute',
        left: 140,
        top: 268,
        width: 420,
        opacity: show,
        border: `1px solid ${theme.line}`,
        background: theme.surface,
        padding: '18px 20px 16px',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 99,
            background: theme.crimson,
          }}
        />
        <span style={{fontFamily: font.mono, fontSize: 12, letterSpacing: '0.16em', color: theme.dim}}>
          SENSOR-07
        </span>
      </div>
      <div style={{marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14}}>
        {readings.map((reading, i) => {
          const row = fade(frame, 164 + i * 16, 182 + i * 16);
          return (
            <div
              key={reading.metric}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                opacity: row,
                transform: `translateY(${(1 - row) * 8}px)`,
              }}
            >
              <div style={{fontFamily: font.mono, fontSize: 22, color: theme.muted}}>{reading.metric}</div>
              <div style={{fontFamily: font.mono, fontSize: 32, letterSpacing: -0.8}}>{reading.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Lane: React.FC<{frame: number; kind: 'long' | 'bijou'; y: number; sent: number}> = ({
  frame,
  kind,
  y,
  sent,
}) => {
  const long = kind === 'long';
  const show = fade(frame, long ? 168 : 188, long ? 196 : 216);
  const fill = sent / longTotal;

  return (
    <div style={{position: 'absolute', left: WIRE_X, top: y, width: WIRE_W, opacity: show}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12}}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 14,
            letterSpacing: '0.16em',
            color: long ? theme.crimson : theme.dim,
            textTransform: 'uppercase',
          }}
        >
          {long ? 'LongSerializer' : 'Bijou64'}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 22, letterSpacing: -0.4, color: long ? theme.crimson : theme.text}}>
          {sent} B
        </div>
      </div>
      <div style={{height: 2, background: theme.line}} />
      <div style={{marginTop: 78, height: 6, background: theme.line, position: 'relative'}}>
        <div
          style={{
            width: `${fill * 100}%`,
            height: '100%',
            background: long ? theme.crimson : '#fafafa',
          }}
        />
      </div>
    </div>
  );
};

const Broker: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      left: 1568,
      top: 430,
      width: 200,
      border: `1px solid ${theme.line}`,
      background: theme.surface,
      padding: '16px 16px 18px',
    }}
  >
    <div style={{fontFamily: font.mono, fontSize: 12, letterSpacing: '0.16em', color: theme.dim}}>KAFKA</div>
    <div style={{marginTop: 10, fontFamily: font.mono, fontSize: 22, color: theme.text}}>broker</div>
  </div>
);

const Packet: React.FC<{
  reading: Reading;
  frame: number;
  start: number;
  y: number;
  bytes: number;
  hot: boolean;
}> = ({reading, frame, start, y, bytes, hot}) => {
  const t = interpolate(frame, [start, start + TRAVEL], [0, 1], clamp);
  if (t <= 0 || t >= 1) {
    return null;
  }
  const x = interpolate(t, [0, 1], [WIRE_X, WIRE_X + WIRE_W - packetWidth(bytes)], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const opacity = interpolate(t, [0, 0.08, 0.88, 1], [0, 1, 1, 0], clamp);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + 28,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        opacity,
      }}
    >
      <div style={{display: 'flex', gap: 4}}>
        {Array.from({length: bytes}, (_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 28,
              background: hot ? theme.crimson : '#fafafa',
            }}
          />
        ))}
      </div>
      <div style={{fontFamily: font.mono, fontSize: 16, color: hot ? theme.text : theme.muted, whiteSpace: 'nowrap'}}>
        {reading.metric} {reading.value}
      </div>
    </div>
  );
};

const packetWidth = (bytes: number) => bytes * 16 + Math.max(0, bytes - 1) * 4;

export {SensorNetwork as Bijou64Network};
