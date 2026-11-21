import notifee, { AuthorizationStatus, EventType, RepeatFrequency } from 'react-native-notify-kit';

import { initI18n } from '@/shared/i18n';
import { navigationRef } from '@/shared/navigation';
import { usePlanStore } from '@/shared/plan';

import {
  cancelAllNotifications,
  requestNotificationPermission,
  syncReminders,
  useReminderSettings,
} from '../index';
import { handleEvent, navigateToTarget } from '../taps';

initI18n();

const mocked = jest.mocked(notifee);

beforeEach(() => {
  jest.clearAllMocks();
  useReminderSettings.getState().reset();
  usePlanStore.getState().reset();
  mocked.getTriggerNotificationIds.mockResolvedValue(['reminder.daily', 'other.thing']);
});

describe('syncReminders', () => {
  it('creates the channel, cancels only our reminders and schedules enabled ones', async () => {
    useReminderSettings.setState({
      daily: { enabled: true, time: { hour: 8, minute: 0 } },
      weighIn: { enabled: true, weekday: 0, time: { hour: 8, minute: 0 } },
    });
    await syncReminders();

    expect(mocked.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'reminders' }));
    expect(mocked.cancelTriggerNotifications).toHaveBeenCalledWith(['reminder.daily']);
    const calls = mocked.createTriggerNotification.mock.calls;
    expect(calls.map(([n]) => n.id)).toEqual(['reminder.daily', 'reminder.weighIn']);
    const [daily, weighIn] = calls;
    expect(daily?.[0].data).toEqual({ target: 'today' });
    expect(daily?.[0].title).toBe('Time for today’s checklist');
    expect(daily?.[1]).toMatchObject({ repeatFrequency: RepeatFrequency.DAILY });
    expect(weighIn?.[1]).toMatchObject({ repeatFrequency: RepeatFrequency.WEEKLY });
    expect(weighIn?.[0].data).toEqual({ target: 'weighIn' });
  });

  it('is idempotent and re-syncs when settings or the plan change', async () => {
    await syncReminders();
    expect(mocked.createTriggerNotification).not.toHaveBeenCalled();

    useReminderSettings.getState().setEnabled('retest', true);
    usePlanStore.getState().setStartDate('2099-01-01');
    await syncReminders(); // waits for the queued syncs too
    const ids = mocked.createTriggerNotification.mock.calls.map(([n]) => n.id);
    expect(ids).toContain('reminder.retest');
    expect(mocked.cancelTriggerNotifications.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});

describe('cancelAllNotifications', () => {
  it('cancels everything', async () => {
    await cancelAllNotifications();
    expect(mocked.cancelAllNotifications).toHaveBeenCalled();
  });
});

describe('requestNotificationPermission', () => {
  const settings = (authorizationStatus: AuthorizationStatus) =>
    ({ authorizationStatus }) as Awaited<ReturnType<typeof notifee.getNotificationSettings>>;

  it('does not ask again when already allowed', async () => {
    mocked.getNotificationSettings.mockResolvedValueOnce(settings(AuthorizationStatus.AUTHORIZED));
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(mocked.requestPermission).not.toHaveBeenCalled();
  });

  it('asks and reports a denial', async () => {
    mocked.getNotificationSettings.mockResolvedValueOnce(
      settings(AuthorizationStatus.NOT_DETERMINED),
    );
    mocked.requestPermission.mockResolvedValueOnce(settings(AuthorizationStatus.DENIED));
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });
});

describe('notification taps', () => {
  afterEach(() => jest.restoreAllMocks());

  function mockNavigation(routeNames: string[]) {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(true);
    jest
      .spyOn(navigationRef, 'getRootState')
      .mockReturnValue({ routeNames } as unknown as ReturnType<typeof navigationRef.getRootState>);
    return jest.spyOn(navigationRef, 'navigate').mockImplementation(() => undefined);
  }

  it('maps targets to screens', () => {
    const navigate = mockNavigation(['Main', 'ProgressEntry']);
    navigateToTarget('today');
    navigateToTarget('progress');
    navigateToTarget('weighIn');
    expect(navigate.mock.calls).toEqual([
      ['Main', { screen: 'Today' }],
      ['Main', { screen: 'Progress' }],
      ['ProgressEntry', { metric: 'weight' }],
    ]);
  });

  it('ignores taps during onboarding', () => {
    const navigate = mockNavigation(['OnboardingLanguage']);
    expect(navigateToTarget('today')).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates on a press event with a known target only', () => {
    const navigate = mockNavigation(['Main']);
    handleEvent({
      type: EventType.PRESS,
      detail: { notification: { data: { target: 'progress' } } },
    });
    handleEvent({
      type: EventType.DISMISSED,
      detail: { notification: { data: { target: 'today' } } },
    });
    handleEvent({ type: EventType.PRESS, detail: { notification: { data: { target: 'nope' } } } });
    expect(navigate.mock.calls).toEqual([['Main', { screen: 'Progress' }]]);
  });

  it('waits for the navigator on cold start', () => {
    jest.spyOn(navigationRef, 'isReady').mockReturnValue(false);
    let onReady: (() => void) | undefined;
    jest.spyOn(navigationRef, 'addListener').mockImplementation(((_: string, cb: () => void) => {
      onReady = cb;
      return () => undefined;
    }) as typeof navigationRef.addListener);
    handleEvent({ type: EventType.PRESS, detail: { notification: { data: { target: 'today' } } } });

    const navigate = mockNavigation(['Main']);
    onReady?.();
    expect(navigate).toHaveBeenCalledWith('Main', { screen: 'Today' });
  });
});
