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

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
/** Extra frames added so the opening hook is readable (~5s hold). */
const HOOK_EXTRA = 80;
export const DURATION = (68 * FPS) + HOOK_EXTRA;

const clamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const fade = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], clamp);

/** Shift timings that used to sit after the short hook. */
const T = (frame: number) => frame + HOOK_EXTRA;

const COL_W = 340;
const GAP = 48;
const STAGE_W = 3 * COL_W + 2 * GAP;
const START_X = (WIDTH - STAGE_W) / 2;
const WELL_TOP = 320;
const WELL_H = 360;

type Phase =
  | 'hook'
  | 'healthy'
  | 'upgrade'
  | 'countdown'
  | 'kill'
  | 'stuck'
  | 'useless'
  | 'fix'
  | 'prevent'
  | 'end';

const HOOK_END = T(70);
const PREVENT_AT = T(1480);
const END_AT = T(1760);

const phaseAt = (frame: number): Phase => {
  if (frame < HOOK_END) return 'hook';
  if (frame < T(260)) return 'healthy';
  if (frame < T(320)) return 'upgrade';
  if (frame < T(500)) return 'countdown';
  if (frame < T(560)) return 'kill';
  if (frame < T(860)) return 'stuck';
  if (frame < T(1040)) return 'useless';
  if (frame < PREVENT_AT) return 'fix';
  if (frame < END_AT) return 'prevent';
  return 'end';
};

export const StuckKafkaIsr: React.FC = () => {
  useSiteFonts();
  const frame = useCurrentFrame();
  const phase = phaseAt(frame);
  const showCluster = phase !== 'end' && phase !== 'prevent';
  const clusterOut = interpolate(frame, [T(1460), T(1500)], [1, 0], clamp);
  const endIn = fade(frame, END_AT, T(1790));
  const preventIn = fade(frame, PREVENT_AT, T(1510));
  const preventOut = interpolate(frame, [T(1730), END_AT], [1, 0], clamp);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: font.sans,
      }}
    >
      <Soundtrack />
      <Grid />

      {showCluster ? (
        <div style={{opacity: clusterOut}}>
          <ClusterStage frame={frame} phase={phase} />
        </div>
      ) : null}

      {phase === 'hook' ? <HookOverlay frame={frame} /> : null}

      <div style={{opacity: preventIn * preventOut}}>
        {phase === 'prevent' || (frame >= PREVENT_AT && frame < END_AT) ? (
          <PreventCard frame={frame} />
        ) : null}
      </div>

      <div style={{opacity: endIn}}>
        {phase === 'end' || frame >= END_AT ? <EndCard frame={frame} /> : null}
      </div>

      {frame < END_AT ? <Watermark /> : null}
    </AbsoluteFill>
  );
};

const Soundtrack: React.FC = () => {
  const pulseStarts = [90, 120, 150, 180, 210, 240].map(T);
  const tickStarts = Array.from({length: 10}, (_, i) => T(340 + i * 15));
  const whooshStarts = [260, 320, 560, 860, 1040, 1480].map(T);

  return (
    <>
      <Audio src={staticFile('audio/ambient.mp3')} volume={0.55} />
      {pulseStarts.map((from) => (
        <Sequence key={`p-${from}`} from={from} durationInFrames={8} layout="none">
          <Audio src={staticFile('audio/pulse.mp3')} volume={0.7} />
        </Sequence>
      ))}
      {whooshStarts.map((from) => (
        <Sequence key={`w-${from}`} from={from} durationInFrames={16} layout="none">
          <Audio src={staticFile('audio/whoosh.mp3')} volume={0.85} />
        </Sequence>
      ))}
      {tickStarts.map((from) => (
        <Sequence key={`t-${from}`} from={from} durationInFrames={6} layout="none">
          <Audio src={staticFile('audio/tick.mp3')} volume={0.9} />
        </Sequence>
      ))}
      <Sequence from={T(500)} durationInFrames={20} layout="none">
        <Audio src={staticFile('audio/kill.mp3')} volume={1} />
      </Sequence>
      <Sequence from={T(640)} durationInFrames={16} layout="none">
        <Audio src={staticFile('audio/error.mp3')} volume={0.95} />
      </Sequence>
      <Sequence from={T(720)} durationInFrames={16} layout="none">
        <Audio src={staticFile('audio/error.mp3')} volume={0.7} />
      </Sequence>
      <Sequence from={T(1320)} durationInFrames={24} layout="none">
        <Audio src={staticFile('audio/success.mp3')} volume={1} />
      </Sequence>
    </>
  );
};

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

