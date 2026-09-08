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
export const BEFORE_DURATION = 22 * FPS;
export const AFTER_DURATION = 20 * FPS;

const CELL = 52;
const CELL_GAP = 10;
const SLOTS = 8;
const ROW_H = 108;
const STAGE_X = 140;
const ROW_TOP = 318;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

type Sample = {
  label: string;
  fit: number;
  hex?: string;
};

const samples: Sample[] = [
  {label: '42', fit: 1, hex: '2A'},
  {label: '1', fit: 1},
  {label: '300', fit: 2, hex: 'F8 34'},
  {label: '1_000_000', fit: 3},
];

const longBytes = samples.length * SLOTS;
const fitBytes = samples.reduce((sum, sample) => sum + sample.fit, 0);

type Part = 'before' | 'after';

const Bijou64Before: React.FC = () => <Film part="before" />;
const Bijou64After: React.FC = () => <Film part="after" />;

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
  const loopOut = before ? interpolate(frame, [628, 658], [1, 0], clamp) : 1;

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
          kicker={before ? 'Before · LongSerializer' : 'After · Bijou64'}
          line1={before ? 'The value is 42.' : 'Same number.'}
          line2={before ? 'The wire still gets 8 bytes.' : 'Only the bytes it needs.'}
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
  const landed = samples.filter((_, i) => frame >= rowStart(i, before) + 8).length;
  const spent = before
    ? landed * SLOTS
    : samples.slice(0, landed).reduce((sum, sample) => sum + sample.fit, 0);

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
          <Kicker>{before ? 'Before · LongSerializer' : 'After · Bijou64'}</Kicker>
          <div
            style={{
              marginTop: 14,
              fontFamily: font.mono,
              fontSize: 28,
              letterSpacing: -0.4,
            }}
          >
            counters
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
            on the wire
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: font.mono,
              fontSize: 42,
              letterSpacing: -1,
              lineHeight: 1,
              color: before ? theme.crimson : theme.text,
            }}
          >
            {spent}
            <span style={{fontSize: 18, color: theme.dim, letterSpacing: 0}}> B</span>
          </div>
          <div style={{marginTop: 6, fontFamily: font.mono, fontSize: 13, color: theme.dim}}>
            {before ? '8 bytes, every record' : landed < samples.length ? `${landed} records so far` : `${fitBytes} B for 4 numbers`}
          </div>
        </div>
      </div>

      <Producer before={before} frame={frame} />

      {samples.map((sample, i) => (
        <RecordRow key={sample.label} sample={sample} index={i} frame={frame} before={before} />
      ))}

      <Ledger frame={frame} before={before} landed={landed} />

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
            maxWidth: 1180,
            opacity: before
              ? interpolate(frame, [600, 640], [1, 0.85], clamp)
              : interpolate(frame, [470, 500], [1, 0], clamp),
          }}
        >
          {before ? captionBefore(frame) : captionAfter(frame)}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 14, color: theme.dim, letterSpacing: '0.08em'}}>
          joelhanson.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

const rowStart = (index: number, before: boolean) => (before ? 156 : 142) + index * 48;

const captionBefore = (frame: number) => {
  if (frame < 250) {
    return 'LongSerializer is fixed width. Small or large, still 8.';
  }
  if (frame < 400) {
    return 'Broker storage, replication, and egress all pay for it.';
  }
  return 'These four numbers. 32 bytes. None of it optional.';
};

const captionAfter = (frame: number) => {
  if (frame < 340) {
    return '42 is one byte. 300 is two. 1_000_000 is three.';
  }
  if (frame < 440) {
    return `${longBytes} bytes down to ${fitBytes}. Same longs.`;
  }
  return 'Sequential integers in CI: 3.0 vs 8.0 bytes. 62% smaller.';
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

const Producer: React.FC<{before: boolean; frame: number}> = ({before, frame}) => {
  const show = fade(frame, before ? 140 : 120, before ? 168 : 148);
  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE_X,
        top: 214,
        opacity: show,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          border: `1px solid ${theme.line}`,
          background: theme.surface,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: 99,
            background: before ? theme.crimson : theme.text,
          }}
        />
        <span style={{fontFamily: font.mono, fontSize: 15, color: theme.text}}>
          {before ? 'LongSerializer' : 'Bijou64Serializer'}
        </span>
      </div>
    </div>
  );
};

