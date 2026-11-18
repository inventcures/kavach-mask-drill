import { useState } from 'preact/hooks';
import { memberLeakage } from '../../engine/scoring';
import { Meter } from '../components/Meter';
import { TeamRow, type TeamMember } from '../components/TeamRow';
import { t, type Lang } from '../i18n';

const NAMES = ['You', 'Ravi', 'Anjali', 'Faiz'];
const IDS = ['you', 'ravi', 'anjali', 'faiz'];

/** Developer-only presets (English labels on purpose; players never see this page). */
const PRESETS: { label: string; leakages: (number | null)[] }[] = [
  { label: 'Four good seals (4% each)', leakages: [0.04, 0.04, 0.04, 0.04] },
  { label: 'One beard under the seal (35%)', leakages: [0.04, 0.35, 0.04, 0.04] },
  {
    label: 'Surgical masks, two not masked yet',
    leakages: [memberLeakage({ mask: 'surgical' }), memberLeakage({ mask: 'surgical', faults: ['facialHair'] }), null, null],
  },
  { label: 'Nobody masked up', leakages: [null, null, null, null] },
];

/** Story page for the meter and team row, at `#/dev/meter`. Not linked from the game. */
export function MeterDemo({ lang }: { lang: Lang }) {
  const [preset, setPreset] = useState(1);
  const members: TeamMember[] = PRESETS[preset]!.leakages.map((leakage, i) => ({ id: IDS[i]!, name: NAMES[i]!, leakage }));
  return (
    <>
      <Meter lang={lang} members={members} />
      <main>
        <section class="card">
          <h2>{t(lang, 'team.heading')}</h2>
          <TeamRow lang={lang} members={members} />
        </section>
        <section class="card">
          {PRESETS.map((p, i) => (
            <button type="button" class="btn" aria-pressed={i === preset} onClick={() => setPreset(i)}>
              {p.label}
            </button>
          ))}
        </section>
      </main>
    </>
  );
}
