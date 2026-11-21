import { zodResolver } from '@hookform/resolvers/zod';
import React, { useMemo } from 'react';
import { type Control, Controller, useForm, useWatch } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePreferences } from '@/shared/preferences/store';
import {
  CONDITIONS,
  DIET_TYPES,
  type ProfileInput,
  REGIONS,
  SEXES,
  ULTRASOUND_GRADES,
} from '@/shared/profile';
import { Button, Card, colors, spacing, Text, TextField } from '@/shared/ui';
import type { LengthUnit, WeightUnit } from '@/shared/utils/units';

import {
  convertLengthText,
  convertWeightText,
  createProfileFormSchema,
  type ProfileFormValues,
  toProfileInput,
} from '../logic/formValues';
import {
  describeFieldError,
  isFieldErrorCode,
  isNumberField,
  type NumberField,
  type Units,
} from '../logic/ranges';
import { BmiSummary } from './BmiSummary';
import { ChoiceGroup } from './ChoiceGroup';
import { TestDateField } from './TestDateField';

export type ProfileFormProps = {
  initialValues: ProfileFormValues;
  submitLabel: string;
  /** Called with validated, metric input. */
  onSubmit: (input: ProfileInput) => void;
};

type NumberInputProps = {
  control: Control<ProfileFormValues>;
  name: NumberField;
  label: string;
  suffix?: string;
  helper?: string;
  error?: string;
  integer?: boolean;
};

function NumberInput({ control, name, label, suffix, helper, error, integer }: NumberInputProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <TextField
          ref={field.ref}
          testID={`field-${name}`}
          label={label}
          suffix={suffix}
          helper={helper}
          error={error}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          keyboardType={integer ? 'number-pad' : 'decimal-pad'}
          inputMode={integer ? 'numeric' : 'decimal'}
        />
      )}
    />
  );
}

const LENGTH_UNITS: ReadonlyArray<LengthUnit> = ['cm', 'in'];
const WEIGHT_UNITS: ReadonlyArray<WeightUnit> = ['kg', 'lb'];

