import { describe, expect, it } from 'vitest';
import { alerts, type Alert } from '@/sample-data';
import {
  alertFilterReducer,
  applyAlertFilters,
  createDefaultFilters,
  getAlertFacetCounts,
  getAlertHistogram,
  getAppliedFilterCount,
} from './filters';

const now = Date.parse('2026-10-06T12:00:00.000Z');
const makeAlert = (id: string, overrides: Partial<Alert> = {}): Alert => ({
  ...alerts[0],
  id,
  title: 'Encoded PowerShell execution',
  severity: 'high',
  status: 'new',
  source: 'EDR',
  lastSeen: '2026-10-06T11:00:00.000Z',
  assignee: undefined,
  tags: ['execution', 'production'],
  ...overrides,
});

describe('shared alert filters', () => {
  it('combines OR facets, AND groups, case-insensitive search and positive/negative rules', () => {
    const rows = [
      makeAlert('critical', { severity: 'critical' }),
      makeAlert('high'),
      makeAlert('medium', { severity: 'medium' }),
      makeAlert('other-source', { source: 'Identity' }),
      makeAlert('suppressed', { tags: ['execution', 'suppressed'] }),
    ];
    const state = {
      ...createDefaultFilters(),
      severities: ['critical', 'high'] as Alert['severity'][],
      sources: ['EDR'] as Alert['source'][],
      query: 'pOwErShElL',
      rules: [
        { id: 'exclude', field: 'tags' as const, operator: 'is-not' as const, value: 'suppressed' },
        { id: 'include', field: 'tags' as const, operator: 'contains' as const, value: 'EXEC' },
      ],
    };
    expect(applyAlertFilters(rows, state, now).map((row) => row.id)).toEqual(['critical', 'high']);
    expect(applyAlertFilters(rows, { ...state, assignees: ['unassigned'] }, now)).toHaveLength(2);
    expect(
      applyAlertFilters(
        rows,
        {
          ...state,
          rules: [
            { id: 'exclude-all', field: 'title', operator: 'not-contains', value: 'powershell' },
          ],
        },
        now,
      ),
    ).toEqual([]);
  });

  it('uses inclusive last-seen boundaries and preserves every match in histogram bins', () => {
    const rows = [
      makeAlert('start', { lastSeen: '2026-10-05T12:00:00.000Z' }),
      makeAlert('middle'),
      makeAlert('end', { lastSeen: '2026-10-06T12:00:00.000Z' }),
      makeAlert('old', { lastSeen: '2026-10-05T11:59:59.999Z' }),
      makeAlert('future', { lastSeen: '2026-10-06T12:00:00.001Z' }),
      makeAlert('invalid', { lastSeen: 'invalid' }),
    ];
    const state = createDefaultFilters();
    expect(applyAlertFilters(rows, state, now).map((row) => row.id)).toEqual([
      'start',
      'middle',
      'end',
    ]);
    const bins = getAlertHistogram(rows, state, now, 24);
    expect(bins).toHaveLength(24);
    expect(bins[0].count).toBe(1);
    expect(bins[23].count).toBe(2);
    expect(bins.reduce((sum, bin) => sum + bin.count, 0)).toBe(3);
    expect(
      applyAlertFilters(
        rows,
        {
          ...state,
          timeRange: {
            mode: 'absolute',
            from: '2026-10-06T11:00:00.000Z',
            to: '2026-10-06T11:00:00.000Z',
          },
        },
        now,
      ).map((row) => row.id),
    ).toEqual(['middle']);
  });

  it('keeps panel toggles, bar chips, rules and clear-all synchronized without mutating prior state', () => {
    const initial = createDefaultFilters();
    let state = alertFilterReducer(initial, {
      type: 'patch',
      patch: { severities: ['critical'], sources: ['EDR'] },
    });
    const priorSeverities = state.severities;
    state = alertFilterReducer(state, { type: 'toggle-facet', facet: 'severities', value: 'high' });
    expect(state.severities).toEqual(['critical', 'high']);
    expect(priorSeverities).toEqual(['critical']);
    // Removing a chip uses the identical transition as unchecking its panel facet.
    state = alertFilterReducer(state, {
      type: 'toggle-facet',
      facet: 'severities',
      value: 'critical',
    });
    expect(state.severities).toEqual(['high']);
    state = alertFilterReducer(state, {
      type: 'add-rule',
      rule: { id: 'rule', field: 'entity', operator: 'contains', value: ' workstation ' },
    });
    expect(state.rules[0].value).toBe('workstation');
    expect(getAppliedFilterCount(state)).toBe(3);
    state = alertFilterReducer(state, { type: 'remove-rule', id: 'rule' });
    state = alertFilterReducer(state, {
      type: 'patch',
      patch: { query: 'T1059', timeRange: { mode: 'relative', preset: '7d' } },
    });
    expect(getAppliedFilterCount(state)).toBe(4);
    expect(alertFilterReducer(state, { type: 'reset' })).toEqual(createDefaultFilters());
    expect(initial).toEqual(createDefaultFilters());
  });

  it('counts alternate values within one facet while honoring the remaining groups and unassigned ownership', () => {
    const rows = [
      makeAlert('critical', { severity: 'critical' }),
      makeAlert('high'),
      makeAlert('low', { severity: 'low' }),
      makeAlert('firewall', { severity: 'critical', source: 'Firewall' }),
    ];
    const state = {
      ...createDefaultFilters(),
      severities: ['critical'] as Alert['severity'][],
      sources: ['EDR'] as Alert['source'][],
    };
    expect(getAlertFacetCounts(rows, state, 'severities', now)).toEqual({
      critical: 1,
      high: 1,
      low: 1,
    });
    expect(getAlertFacetCounts(rows, state, 'sources', now)).toEqual({ EDR: 1, Firewall: 1 });
    expect(getAlertFacetCounts(rows, state, 'assignees', now)).toEqual({ unassigned: 1 });
    expect(applyAlertFilters(rows, state, now).map((row) => row.id)).toEqual(['critical']);
  });
});
