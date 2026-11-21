import { act, fireEvent, screen } from '@testing-library/react-native';
import notifee, { AuthorizationStatus } from 'react-native-notify-kit';

import { useReminderSettings } from '@/shared/notifications';
import { usePlanStore } from '@/shared/plan';

import { pickTime } from '../pickers';
import { renderStack } from '../testing/renderStack';

jest.mock('../pickers', () => ({ pickDate: jest.fn(), pickTime: jest.fn() }));

const mocked = jest.mocked(notifee);
type Settings = Awaited<ReturnType<typeof notifee.getNotificationSettings>>;
const status = (authorizationStatus: AuthorizationStatus) => ({ authorizationStatus }) as Settings;

beforeEach(async () => {
  jest.clearAllMocks();
  await act(() => {
    useReminderSettings.getState().reset();
    usePlanStore.getState().reset();
  });
});

describe('RemindersScreen', () => {
  it('asks for permission when a reminder is first turned on, then shows its options', async () => {
    mocked.getNotificationSettings.mockResolvedValueOnce(
      status(AuthorizationStatus.NOT_DETERMINED),
    );
    mocked.requestPermission.mockResolvedValueOnce(status(AuthorizationStatus.AUTHORIZED));
    jest.mocked(pickTime).mockResolvedValueOnce(new Date(2000, 0, 1, 19, 45));
    await renderStack('Reminders');

    await fireEvent(screen.getByTestId('reminder-daily-switch'), 'valueChange', true);
    expect(mocked.requestPermission).toHaveBeenCalledTimes(1);
    expect(useReminderSettings.getState().daily.enabled).toBe(true);

    await fireEvent.press(screen.getByTestId('reminder-daily-time'));
    expect(useReminderSettings.getState().daily.time).toEqual({ hour: 19, minute: 45 });
  });

  it('keeps the reminder off and explains when permission is denied', async () => {
    mocked.getNotificationSettings.mockResolvedValueOnce(status(AuthorizationStatus.DENIED));
    mocked.requestPermission.mockResolvedValueOnce(status(AuthorizationStatus.DENIED));
    await renderStack('Reminders');

    await fireEvent(screen.getByTestId('reminder-water-switch'), 'valueChange', true);
    expect(useReminderSettings.getState().water.enabled).toBe(false);
    expect(screen.getByTestId('reminders-denied')).toBeTruthy();

    await fireEvent.press(screen.getByText('Open phone settings'));
    expect(mocked.openNotificationSettings).toHaveBeenCalled();
  });

  it('lets the user pick the weigh-in day and water interval', async () => {
    await act(() => {
      useReminderSettings.getState().setEnabled('weighIn', true);
      useReminderSettings.getState().setEnabled('water', true);
    });
    await renderStack('Reminders');
    await fireEvent.press(screen.getByText('Wednesday'));
    await fireEvent.press(screen.getByText('Every 2 hours'));
    expect(useReminderSettings.getState().weighIn.weekday).toBe(3);
    expect(useReminderSettings.getState().water.interval).toBe(2);
  });

  it('turns a reminder off without asking', async () => {
    await act(() => useReminderSettings.getState().setEnabled('daily', true));
    await renderStack('Reminders');
    await fireEvent(screen.getByTestId('reminder-daily-switch'), 'valueChange', false);
    expect(useReminderSettings.getState().daily.enabled).toBe(false);
    expect(mocked.requestPermission).not.toHaveBeenCalled();
  });

  it('shows the retest date from the plan, and disables it without a plan', async () => {
    await renderStack('Reminders');
    expect(screen.getByText('Set up your 90-day plan first.')).toBeTruthy();
    expect(screen.getByTestId('reminder-retest-switch').props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await act(() => {
      usePlanStore.getState().setStartDate('2099-01-01');
      useReminderSettings.getState().setEnabled('retest', true);
    });
    expect(screen.getByText('On 1 Apr 2099')).toBeTruthy();
  });
});
