import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { z } from 'zod';

import { mmkvPersistOptions } from '@/shared/storage/persist';
import { registerStoreReset } from '@/shared/storage/reset';

/**
 * App-wide preferences and onboarding flags (read by many features, so it lives in shared/).
 * Stored in MMKV. Health data does NOT belong here — see `shared/profile`.
 */
export const LANGUAGES = ['en', 'hi'] as const;
export type Language = (typeof LANGUAGES)[number];

export const preferencesSchema = z.object({
  /** `null` until the user picks a language on the first onboarding screen. */
  language: z.enum(LANGUAGES).nullable(),
  lengthUnit: z.enum(['cm', 'in']),
  weightUnit: z.enum(['kg', 'lb']),
  disclaimerAcceptedAt: z.string().nullable(),
  consentAcceptedAt: z.string().nullable(),
  ageConfirmedAt: z.string().nullable(),
  /** Set when onboarding (incl. profile setup) is finished. Main app is shown only after this. */
  onboardingCompletedAt: z.string().nullable(),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = {
  language: null,
  lengthUnit: 'cm',
  weightUnit: 'kg',
  disclaimerAcceptedAt: null,
  consentAcceptedAt: null,
  ageConfirmedAt: null,
  onboardingCompletedAt: null,
};

type PreferencesActions = {
  setLanguage: (language: Language) => void;
  setLengthUnit: (unit: Preferences['lengthUnit']) => void;
  setWeightUnit: (unit: Preferences['weightUnit']) => void;
  acceptDisclaimer: (now?: Date) => void;
  acceptConsent: (now?: Date) => void;
  confirmAge: (now?: Date) => void;
  completeOnboarding: (now?: Date) => void;
  reset: () => void;
};

export type PreferencesState = Preferences & PreferencesActions;

export const usePreferences = create<PreferencesState>()(
  persist(
    set => ({
      ...DEFAULT_PREFERENCES,
      setLanguage: language => set({ language }),
      setLengthUnit: lengthUnit => set({ lengthUnit }),
      setWeightUnit: weightUnit => set({ weightUnit }),
      acceptDisclaimer: (now = new Date()) => set({ disclaimerAcceptedAt: now.toISOString() }),
      acceptConsent: (now = new Date()) => set({ consentAcceptedAt: now.toISOString() }),
      confirmAge: (now = new Date()) => set({ ageConfirmedAt: now.toISOString() }),
      completeOnboarding: (now = new Date()) => set({ onboardingCompletedAt: now.toISOString() }),
      reset: () => set(DEFAULT_PREFERENCES),
    }),
    mmkvPersistOptions<PreferencesState, Preferences>('preferences', preferencesSchema, {
      partialize: state => ({
        language: state.language,
        lengthUnit: state.lengthUnit,
        weightUnit: state.weightUnit,
        disclaimerAcceptedAt: state.disclaimerAcceptedAt,
        consentAcceptedAt: state.consentAcceptedAt,
        ageConfirmedAt: state.ageConfirmedAt,
        onboardingCompletedAt: state.onboardingCompletedAt,
      }),
    }),
  ),
);

/** Selector hook used by the navigator to switch between onboarding and the main app. */
export function useIsOnboarded(): boolean {
  return usePreferences(state => state.onboardingCompletedAt !== null);
}

export function useIsNotOnboarded(): boolean {
  return !useIsOnboarded();
}

registerStoreReset(() => usePreferences.getState().reset());
