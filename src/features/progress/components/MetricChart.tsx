import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import type { Sex } from '@/shared/profile';
import type { Metric, ProgressEntry } from '@/shared/progress';
import { colors, fontSize, spacing, Text } from '@/shared/ui';
import { round } from '@/shared/utils/numbers';

import { unitText, useLocaleT } from '../format';
import { chartModel } from '../logic/chartModel';
import type { UnitPrefs } from '../logic/units';

const CHART_HEIGHT = 200;
const Y_LABEL_WIDTH = 44;

type Props = {
  metric: Metric;
  /** One metric's entries, oldest first. */
  entries: readonly ProgressEntry[];
  prefs: UnitPrefs;
  sex: Sex | null;
  /** Text alternative for screen readers (latest value + trend). */
  accessibilityLabel: string;
};

function lineConfig(value: number) {
  return {
    color: colors.textMuted,
    dashWidth: 6,
    dashGap: 4,
    labelText: String(value),
    labelTextStyle: styles.smallText,
  };
}

const formatYLabel = (label: string) => String(round(Number(label), 1));

/** Line chart for a numeric metric, with normal-range or risk lines where they apply. */
export function MetricChart({ metric, entries, prefs, sex, accessibilityLabel }: Props) {
  const { t, language } = useLocaleT();
  const [width, setWidth] = useState(0);
  const { data, lines, scale } = useMemo(
    () => chartModel(metric, entries, prefs, sex, language),
    [metric, entries, prefs, sex, language],
  );
  const [line1, line2] = lines;

  return (
    <View
      testID="metric-chart"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
    >
      <Text variant="caption" color={colors.textMuted}>
        {t('progress.chart.yAxis', {
          metric: t(`progress.metrics.${metric}`),
          unit: unitText(t, metric, prefs),
        })}
      </Text>
      {width > 0 ? (
        <LineChart
          data={data}
          height={CHART_HEIGHT}
          width={Math.max(0, width - Y_LABEL_WIDTH - spacing.lg)}
          adjustToWidth
          disableScroll
          initialSpacing={8}
          endSpacing={8}
          yAxisOffset={scale.offset}
          maxValue={scale.span}
          stepValue={scale.step}
          noOfSections={scale.sections}
          yAxisLabelWidth={Y_LABEL_WIDTH}
          formatYLabel={formatYLabel}
          yAxisTextStyle={styles.smallText}
          xAxisLabelTextStyle={styles.smallText}
          color={colors.chartLine}
          dataPointsColor={colors.chartLine}
          hideDataPoints={data.length > 30}
          thickness={2}
          rulesColor={colors.border}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          showReferenceLine1={line1 !== undefined}
          referenceLine1Position={line1}
          referenceLine1Config={line1 !== undefined ? lineConfig(line1) : undefined}
          showReferenceLine2={line2 !== undefined}
          referenceLine2Position={line2}
          referenceLine2Config={line2 !== undefined ? lineConfig(line2) : undefined}
        />
      ) : null}
      <Text variant="caption" color={colors.textMuted} center>
        {t('progress.chart.xAxis')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallText: { color: colors.textMuted, fontSize: fontSize.caption - 2 },
});