const RecordRow: React.FC<{
  sample: Sample;
  index: number;
  frame: number;
  before: boolean;
}> = ({sample, index, frame, before}) => {
  const start = rowStart(index, before);
  const arrive = fade(frame, start, start + 16);
  const y = interpolate(frame, [start, start + 18], [14, 0], {...clamp, easing: ease});
  const fill = before
    ? interpolate(frame, [start + 10, start + 42], [0, SLOTS], clamp)
    : interpolate(frame, [start + 8, start + 36], [0, sample.fit], clamp);
  const ghost = before ? 0 : fade(frame, start + 6, start + 22);

  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE_X,
        top: ROW_TOP + index * ROW_H,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        opacity: arrive,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{width: 250}}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 40,
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          {sample.label}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: font.mono,
            fontSize: 14,
            letterSpacing: '0.12em',
            color: theme.dim,
            textTransform: 'uppercase',
          }}
        >
          {before ? 'fixed' : sample.hex ?? ''}
        </div>
      </div>
      <Cells filled={fill} ghost={ghost} before={before} fit={sample.fit} />
      <div style={{width: 120}}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 28,
            letterSpacing: -0.6,
            color: before ? theme.crimson : theme.text,
          }}
        >
          {before ? '8' : String(fill < 0.5 ? sample.fit : Math.max(1, Math.round(Math.min(sample.fit, fill))))} B
        </div>
      </div>
    </div>
  );
};

const Cells: React.FC<{
  filled: number;
  ghost: number;
  before: boolean;
  fit: number;
}> = ({filled, ghost, before, fit}) => {
  return (
    <div style={{display: 'flex', gap: CELL_GAP, width: SLOTS * CELL + (SLOTS - 1) * CELL_GAP}}>
      {Array.from({length: SLOTS}, (_, i) => {
        const on = before ? i < filled : i < fit && i < filled + 0.02;
        const showGhost = !before && ghost > 0 && i >= fit;
        if (!before && i >= fit && ghost < 0.04) {
          return <div key={i} style={{width: CELL, height: 64}} />;
        }
        return (
          <div
            key={i}
            style={{
              width: CELL,
              height: 64,
              border: `1px solid ${
                before
                  ? on
                    ? 'rgba(220, 20, 60, 0.9)'
                    : theme.line
                  : showGhost
                    ? theme.line
                    : on
                      ? '#fafafa'
                      : theme.line
              }`,
              background: before
                ? on
                  ? theme.crimson
                  : 'transparent'
                : on
                  ? '#fafafa'
                  : showGhost
                    ? `rgba(38, 38, 38, ${0.55 * ghost})`
                    : 'transparent',
              opacity: showGhost ? ghost : 1,
            }}
          />
        );
      })}
    </div>
  );
};

const Ledger: React.FC<{frame: number; before: boolean; landed: number}> = ({
  frame,
  before,
  landed,
}) => {
  const show = fade(frame, before ? 340 : 320, before ? 368 : 348);
  const width = before
    ? interpolate(frame, [340, 430], [0.15, 1], {...clamp, easing: ease})
    : interpolate(frame, [320, 420], [0.08, fitBytes / longBytes], {...clamp, easing: ease});
  const track = 920;

  return (
    <div
      style={{
        position: 'absolute',
        left: STAGE_X,
        top: 792,
        width: track,
        opacity: show,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 10}}>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            letterSpacing: '0.16em',
            color: theme.dim,
            textTransform: 'uppercase',
          }}
        >
          {landed} of {samples.length} values
        </div>
        <div style={{fontFamily: font.mono, fontSize: 13, color: before ? theme.crimson : theme.muted}}>
          {before ? `${longBytes} B fixed` : `${fitBytes} B encoded · was ${longBytes} B`}
        </div>
      </div>
      <div style={{width: track, height: 8, background: theme.line}}>
        <div
          style={{
            width: track * width,
            height: '100%',
            background: before ? theme.crimson : '#fafafa',
          }}
        />
      </div>
    </div>
  );
};

const EndCard: React.FC<{frame: number}> = ({frame}) => {
  const y = interpolate(frame, [508, 548], [18, 0], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px'}}>
      <div style={{transform: `translateY(${y}px)`}}>
        <Kicker>Bijou64</Kicker>
        <div
          style={{
            marginTop: 22,
            maxWidth: 1200,
            fontSize: 68,
            fontWeight: 520,
            letterSpacing: -1.4,
            lineHeight: 1.08,
          }}
        >
          Swap the serializer.
          <br />
          Keep the Long.
        </div>
        <div style={{marginTop: 28, fontFamily: font.mono, fontSize: 16, color: theme.dim, letterSpacing: '0.08em'}}>
          joelhanson.com
        </div>
      </div>
    </AbsoluteFill>
  );
};

export {Bijou64After, Bijou64Before};
