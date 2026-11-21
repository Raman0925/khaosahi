import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip, spacing } from '@/shared/ui';

import { TOPIC_FILTERS, type TopicFilter } from '../logic/articles';

export function TopicChips({
  value,
  onChange,
}: {
  value: TopicFilter;
  onChange: (topic: TopicFilter) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TOPIC_FILTERS.map(topic => {
        const label = t(`learn.topics.${topic}`);
        return (
          <Chip
            key={topic}
            testID={`topic-${topic}`}
            label={label}
            selected={value === topic}
            onPress={() => onChange(topic)}
            accessibilityLabel={t('learn.topicFilterLabel', { topic: label })}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
});
