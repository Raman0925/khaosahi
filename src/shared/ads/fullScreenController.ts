import { warnDev } from './config';
import { type FullScreenAdKind, isAdFresh, retryDelayMs } from './logic/caps';
import { setAdsRuntime } from './runtime';
import { useAdsStore } from './store';

/** SDK ad events the controller reacts to. The format module wires them to the SDK instance. */
export type FullScreenAdHandlers = {
  loaded: () => void;
  error: (error?: unknown) => void;
  opened: () => void;
  closed: () => void;
  earnedReward: () => void;
};

/** The subset of an SDK full-screen ad (InterstitialAd / RewardedAd / AppOpenAd) we use. */
export type ShowableAd = {
  load: () => void;
  show: () => Promise<void>;
  destroy: () => void;
};

/** Creates a fresh SDK ad instance and wires its events to `handlers`. */
export type FullScreenAdFactory = (handlers: FullScreenAdHandlers) => ShowableAd;

export type ShowResult = { opened: boolean; earned: boolean };

export type FullScreenController = {
  readonly kind: FullScreenAdKind;
  /** Starts loading unless already loaded/loading. */
  load: () => void;
  isLoaded: () => boolean;
  /** Loaded and not expired. */
  isReady: (now: number) => boolean;
  /** Replaces an expired ad (or starts loading if none); no-op while a fresh ad is loaded. */
  ensureFresh: (now: number) => void;
  /** Notified whenever the loaded state changes. */
  subscribe: (listener: () => void) => () => void;
  /** Shows the ad if ready. Resolves when it closes (or immediately with `opened: false`). */
  show: () => Promise<ShowResult>;
  /** Resolves true once loaded, false on failure or after `timeoutMs`. */
  waitUntilLoaded: (timeoutMs: number) => Promise<boolean>;
  dispose: () => void;
};

const NOT_SHOWN: ShowResult = { opened: false, earned: false };

/**
 * Preload/show/reload state machine shared by interstitial, rewarded and app open ads.
 * Retries failed loads with exponential backoff; recreates the ad when it has expired.
 */
export function createFullScreenController(
  kind: FullScreenAdKind,
  factory: FullScreenAdFactory,
  options: {
    /** Preload the next ad as soon as one closes (false for app open: it is loaded on demand). */
    reloadAfterClose?: boolean;
    now?: () => number;
  } = {},
): FullScreenController {
  const { reloadAfterClose = true, now = Date.now } = options;
  let ad: ShowableAd | null = null;
  let generation = 0;
  let loaded = false;
  let loading = false;
  let loadedAt: number | null = null;
  let failures = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;
  let showing: (ShowResult & { resolve: (result: ShowResult) => void }) | null = null;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach(listener => listener());

  function finishShow(): void {
    if (!showing) {
      return;
    }
    const { resolve, opened, earned } = showing;
    showing = null;
    setAdsRuntime({ isShowingFullScreenAd: false });
    resolve({ opened, earned });
  }

  function clearRetry(): void {
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  }

  function createAd(): ShowableAd {
    generation += 1;
    const mine = generation;
    const isCurrent = () => mine === generation && !disposed;
    return factory({
      loaded: () => {
        if (!isCurrent()) {
          return;
        }
        loading = false;
        loaded = true;
        loadedAt = now();
        failures = 0;
        notify();
      },
      error: error => {
        if (!isCurrent()) {
          return;
        }
        if (showing) {
          warnDev(`${kind} failed to show`, error);
          finishShow();
          recreate();
          return;
        }
        loading = false;
        loaded = false;
        loadedAt = null;
        failures += 1;
        warnDev(`${kind} failed to load`, error);
        clearRetry();
        retryTimer = setTimeout(() => {
          retryTimer = null;
          load();
        }, retryDelayMs(failures));
        notify();
      },
      opened: () => {
        if (isCurrent() && showing) {
          showing.opened = true;
          useAdsStore.getState().recordFullScreenAdShown(kind, now());
        }
      },
      earnedReward: () => {
        if (isCurrent() && showing) {
          showing.earned = true;
        }
      },
      closed: () => {
        if (!isCurrent()) {
          return;
        }
        finishShow();
        loaded = false;
        loadedAt = null;
        notify();
        if (reloadAfterClose) {
          load();
        }
      },
    });
  }

  function load(): void {
    if (disposed || loaded || loading) {
      return;
    }
    clearRetry();
    ad ??= createAd();
    loading = true;
    try {
      ad.load();
    } catch (error) {
      loading = false;
      warnDev(`${kind} load threw`, error);
    }
  }

  /** Drops the current (expired or broken) ad and loads a new one. */
  function recreate(): void {
    ad?.destroy();
    ad = null;
    generation += 1;
    loaded = false;
    loading = false;
    loadedAt = null;
    notify();
    load();
  }

  function isReady(at: number): boolean {
    return loaded && isAdFresh(loadedAt, at, kind);
  }

  function ensureFresh(at: number): void {
    if (showing || isReady(at)) {
      return;
    }
    if (loaded) {
      recreate();
    } else if (retryTimer === null) {
      load(); // a pending backoff retry is left alone
    }
  }

  function show(): Promise<ShowResult> {
    if (disposed || showing || !ad) {
      return Promise.resolve(NOT_SHOWN);
    }
    if (!isReady(now())) {
      ensureFresh(now());
      return Promise.resolve(NOT_SHOWN);
    }
    const current = ad;
    return new Promise(resolve => {
      showing = { opened: false, earned: false, resolve };
      setAdsRuntime({ isShowingFullScreenAd: true });
      current.show().catch(error => {
        warnDev(`${kind} show rejected`, error);
        finishShow();
        recreate();
      });
    });
  }

  function waitUntilLoaded(timeoutMs: number): Promise<boolean> {
    if (isReady(now())) {
      return Promise.resolve(true);
    }
    ensureFresh(now());
    if (!loading) {
      return Promise.resolve(false); // disposed or load threw
    }
    return new Promise(resolve => {
      const settle = (result: boolean) => {
        clearTimeout(timer);
        listeners.delete(listener);
        resolve(result);
      };
      const listener = () => {
        if (loaded || !loading) {
          settle(loaded);
        }
      };
      const timer = setTimeout(() => settle(false), timeoutMs);
      listeners.add(listener);
    });
  }

  return {
    kind,
    load,
    isLoaded: () => loaded,
    isReady,
    ensureFresh,
    subscribe: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    show,
    waitUntilLoaded,
    dispose: () => {
      finishShow();
      disposed = true;
      clearRetry();
      ad?.destroy();
      ad = null;
      loaded = false;
      loading = false;
      notify();
      listeners.clear();
    },
  };
}
