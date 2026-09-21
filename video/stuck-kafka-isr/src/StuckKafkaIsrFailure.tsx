import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {useSiteFonts} from './fonts';
import {font, theme} from './theme';

export const FAILURE_FPS = 30;
export const FAILURE_WIDTH = 1920;
export const FAILURE_HEIGHT = 1080;
export const FAILURE_DURATION = 42 * FAILURE_FPS;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

const sceneOp = (frame: number, enter: number, exit: number) => {
  const inOp = fade(frame, enter, enter + 14);
  const outOp = interpolate(frame, [exit - 14, exit], [1, 0], clamp);
  return inOp * outOp;
};

export const StuckKafkaIsrFailure: React.FC = () => {
  useSiteFonts();
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: font.sans,
      }}
    >
      <FailureSoundtrack />
      <Grid />

      <Sequence from={0} durationInFrames={90}>
        <Hook />
      </Sequence>
      <Sequence from={78} durationInFrames={200}>
        <Mismatch local={frame - 78} />
      </Sequence>
      <Sequence from={262} durationInFrames={220}>
        <WrongTruncate local={frame - 262} />
      </Sequence>
      <Sequence from={466} durationInFrames={240}>
        <HardStop local={frame - 466} />
      </Sequence>
      <Sequence from={690} durationInFrames={220}>
        <ModeB local={frame - 690} />
      </Sequence>
      <Sequence from={890} durationInFrames={FAILURE_DURATION - 890}>
        <End local={frame - 890} />
      </Sequence>

      {frame < 890 ? <Watermark /> : null}
    </AbsoluteFill>
  );
};

const FailureSoundtrack: React.FC = () => (
  <>
    <Audio src={staticFile('audio/ambient.mp3')} volume={0.45} />
    <Sequence from={78} durationInFrames={16} layout="none">
      <Audio src={staticFile('audio/whoosh.mp3')} volume={0.8} />
    </Sequence>
    <Sequence from={262} durationInFrames={16} layout="none">
      <Audio src={staticFile('audio/whoosh.mp3')} volume={0.8} />
    </Sequence>
    <Sequence from={360} durationInFrames={10} layout="none">
      <Audio src={staticFile('audio/tick.mp3')} volume={0.85} />
    </Sequence>
    <Sequence from={466} durationInFrames={16} layout="none">
      <Audio src={staticFile('audio/whoosh.mp3')} volume={0.8} />
    </Sequence>
    <Sequence from={560} durationInFrames={20} layout="none">
      <Audio src={staticFile('audio/error.mp3')} volume={1} />
    </Sequence>
    <Sequence from={620} durationInFrames={16} layout="none">
      <Audio src={staticFile('audio/kill.mp3')} volume={0.75} />
    </Sequence>
    <Sequence from={690} durationInFrames={16} layout="none">
      <Audio src={staticFile('audio/whoosh.mp3')} volume={0.8} />
    </Sequence>
    {[760, 800, 840].map((from) => (
      <Sequence key={from} from={from} durationInFrames={10} layout="none">
        <Audio src={staticFile('audio/tick.mp3')} volume={0.55} />
      </Sequence>
    ))}
    <Sequence from={920} durationInFrames={24} layout="none">
      <Audio src={staticFile('audio/error.mp3')} volume={0.7} />
    </Sequence>
  </>
);

const Grid: React.FC = () => (
  <AbsoluteFill>
    {[
      [0, 0],
      [216, 0],
      [72, 936],
    ].map(([x, y]) => (
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

const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({
  children,
  color = theme.crimson,
}) => (
  <div
    style={{
      fontFamily: font.mono,
      fontSize: 14,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color,
    }}
  >
    {children}
  </div>
);

const Watermark: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      right: 120,
      bottom: 48,
      fontFamily: font.mono,
      fontSize: 14,
      color: theme.dim,
      letterSpacing: '0.08em',
    }}
  >
    joelhanson.com
  </div>
);

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = sceneOp(frame, 0, 90);
  const l1 = fade(frame, 8, 24);
  const l2 = fade(frame, 26, 44);
  const rule = interpolate(frame, [48, 70], [0, 160], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{padding: '120px 140px', opacity}}>
      <Kicker>How it failed</Kicker>
      <div style={{marginTop: 200}}>
        <div
          style={{
            fontSize: 78,
            fontWeight: 520,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            opacity: l1,
          }}
        >
          The checkpoint lied.
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 78,
            fontWeight: 520,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            color: theme.muted,
            opacity: l2,
          }}
        >
          The fetcher never recovered.
        </div>
        <div style={{marginTop: 32, width: rule, height: 3, background: theme.crimson}} />
      </div>
    </AbsoluteFill>
  );
};