/** Profile form used by onboarding setup and by Settings → Edit profile. */
export function ProfileForm({ initialValues, submitLabel, onSubmit }: ProfileFormProps) {
  const { t } = useTranslation();
  const lengthUnit = usePreferences(s => s.lengthUnit);
  const weightUnit = usePreferences(s => s.weightUnit);
  const units: Units = useMemo(() => ({ lengthUnit, weightUnit }), [lengthUnit, weightUnit]);
  const resolver = useMemo(() => zodResolver(createProfileFormSchema(units)), [units]);

  const { control, handleSubmit, getValues, setValue, clearErrors, formState } =
    useForm<ProfileFormValues>({ defaultValues: initialValues, resolver, mode: 'onTouched' });
  const { errors, isSubmitted } = formState;
  const [height, weight] = useWatch({ control, name: ['height', 'weight'] });

  const errorFor = (name: keyof ProfileFormValues): string | undefined => {
    const code = errors[name]?.message;
    if (!isFieldErrorCode(code)) {
      return undefined;
    }
    const message = describeFieldError(code, isNumberField(name) ? name : null, units);
    return message.key === 'errors.range' ? t(message.key, message.params) : t(message.key);
  };

  const changeLengthUnit = (next: LengthUnit) => {
    setValue('height', convertLengthText(getValues('height'), lengthUnit, next));
    setValue('waist', convertLengthText(getValues('waist'), lengthUnit, next));
    clearErrors(['height', 'waist']);
    usePreferences.getState().setLengthUnit(next);
  };

  const changeWeightUnit = (next: WeightUnit) => {
    setValue('weight', convertWeightText(getValues('weight'), weightUnit, next));
    clearErrors('weight');
    usePreferences.getState().setWeightUnit(next);
  };

  const submit = handleSubmit(values => onSubmit(toProfileInput(values, units)));
  const hasErrors = isSubmitted && Object.keys(errors).length > 0;

  return (
    <View style={styles.root}>
      <Controller
        control={control}
        name="condition"
        render={({ field }) => (
          <ChoiceGroup
            testID="condition"
            label={t('profile.fields.condition')}
            options={CONDITIONS.map(value => ({ value, label: t(`common.conditions.${value}`) }))}
            value={field.value}
            onChange={field.onChange}
            error={errorFor('condition')}
          />
        )}
      />
      <NumberInput
        control={control}
        name="ageYears"
        label={t('profile.fields.age')}
        suffix={t('profile.ageSuffix')}
        error={errorFor('ageYears')}
        integer
      />
      <Controller
        control={control}
        name="sex"
        render={({ field }) => (
          <ChoiceGroup
            testID="sex"
            label={t('profile.fields.sex')}
            options={SEXES.map(value => ({ value, label: t(`profile.sexes.${value}`) }))}
            value={field.value}
            onChange={field.onChange}
            error={errorFor('sex')}
          />
        )}
      />
      <ChoiceGroup
        testID="length-unit"
        label={t('profile.units.length')}
        options={LENGTH_UNITS.map(value => ({ value, label: t(`common.units.${value}`) }))}
        value={lengthUnit}
        onChange={next => next && changeLengthUnit(next)}
      />
      <NumberInput
        control={control}
        name="height"
        label={t('profile.fields.height')}
        suffix={t(`common.units.${lengthUnit}`)}
        error={errorFor('height')}
      />
      <NumberInput
        control={control}
        name="waist"
        label={t('profile.fields.waist')}
        suffix={t(`common.units.${lengthUnit}`)}
        helper={t('profile.fields.waistHelper')}
        error={errorFor('waist')}
      />
      <ChoiceGroup
        testID="weight-unit"
        label={t('profile.units.weight')}
        options={WEIGHT_UNITS.map(value => ({ value, label: t(`common.units.${value}`) }))}
        value={weightUnit}
        onChange={next => next && changeWeightUnit(next)}
      />
      <NumberInput
        control={control}
        name="weight"
        label={t('profile.fields.weight')}
        suffix={t(`common.units.${weightUnit}`)}
        error={errorFor('weight')}
      />
      <BmiSummary height={height} weight={weight} units={units} />
      <Controller
        control={control}
        name="dietType"
        render={({ field }) => (
          <ChoiceGroup
            testID="diet"
            label={t('profile.fields.dietType')}
            options={DIET_TYPES.map(value => ({ value, label: t(`common.dietTypes.${value}`) }))}
            value={field.value}
            onChange={field.onChange}
            error={errorFor('dietType')}
          />
        )}
      />
      <Controller
        control={control}
        name="region"
        render={({ field }) => (
          <ChoiceGroup
            testID="region"
            label={t('profile.fields.region')}
            options={REGIONS.map(value => ({ value, label: t(`profile.regions.${value}`) }))}
            value={field.value}
            onChange={field.onChange}
            error={errorFor('region')}
          />
        )}
      />

      <Card>
        <Text variant="heading">{t('profile.labs.title')}</Text>
        <Text color={colors.textMuted}>{t('profile.labs.subtitle')}</Text>
        <NumberInput
          control={control}
          name="altUL"
          label={t('profile.labs.alt')}
          suffix={t('common.units.ul')}
          error={errorFor('altUL')}
        />
        <NumberInput
          control={control}
          name="astUL"
          label={t('profile.labs.ast')}
          suffix={t('common.units.ul')}
          error={errorFor('astUL')}
        />
        <Controller
          control={control}
          name="ultrasoundGrade"
          render={({ field }) => (
            <ChoiceGroup
              testID="grade"
              label={t('profile.labs.ultrasound')}
              options={ULTRASOUND_GRADES.map(value => ({
                value,
                label: t(`profile.grades.${value}`),
              }))}
              value={field.value}
              onChange={field.onChange}
              allowDeselect
            />
          )}
        />
        <NumberInput
          control={control}
          name="uricAcidMgDl"
          label={t('profile.labs.uricAcid')}
          suffix={t('common.units.mgdl')}
          error={errorFor('uricAcidMgDl')}
        />
        <Controller
          control={control}
          name="testDate"
          render={({ field }) => (
            <TestDateField
              value={field.value}
              onChange={field.onChange}
              error={errorFor('testDate')}
            />
          )}
        />
      </Card>

      {hasErrors ? (
        <Text color={colors.danger} accessibilityLiveRegion="polite" testID="form-errors">
          {t('profile.errors.fixErrors')}
        </Text>
      ) : null}
      <Button testID="profile-submit" title={submitLabel} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
});
