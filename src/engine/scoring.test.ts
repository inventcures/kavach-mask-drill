import { describe, expect, test } from 'vitest';
import { memberLeakage, protectionBand, teamProtection } from './scoring';

const team = (...leakages: (number | null)[]) => leakages.map((leakage, i) => ({ id: `m${i}`, leakage }));

describe('team protection', () => {
  test('four members at 4% leakage give team leakage 0.04 and PF 25', () => {
    const p = teamProtection(team(0.04, 0.04, 0.04, 0.04))!;
    expect(p.leakage).toBeCloseTo(0.04, 10);
    expect(p.pf).toBeCloseTo(25, 10);
    expect(p.percent).toBeCloseTo(96, 10);
  });

  test('one member at 35% drags the team to leakage 0.1175, about three times more exposed', () => {
    const p = teamProtection(team(0.04, 0.04, 0.04, 0.35))!;
    expect(p.leakage).toBeCloseTo(0.1175, 10);
    expect(p.pf).toBeCloseTo(8.51, 2);
    expect(p.percent).toBeCloseTo(88.25, 10);
  });

  test('members who are not masked up yet are ignored', () => {
    const p = teamProtection(team(0.04, null, null, 0.35))!;
    expect(p.leakage).toBeCloseTo(0.195, 10);
  });

  test('a team with nobody masked up has no protection reading', () => {
    expect(teamProtection(team(null, null, null, null))).toBeNull();
    expect(teamProtection([])).toBeNull();
  });
});

describe('member leakage', () => {
  test('a well-fitted N95 leaks only what its filter lets through', () => {
    expect(memberLeakage({ mask: 'n95' })).toBeCloseTo(0.03, 10);
  });

  test('a surgical mask chosen for the transfer gives a 0.35 base', () => {
    expect(memberLeakage({ mask: 'surgical' })).toBeCloseTo(0.35, 10);
  });

  test('seal faults and bad stock add to the filter penetration', () => {
    expect(memberLeakage({ mask: 'n95', faults: ['facialHair'] })).toBeCloseTo(0.33, 10);
    expect(memberLeakage({ mask: 'n95', faults: ['nosePinched', 'notUnderChin', 'badStock'] })).toBeCloseTo(0.36, 10);
  });

  test('leakage is capped at 1', () => {
    expect(memberLeakage({ mask: 'none', faults: ['facialHair'] })).toBe(1);
    expect(memberLeakage({ mask: 'cloth', faults: ['facialHair', 'strapsWrong', 'badStock'] })).toBe(1);
  });
});

describe('protection band', () => {
  test('90% and above is good, 70% and above is a warning, anything lower is bad', () => {
    expect(protectionBand(96)).toBe('good');
    expect(protectionBand(90)).toBe('good');
    expect(protectionBand(89.9)).toBe('warn');
    expect(protectionBand(70)).toBe('warn');
    expect(protectionBand(69.9)).toBe('bad');
    expect(protectionBand(0)).toBe('bad');
  });
});

describe('leakage after the seal check', () => {
  test('each harmful seal action adds 3 points of leakage to the base', () => {
    expect(memberLeakage({ mask: 'n95', harmfulSealActions: 2 })).toBeCloseTo(0.09, 10);
  });

  test('harmful seal actions and the stock penalty add up', () => {
    expect(memberLeakage({ mask: 'n95', faults: ['badStock'], harmfulSealActions: 3 })).toBeCloseTo(0.27, 10);
  });

  test('leakage stays capped at 1 however many harmful actions there were', () => {
    expect(memberLeakage({ mask: 'cloth', faults: ['badStock', 'facialHair'], harmfulSealActions: 3 })).toBe(1);
  });
});