const Mismatch: React.FC<{local: number}> = ({local}) => {
  const opacity = sceneOp(local, 0, 200);
  const cards = fade(local, 24, 46);
  const bad = fade(local, 70, 96);

  return (
    <AbsoluteFill style={{padding: '88px 120px', opacity}}>
      <Kicker>Checkpoint mismatch</Kicker>
      <div
        style={{
          marginTop: 16,
          fontSize: 48,
          fontWeight: 520,
          letterSpacing: -0.9,
          lineHeight: 1.12,
          maxWidth: 1400,
        }}
      >
        Same partition. Two epoch maps.
      </div>

      <div style={{marginTop: 48, display: 'flex', gap: 36, opacity: cards}}>
        <FileCard
          title="Leader / healthy"
          status="ok"
          rows={[
            ['5', '100'],
            ['6', '103'],
          ]}
          note="epoch 6 starts at 103"
        />
        <FileCard
          title="Broken follower"
          status={bad > 0.2 ? 'bad' : 'warn'}
          rows={[
            ['5', '100'],
            ['6', '100'],
          ]}
          note="epoch 6 lies — starts at 100"
          pulse={bad}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 72,
          fontSize: 28,
          color: theme.muted,
          opacity: fade(local, 110, 132),
          maxWidth: 1300,
        }}
      >
        On restart the follower asks: where did my last epoch end? The answer is wrong for its disk.
      </div>
    </AbsoluteFill>
  );
};