const HookOverlay: React.FC<{frame: number}> = ({frame}) => {
  // ~5s on screen: fade in, hold to read, then ease out into the cluster.
  const opacity = interpolate(
    frame,
    [0, 20, HOOK_END - 28, HOOK_END],
    [0, 1, 1, 0],
    clamp,
  );
  const l1 = fade(frame, 10, 32);
  const l2 = fade(frame, 36, 58);
  const rule = interpolate(frame, [62, 90], [0, 160], {...clamp, easing: ease});

  return (
    <AbsoluteFill
      style={{
        padding: '120px 140px',
        opacity,
        background: 'rgba(10,10,10,0.72)',
      }}
    >
      <Kicker>Stuck Kafka ISR</Kicker>
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
          Watch a healthy cluster
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
          get permanently stuck.
        </div>
        <div style={{marginTop: 32, width: rule, height: 3, background: theme.crimson}} />
      </div>
    </AbsoluteFill>
  );
};

type BrokerState = {
  id: number;
  role: 'leader' | 'follower';
  inIsr: boolean;
  alive: boolean;
  fill: number;
  checkpoint: 'ok' | 'bad' | 'fixing' | 'fixed';
  status: string;
};

const ClusterStage: React.FC<{frame: number; phase: Phase}> = ({frame, phase}) => {
  const brokers = brokerStates(frame, phase);
  const caption = captionFor(frame, phase);
  const isrList = brokers.filter((b) => b.inIsr && b.alive).map((b) => b.id);
  const header = headerFor(phase);
  const showPackets = phase === 'healthy' || phase === 'upgrade' || (phase === 'fix' && frame > T(1280));
  const killFlash = phase === 'kill' ? interpolate(frame, [T(500), T(508), T(540)], [0, 0.55, 0], clamp) : 0;
  const timer =
    phase === 'countdown' || phase === 'kill'
      ? Math.max(0, Math.ceil(interpolate(frame, [T(320), T(500)], [30, 0], clamp)))
      : null;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(220,20,60,${killFlash})`,
          pointerEvents: 'none',
          zIndex: 8,
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 64,
          left: 120,
          right: 120,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}
      >
        <div>
          <Kicker color={header.color}>{header.kicker}</Kicker>
          <div
            style={{
              marginTop: 12,
              fontSize: 42,
              fontWeight: 520,
              letterSpacing: -0.8,
              maxWidth: 1100,
              lineHeight: 1.15,
            }}
          >
            {header.title}
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
            __consumer_offsets-1
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: font.mono,
              fontSize: 28,
              letterSpacing: -0.6,
              color: isrList.length < 3 ? theme.crimson : theme.ok,
            }}
          >
            ISR {'{'}
            {isrList.join(', ') || '—'}
            {'}'}
          </div>
          {timer !== null ? (
            <div
              style={{
                marginTop: 10,
                fontFamily: font.mono,
                fontSize: 18,
                color: timer <= 5 ? theme.crimson : theme.muted,
              }}
            >
              grace {String(timer).padStart(2, '0')}s
            </div>
          ) : null}
        </div>
      </div>

      {showPackets ? <ReplicationPackets frame={frame} phase={phase} /> : null}

      {brokers.map((b, i) => (
        <BrokerColumn key={b.id} broker={b} index={i} frame={frame} phase={phase} />
      ))}

      {phase === 'stuck' || phase === 'useless' ? <FetchFailCallout frame={frame} phase={phase} /> : null}
      {phase === 'fix' ? <FixSteps frame={frame} /> : null}

      <div
        style={{
          position: 'absolute',
          left: 120,
          right: 280,
          bottom: 56,
          fontSize: 30,
          fontWeight: 500,
          letterSpacing: -0.4,
          color: theme.muted,
          maxWidth: 1400,
          lineHeight: 1.35,
        }}
      >
        {caption}
      </div>
    </AbsoluteFill>
  );
};

const brokerStates = (frame: number, phase: Phase): BrokerState[] => {
  const healthyFill = interpolate(frame, [HOOK_END, T(250)], [0.55, 0.78], clamp);
  const base: BrokerState[] = [
    {
      id: 0,
      role: 'leader',
      inIsr: true,
      alive: true,
      fill: healthyFill,
      checkpoint: 'ok',
      status: 'appending',
    },
    {
      id: 1,
      role: 'follower',
      inIsr: true,
      alive: true,
      fill: healthyFill * 0.97,
      checkpoint: 'ok',
      status: 'fetching',
    },
    {
      id: 6,
      role: 'follower',
      inIsr: true,
      alive: true,
      fill: healthyFill * 0.95,
      checkpoint: 'ok',
      status: 'fetching',
    },
  ];

  if (phase === 'hook' || phase === 'healthy' || phase === 'upgrade') {
    return base;
  }

  if (phase === 'countdown') {
    return base.map((b) =>
      b.id === 6
        ? {...b, status: 'shutting down…', fill: healthyFill * 0.95}
        : b,
    );
  }

  if (phase === 'kill') {
    const dead = frame >= T(508);
    return base.map((b) => {
      if (b.id !== 6) return b;
      return {
        ...b,
        alive: !dead,
        inIsr: !dead,
        checkpoint: dead ? 'bad' : 'ok',
        status: dead ? 'SIGKILL' : 'flushing checkpoint…',
        fill: dead ? 0.9 : healthyFill * 0.95,
      };
    });
  }

  if (phase === 'stuck') {
    const back = frame >= T(590);
    const failed = frame >= T(650);
    return base.map((b) => {
      if (b.id !== 6) {
        return {...b, fill: 0.82, status: b.id === 0 ? 'leader' : 'in sync'};
      }
      if (!back) {
        return {
          ...b,
          alive: false,
          inIsr: false,
          checkpoint: 'bad',
          status: 'pod restarting',
          fill: 0.9,
        };
      }
      return {
        ...b,
        alive: true,
        inIsr: false,
        checkpoint: 'bad',
        status: failed ? 'fetcher stopped' : 'truncate → fetch',
        fill: 0.9,
      };
    });
  }

  if (phase === 'useless') {
    return base.map((b) => {
      if (b.id !== 6) {
        return {...b, fill: 0.84, status: b.id === 0 ? 'leader' : 'in sync'};
      }
      return {
        ...b,
        alive: true,
        inIsr: false,
        checkpoint: 'bad',
        status: 'same bad file on PV',
        fill: 0.9,
      };
    });
  }

  // fix
  const paused = frame >= T(1080);
  const repaired = frame >= T(1180);
  const reloading = frame >= T(1240);
  const catching = frame >= T(1280);
  const joined = frame >= T(1320);

  return base.map((b) => {
    if (b.id !== 6) {
      return {
        ...b,
        fill: catching ? interpolate(frame, [T(1280), T(1350)], [0.84, 0.9], clamp) : 0.84,
        status: b.id === 0 ? 'leader' : 'in sync',
      };
    }
    return {
      ...b,
      alive: true,
      inIsr: joined,
      checkpoint: repaired ? 'fixed' : paused ? 'fixing' : 'bad',
      status: !paused
        ? 'stuck'
        : !repaired
          ? 'operator paused'
          : !reloading
            ? 'checkpoint edited'
            : !catching
              ? 'reloading file'
              : !joined
                ? 'catching up'
                : 'in ISR',
      fill: catching
        ? interpolate(frame, [T(1280), T(1350)], [0.35, 0.9], {...clamp, easing: ease})
        : repaired
          ? 0.35
          : 0.9,
    };
  });
};

const headerFor = (phase: Phase) => {
  switch (phase) {
    case 'hook':
    case 'healthy':
      return {kicker: 'Healthy cluster', title: 'Three replicas. Full ISR. Replication flowing.', color: theme.ok};
    case 'upgrade':
      return {kicker: 'Operator upgrade', title: 'Rolling restart reaches broker 6.', color: theme.crimson};
    case 'countdown':
      return {
        kicker: 'Graceful shutdown',
        title: 'Kafka needs to flush leader-epoch-checkpoint.',
        color: theme.crimson,
      };
    case 'kill':
      return {kicker: 'Unclean shutdown', title: '30s ran out. Kubernetes sends SIGKILL.', color: theme.crimson};
    case 'stuck':
      return {kicker: 'Stuck ISR', title: 'Broker 6 comes back — and never rejoins.', color: theme.crimson};
    case 'useless':
      return {kicker: 'Why restarts fail', title: 'The bad file lives on the persistent volume.', color: theme.crimson};
    case 'fix':
      return {kicker: 'The fix', title: 'Pause the operator. Repair the checkpoint.', color: theme.ok};
    default:
      return {kicker: '', title: '', color: theme.crimson};
  }
};

const captionFor = (frame: number, phase: Phase) => {
  if (phase === 'hook' || phase === 'healthy') {
    return 'Leader appends. Followers fetch. ISR stays full.';
  }
  if (phase === 'upgrade') {
    return 'A routine Event Streams / Strimzi upgrade starts the drain.';
  }
  if (phase === 'countdown') {
    return 'Default terminationGracePeriodSeconds is only 30. The checkpoint write is still in flight.';
  }
  if (phase === 'kill') {
    return 'Process dies mid-write. Log segments look fine. The epoch map does not.';
  }
  if (phase === 'stuck') {
    if (frame < T(650)) {
      return 'On restart, broker 6 truncates using the lying checkpoint, then tries to fetch.';
    }
    return 'UnexpectedAppendOffsetException → fetcher marks the partition failed. Silence.';
  }
  if (phase === 'useless') {
    return 'New JVM, same volume, same broken leader-epoch-checkpoint. ISR stays short.';
  }
  if (phase === 'fix') {
    if (frame < T(1180)) return 'Scale the cluster operator to 0 before touching disk.';
    if (frame < T(1240)) return 'Diff checkpoints. Keep the epoch map the healthy replicas agree on.';
    if (frame < T(1320)) return 'Restart the pod so Kafka reloads the corrected file and catches up.';
    return 'ISR is full again. Only then scale the operator back to 1.';
  }
  return '';
};

const BrokerColumn: React.FC<{
  broker: BrokerState;
  index: number;
  frame: number;
  phase: Phase;
}> = ({broker, index, frame, phase}) => {
  const x = START_X + index * (COL_W + GAP);
  const enter = fade(frame, 50 + index * 8, 70 + index * 8);
  const dim = !broker.alive ? 0.35 : 1;
  const border =
    broker.checkpoint === 'bad'
      ? 'rgba(220,20,60,0.55)'
      : broker.inIsr
        ? theme.line
        : 'rgba(220,20,60,0.35)';
  const barColor =
    broker.checkpoint === 'bad'
      ? theme.crimson
      : broker.inIsr
        ? phase === 'fix' && broker.id === 6 && frame > T(1280)
          ? theme.ok
          : '#3a3a3a'
        : theme.crimson;
  const shaking =
    phase === 'countdown' && broker.id === 6
      ? Math.sin(frame / 2) * 2
      : phase === 'kill' && broker.id === 6 && frame < T(520)
        ? Math.sin(frame) * 4
        : 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: WELL_TOP - 48,
        width: COL_W,
        opacity: enter * dim,
        transform: `translateX(${shaking}px)`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12}}>
        <div style={{fontFamily: font.mono, fontSize: 16, letterSpacing: '0.14em', color: theme.dim}}>
          BROKER {broker.id}
        </div>
        <div
          style={{
            fontFamily: font.mono,
            fontSize: 13,
            letterSpacing: '0.12em',
            color: !broker.alive ? theme.faint : broker.inIsr ? theme.ok : theme.crimson,
          }}
        >
          {!broker.alive ? 'DOWN' : broker.inIsr ? 'IN ISR' : 'OUT'}
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          height: WELL_H,
          border: `1px solid ${border}`,
          background: theme.surface,
          overflow: 'hidden',
        }}
      >
        {!broker.alive ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: font.mono,
              fontSize: 22,
              color: theme.crimson,
              letterSpacing: '0.12em',
              background: 'rgba(10,10,10,0.55)',
              zIndex: 2,
            }}
          >
            OFFLINE
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
            height: Math.max(8, broker.fill * (WELL_H - 24)),
            background: barColor,
            opacity: broker.alive ? 1 : 0.4,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: 16,
            top: 16,
            right: 16,
            fontFamily: font.mono,
            fontSize: 14,
            color: theme.dim,
          }}
        >
          {broker.role}
        </div>

        <CheckpointBadge state={broker.checkpoint} />
      </div>

      <div style={{marginTop: 14, fontFamily: font.mono, fontSize: 16, color: theme.muted}}>
        {broker.status}
      </div>
    </div>
  );
};

const CheckpointBadge: React.FC<{state: BrokerState['checkpoint']}> = ({state}) => {
  const label =
    state === 'ok'
      ? 'checkpoint ok'
      : state === 'bad'
        ? 'checkpoint BAD'
        : state === 'fixing'
          ? 'editing…'
          : 'checkpoint fixed';
  const color =
    state === 'ok' || state === 'fixed' ? theme.ok : state === 'fixing' ? theme.muted : theme.crimson;

  return (
    <div
      style={{
        position: 'absolute',
        left: 16,
        bottom: 16,
        padding: '6px 10px',
        border: `1px solid ${color}`,
        background: 'rgba(10,10,10,0.85)',
        fontFamily: font.mono,
        fontSize: 13,
        letterSpacing: '0.06em',
        color,
        zIndex: 3,
      }}
    >
      {label}
    </div>
  );
};

const ReplicationPackets: React.FC<{frame: number; phase: Phase}> = ({frame, phase}) => {
  const packets = Array.from({length: 8}, (_, i) => {
    const start = (phase === 'fix' ? T(1280) : T(90)) + i * 18;
    const t = interpolate(frame, [start, start + 22], [0, 1], clamp);
    if (t <= 0 || t >= 1) return null;
    const fromX = START_X + COL_W / 2;
    const targets = [1, 2];
    const target = targets[i % 2];
    const toX = START_X + target * (COL_W + GAP) + COL_W / 2;
    const x = interpolate(t, [0, 1], [fromX, toX]);
    const y = WELL_TOP + 120 + (i % 3) * 28;
    const opacity = interpolate(t, [0, 0.15, 0.85, 1], [0, 1, 1, 0], clamp);
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x - 18,
          top: y,
          width: 36,
          height: 10,
          background: phase === 'fix' ? theme.ok : '#525252',
          opacity,
          zIndex: 4,
        }}
      />
    );
  });
  return <>{packets}</>;
};

const FetchFailCallout: React.FC<{frame: number; phase: Phase}> = ({frame, phase}) => {
  const show =
    phase === 'stuck'
      ? fade(frame, T(660), T(690)) * interpolate(frame, [T(820), T(850)], [1, 0], clamp)
      : fade(frame, T(880), T(910));
  if (show <= 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        top: 214,
        width: 420,
        opacity: show,
        border: `1px solid rgba(220,20,60,0.45)`,
        background: 'rgba(10,10,10,0.92)',
        padding: '20px 22px 18px',
        zIndex: 6,
      }}
    >
      <div
        style={{
          fontFamily: font.mono,
          fontSize: 12,
          letterSpacing: '0.16em',
          color: theme.crimson,
          textTransform: 'uppercase',
        }}
      >
        broker 6 fetcher
      </div>
      <div style={{marginTop: 12, fontFamily: font.mono, fontSize: 18, lineHeight: 1.45}}>
        UnexpectedAppendOffsetException
      </div>
      <div style={{marginTop: 10, fontSize: 18, color: theme.muted, lineHeight: 1.35}}>
        Truncated to the wrong offset. Partition marked failed. No more fetch attempts.
      </div>
    </div>
  );
};

const FixSteps: React.FC<{frame: number}> = ({frame}) => {
  const steps = [
    {at: T(1060), label: '01 pause operator'},
    {at: T(1160), label: '02 repair checkpoint'},
    {at: T(1240), label: '03 reload / catch up'},
    {at: T(1320), label: '04 ISR full'},
  ];

  return (
    <div
      style={{
        position: 'absolute',
        right: 120,
        top: 210,
        width: 280,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        zIndex: 6,
      }}
    >
      {steps.map((s) => {
        const on = frame >= s.at;
        const opacity = fade(frame, s.at, s.at + 16);
        return (
          <div
            key={s.label}
            style={{
              opacity,
              padding: '12px 14px',
              border: `1px solid ${on ? 'rgba(110,231,168,0.35)' : theme.line}`,
              background: 'rgba(10,10,10,0.9)',
              fontFamily: font.mono,
              fontSize: 15,
              color: on ? theme.ok : theme.dim,
              letterSpacing: '0.04em',
            }}
          >
            {s.label}
          </div>
        );
      })}
    </div>
  );
};

const PreventCard: React.FC<{frame: number}> = ({frame}) => {
  const local = frame - PREVENT_AT;
  const y = interpolate(local, [0, 24], [16, 0], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{padding: '110px 140px', transform: `translateY(${y}px)`}}>
      <Kicker>Before the next upgrade</Kicker>
      <div
        style={{
          marginTop: 22,
          fontSize: 56,
          fontWeight: 520,
          letterSpacing: -1.1,
          lineHeight: 1.1,
          maxWidth: 1300,
        }}
      >
        Give Kafka time to flush.
        <br />
        <span style={{color: theme.muted}}>30 seconds is often not enough.</span>
      </div>
      <div
        style={{
          marginTop: 56,
          border: `1px solid ${theme.line}`,
          background: theme.surface,
          padding: '36px 40px',
          maxWidth: 980,
          fontFamily: font.mono,
          fontSize: 30,
          lineHeight: 1.55,
          color: theme.muted,
        }}
      >
        <div>
          <span style={{color: theme.dim}}>terminationGracePeriodSeconds:</span>{' '}
          <span style={{color: theme.ok}}>120</span>
        </div>
        <div style={{marginTop: 24, fontSize: 22, color: theme.dim, maxWidth: 820}}>
          A clean shutdown almost never leaves a broken epoch checkpoint. A mid-write SIGKILL often does.
        </div>
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{frame: number}> = ({frame}) => {
  const local = frame - END_AT;
  const opacity = fade(local, 0, 20);
  const y = interpolate(local, [0, 24], [16, 0], {...clamp, easing: ease});

  return (
    <AbsoluteFill style={{justifyContent: 'center', padding: '0 140px', opacity}}>
      <div style={{transform: `translateY(${y}px)`}}>
        <Kicker>Remember</Kicker>
        <div
          style={{
            marginTop: 22,
            maxWidth: 1200,
            fontSize: 64,
            fontWeight: 520,
            letterSpacing: -1.3,
            lineHeight: 1.08,
          }}
        >
          Pause first.
          <br />
          Fix the checkpoint.
          <br />
          <span style={{color: theme.muted}}>Then bring the operator back.</span>
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
