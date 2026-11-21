import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { ArticleBlock } from '@/content/schema';
import { spacing, Text } from '@/shared/ui';

function Bullets({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <Text importantForAccessibility="no" accessibilityElementsHidden>
            {'•'}
          </Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** Renders article blocks (headings, paragraphs, bullet lists). */
export function ArticleBody({ blocks }: { blocks: readonly ArticleBlock[] }) {
  return (
    <View style={styles.body}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <Text key={index} variant="heading">
                {block.text}
              </Text>
            );
          case 'paragraph':
            return (
              <Text key={index} variant="bodyLarge">
                {block.text}
              </Text>
            );
          case 'bullets':
            return <Bullets key={index} items={block.items} />;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  list: { gap: spacing.xs },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bulletText: { flex: 1 },
});
