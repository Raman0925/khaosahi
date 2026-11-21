import { act, fireEvent, screen } from '@testing-library/react-native';
import { Alert, type AlertButton } from 'react-native';

import { usePreferences } from '@/shared/preferences/store';
import { useProgressStore } from '@/shared/progress';
import { wipeAllStorage } from '@/shared/storage';

import { pickDate } from '../pickers';
import { renderStack } from '../testing/renderStack';

jest.mock('react-native-gifted-charts', () => ({ LineChart: () => null }));
jest.mock('../pickers', () => ({ pickDate: jest.fn(), pickTime: jest.fn() }));

const add = (metric: 'weight' | 'alt' | 'ultrasound', date: string, value: number) =>
  useProgressStore.getState().add({ metric, date, value });

beforeEach(async () => {
  jest.clearAllMocks();
  await act(async () => {
    // The progress log is a file: wipe it so earlier tests' entries are not loaded again.
    useProgressStore.getState().reset();
    await wipeAllStorage();
    usePreferences.getState().reset();
  });
});

describe('ProgressScreen', () => {
  it('shows a card per metric with latest value and trend, and opens the entry form', async () => {
    add('weight', '2026-11-01', 82);
    add('weight', '2026-11-08', 81.2);
    await renderStack('Progress');

    expect(screen.getByTestId('progress-card-ultrasound')).toBeTruthy();
    expect(screen.getByText('Latest: 81.2 kg on 8 Nov 2026')).toBeTruthy();
    expect(screen.getByText('↓ Lower than last time')).toBeTruthy();
    expect(screen.getAllByText('No entries yet').length).toBe(5);

    await fireEvent.press(screen.getByLabelText('Add Weight'));
    expect(await screen.findByTestId('progress-entry-screen')).toBeTruthy();
  });

  it('shows values in the preferred unit', async () => {
    await act(() => usePreferences.getState().setWeightUnit('lb'));
    add('weight', '2026-11-01', 80);
    await renderStack('Progress');
    expect(screen.getByText('Latest: 176.4 lb on 1 Nov 2026')).toBeTruthy();
  });
});

describe('ProgressEntryScreen', () => {
  it('validates, converts and saves a new entry, then goes back', async () => {
    await act(() => usePreferences.getState().setWeightUnit('lb'));
    await renderStack('ProgressEntry', { metric: 'weight' });

    await fireEvent.press(screen.getByTestId('progress-entry-save'));
    expect(await screen.findByText('This field is required')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('progress-entry-value'), '20');
    await fireEvent.press(screen.getByTestId('progress-entry-save'));
    expect(await screen.findAllByText('Enter a value between 55.2 and 551.1')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('progress-entry-value'), '176.4');
    await fireEvent.press(screen.getByTestId('progress-entry-save'));
    expect(await screen.findByText('main')).toBeTruthy();
    const [entry] = useProgressStore.getState().entries;
    expect(entry?.metric).toBe('weight');
    expect(entry?.value).toBeCloseTo(80.01, 2);
  });

  it('uses the picked date', async () => {
    jest.mocked(pickDate).mockResolvedValueOnce(new Date(2026, 9, 5));
    await renderStack('ProgressEntry', { metric: 'alt' });
    await fireEvent.press(screen.getByTestId('progress-entry-date'));
    expect(await screen.findByText('5 Oct 2026')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('progress-entry-value'), '42');
    await fireEvent.press(screen.getByTestId('progress-entry-save'));
    await screen.findByText('main');
    expect(useProgressStore.getState().entries[0]).toMatchObject({ date: '2026-10-05', value: 42 });
  });

  it('records ultrasound grades with chips and edits an existing entry', async () => {
    const existing = add('ultrasound', '2026-10-01', 2);
    await renderStack('ProgressEntry', { metric: 'ultrasound', entryId: existing.id });
    expect(screen.getByTestId('grade-2').props.accessibilityState).toMatchObject({
      selected: true,
    });
    await fireEvent.press(screen.getByText('Grade 1'));
    await fireEvent.press(screen.getByTestId('progress-entry-save'));
    await screen.findByText('main');
    expect(useProgressStore.getState().entries).toEqual([
      expect.objectContaining({ id: existing.id, value: 1, date: '2026-10-01' }),
    ]);
  });
});

describe('ProgressMetricScreen', () => {
  it('shows the empty state', async () => {
    await renderStack('ProgressMetric', { metric: 'alt' });
    expect(screen.getByTestId('progress-metric-empty')).toBeTruthy();
  });

  it('shows the single-point state with normal range and status', async () => {
    add('alt', '2026-11-01', 48);
    await renderStack('ProgressMetric', { metric: 'alt' });
    expect(screen.getByTestId('progress-single-point')).toBeTruthy();
    expect(screen.getByText('Normal range (dashed lines): up to 33 U/L')).toBeTruthy();
    expect(screen.getByText(/Lab ranges vary/)).toBeTruthy();
    expect(screen.getByText('Above normal range')).toBeTruthy();
  });

  it('draws a chart with a text alternative and deletes after confirming', async () => {
    const alert = jest.spyOn(Alert, 'alert');
    add('weight', '2026-11-01', 82);
    const second = add('weight', '2026-11-08', 81);
    await renderStack('ProgressMetric', { metric: 'weight' });

    expect(screen.getByTestId('metric-chart').props.accessibilityLabel).toBe(
      'Chart of Weight, 2 entries. Latest 81 kg on 8 Nov 2026. ↓ Lower than last time',
    );
    await fireEvent.press(screen.getByLabelText('Delete 81 kg, 8 Nov 2026'));
    const buttons = alert.mock.calls[0]?.[2] as AlertButton[];
    await act(() => buttons.find(b => b.style === 'destructive')?.onPress?.());
    expect(useProgressStore.getState().entries.map(e => e.id)).not.toContain(second.id);
  });

  it('opens the edit form for an entry', async () => {
    add('weight', '2026-11-01', 82);
    await renderStack('ProgressMetric', { metric: 'weight' });
    await fireEvent.press(screen.getByLabelText('Edit 82 kg, 1 Nov 2026'));
    expect(await screen.findByDisplayValue('82')).toBeTruthy();
  });
});