const FileCard: React.FC<{
  title: string;
  status: 'ok' | 'bad' | 'warn';
  rows: string[][];
  note: string;
  pulse?: number;
}> = ({title, status, rows, note, pulse = 0}) => {
  const border =
    status === 'bad'
      ? 'rgba(220,20,60,0.6)'
      : status === 'ok'
        ? 'rgba(110,231,168,0.35)'
        : theme.line;
  const badge = status === 'bad' ? theme.crimson : status === 'ok' ? theme.ok : theme.dim;

  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${border}`,
        background: theme.surface,
        padding: '28px 32px 30px',
        boxShadow: status === 'bad' ? `0 0 0 ${pulse * 8}px ${theme.crimsonSoft}` : undefined,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div style={{fontFamily: font.mono, fontSize: 14, letterSpacing: '0.16em', color: theme.dim}}>
          {title.toUpperCase()}
        </div>
        <div style={{fontFamily: font.mono, fontSize: 13, letterSpacing: '0.12em', color: badge}}>
          {status === 'bad' ? 'MISMATCH' : status === 'ok' ? 'MATCH' : '…'}
        </div>
      </div>
      <div style={{marginTop: 24, fontFamily: font.mono, fontSize: 16, color: theme.dim}}>
        leader-epoch-checkpoint
      </div>
      <div style={{marginTop: 16, fontFamily: font.mono, fontSize: 28, lineHeight: 1.55}}>
        <div style={{color: theme.faint}}>0</div>
        <div style={{color: theme.faint}}>2</div>
        {rows.map(([epoch, offset], i) => (
          <div
            key={`${epoch}-${offset}-${i}`}
            style={{color: status === 'bad' && i === 1 ? theme.crimson : theme.text}}
          >
            {epoch} {offset}
          </div>
        ))}
      </div>
      <div style={{marginTop: 20, fontSize: 22, color: theme.muted}}>{note}</div>
    </div>
  );
};

const WrongTruncate: React.FC<{local: number}> = ({local}) => {
  const opacity = sceneOp(local, 0, 220);
  const cut = interpolate(local, [40, 90], [0, 1], {...clamp, easing: ease});
  const ask = fade(local, 20, 40);
  const after = fade(local, 100, 124);

  // Log shown as offsets 100..108. Healthy epoch-6 boundary at 103.
  // Broken truncate thinks boundary is 100, so it keeps too much / cuts wrong.
  const offsets = [100, 101, 102, 103, 104, 105, 106, 107];

  return (
    <AbsoluteFill style={{padding: '88px 120px', opacity}}>
      <Kicker>Failure mode A · truncate</Kicker>
      <div
        style={{
          marginTop: 16,
          fontSize: 48,
          fontWeight: 520,
          letterSpacing: -0.9,
          lineHeight: 1.12,
          maxWidth: 1400,
        }}
      >
        It truncates to the wrong place.
      </div>

      <div
        style={{
          marginTop: 28,
          fontFamily: font.mono,
          fontSize: 20,
          color: theme.dim,
          opacity: ask,
        }}
      >
        OffsetsForLeaderEpoch → truncate → fetch
      </div>

      <div style={{marginTop: 56, display: 'flex', flexDirection: 'column', gap: 28}}>
        <LogRow label="Leader log" offsets={offsets} epochSplit={103} />
        <LogRow
          label="Broken follower"
          offsets={offsets}
          epochSplit={100}
          highlightTo={105}
          wrong
          afterCut={after}
          shake={cut}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 72,
          fontSize: 28,
          color: theme.muted,
          opacity: after,
          maxWidth: 1400,
        }}
      >
        Follower thinks its next write is offset 105. The leader is about to resend from 100.
      </div>
    </AbsoluteFill>
  );
};

const LogRow: React.FC<{
  label: string;
  offsets: number[];
  epochSplit: number;
  highlightTo?: number;
  wrong?: boolean;
  afterCut?: number;
  shake?: number;
}> = ({label, offsets, epochSplit, highlightTo, wrong, afterCut = 0, shake = 0}) => (
  <div style={{transform: wrong ? `translateX(${Math.sin(shake * 12) * 2}px)` : undefined}}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 12,
        fontFamily: font.mono,
        fontSize: 14,
        letterSpacing: '0.12em',
        color: wrong ? theme.crimson : theme.dim,
      }}
    >
      <span>{label.toUpperCase()}</span>
      <span>epoch 6 @ {epochSplit}</span>
    </div>
    <div style={{display: 'flex', gap: 10}}>
      {offsets.map((o) => {
        const inEpoch6 = o >= epochSplit;
        const kept = !wrong || o < 105;
        const conflict = Boolean(wrong && afterCut > 0.3 && o >= 100 && o < 105);
        return (
          <div
            key={o}
            style={{
              width: 96,
              height: 88,
              border: `1px solid ${conflict ? theme.crimson : theme.line}`,
              background: conflict ? theme.crimsonSoft : kept ? theme.surface : 'transparent',
              opacity: wrong && !kept ? 0.25 : 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <div style={{fontFamily: font.mono, fontSize: 22}}>{o}</div>
            <div
              style={{
                fontFamily: font.mono,
                fontSize: 12,
                color: inEpoch6 ? (wrong ? theme.crimson : theme.ok) : theme.faint,
              }}
            >
              e{inEpoch6 ? 6 : 5}
            </div>
          </div>
        );
      })}
      {highlightTo !== undefined ? (
        <div
          style={{
            marginLeft: 8,
            alignSelf: 'center',
            fontFamily: font.mono,
            fontSize: 16,
            color: theme.crimson,
          }}
        >
          LEO → {highlightTo}
        </div>
      ) : null}
    </div>
  </div>
);

const HardStop: React.FC<{local: number}> = ({local}) => {
  const opacity = sceneOp(local, 0, 240);
  const step1 = fade(local, 16, 36);
  const step2 = fade(local, 50, 70);
  const boom = fade(local, 95, 115);
  const silence = fade(local, 150, 172);

  return (
    <AbsoluteFill style={{padding: '88px 120px', opacity}}>
      <Kicker>Hard stop</Kicker>
      <div
        style={{
          marginTop: 16,
          fontSize: 48,
          fontWeight: 520,
          letterSpacing: -0.9,
          lineHeight: 1.12,
        }}
      >
        Append refused. Fetcher gives up.
      </div>

      <div style={{marginTop: 52, display: 'flex', flexDirection: 'column', gap: 18}}>
        <Line opacity={step1} label="Follower LEO" value="105" />
        <Line opacity={step2} label="Leader sends batch starting at" value="100" accent />
        <div
          style={{
            opacity: boom,
            marginTop: 12,
            border: `1px solid rgba(220,20,60,0.55)`,
            background: theme.crimsonSoft,
            padding: '28px 32px',
          }}
        >
          <div
            style={{
              fontFamily: font.mono,
              fontSize: 14,
              letterSpacing: '0.16em',
              color: theme.crimson,
            }}
          >
            UnifiedLog
          </div>
          <div style={{marginTop: 14, fontFamily: font.mono, fontSize: 32, letterSpacing: -0.6}}>
            UnexpectedAppendOffsetException
          </div>
          <div style={{marginTop: 12, fontSize: 24, color: theme.muted}}>
            First offset 100 is less than the next offset 105
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 120,
          bottom: 72,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          opacity: silence,
        }}
      >
        <div style={{fontSize: 28, color: theme.muted, maxWidth: 1100}}>
          markPartitionFailed → one burst of errors, then silence. ISR never fills.
        </div>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 22,
            color: theme.crimson,
            letterSpacing: '0.08em',
          }}
        >
          ISR {'{0, 1}'}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Line: React.FC<{
  opacity: number;
  label: string;
  value: string;
  accent?: boolean;
}> = ({opacity, label, value, accent}) => (
  <div
    style={{
      opacity,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      borderBottom: `1px solid ${theme.line}`,
      paddingBottom: 16,
      maxWidth: 980,
    }}
  >
    <div style={{fontSize: 28, color: theme.muted}}>{label}</div>
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 36,
        color: accent ? theme.crimson : theme.text,
        letterSpacing: -0.8,
      }}
    >
      {value}
    </div>
  </div>
);

const ModeB: React.FC<{local: number}> = ({local}) => {
  const opacity = sceneOp(local, 0, 220);
  const loop = Math.floor(local / 28) % 4;
  const stages = ['truncate', 'reload snapshot', 'fetch', 'UNKNOWN_LEADER_EPOCH'];

  return (
    <AbsoluteFill style={{padding: '88px 120px', opacity}}>
      <Kicker>Failure mode B · useless loop</Kicker>
      <div
        style={{
          marginTop: 16,
          fontSize: 48,
          fontWeight: 520,
          letterSpacing: -0.9,
          lineHeight: 1.12,
          maxWidth: 1400,
        }}
      >
        Alive, busy, and going nowhere.
      </div>

      <div
        style={{
          marginTop: 56,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          maxWidth: 1100,
        }}
      >
        {stages.map((stage, i) => {
          const active = loop === i;
          return (
            <div
              key={stage}
              style={{
                border: `1px solid ${active ? 'rgba(220,20,60,0.55)' : theme.line}`,
                background: active ? theme.crimsonSoft : theme.surface,
                padding: '26px 28px',
                transform: `scale(${active ? 1.02 : 1})`,
              }}
            >
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: 14,
                  letterSpacing: '0.16em',
                  color: active ? theme.crimson : theme.dim,
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{marginTop: 12, fontSize: 28, fontWeight: 520, letterSpacing: -0.4}}>
                {stage}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 120,
          bottom: 72,
          fontSize: 28,
          color: theme.muted,
          opacity: fade(local, 40, 60),
          maxWidth: 1300,
        }}
      >
        Leader returns UNKNOWN_LEADER_EPOCH. Retriable — so it retries forever against the same wall.
      </div>
    </AbsoluteFill>
  );
};

const End: React.FC<{local: number}> = ({local}) => {
  const opacity = fade(local, 0, 18);
  const y = interpolate(local, [0, 22], [14, 0], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px', opacity}}>
      <div style={{transform: `translateY(${y}px)`}}>
        <Kicker>Same root cause</Kicker>
        <div
          style={{
            marginTop: 22,
            maxWidth: 1200,
            fontSize: 60,
            fontWeight: 520,
            letterSpacing: -1.2,
            lineHeight: 1.08,
          }}
        >
          Hard stop or endless retry —
          <br />
          <span style={{color: theme.muted}}>the epoch map on disk is wrong.</span>
        </div>
        <div
          style={{
            marginTop: 36,
            fontFamily: font.mono,
            fontSize: 16,
            color: theme.dim,
            letterSpacing: '0.08em',
          }}
        >
          joelhanson.com
        </div>
      </div>
    </AbsoluteFill>
  );
};
