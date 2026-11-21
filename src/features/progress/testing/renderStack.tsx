import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { initI18n } from '@/shared/i18n';
import type { RootStackParamList } from '@/shared/navigation';

import {
  ProgressEntryScreen,
  ProgressMetricScreen,
  ProgressScreen,
  RemindersScreen,
} from '../screens';

initI18n();

const Stack = createNativeStackNavigator<RootStackParamList>();

function MainStub() {
  return <Text>main</Text>;
}

/**
 * Renders the progress screens in a real stack (Progress tab stands in for `Main`).
 * `initial` picks the first screen; a "main" stub sits below it so goBack works.
 */
export async function renderStack<K extends 'ProgressMetric' | 'ProgressEntry' | 'Reminders'>(
  initial: 'Progress' | K,
  params?: RootStackParamList[K],
) {
  const initialState =
    initial === 'Progress'
      ? undefined
      : {
          index: 1,
          routes: [
            { name: 'Main' as const },
            { name: initial, params: params as object | undefined },
          ],
        };
  return render(
    <SafeAreaProvider>
      <NavigationContainer initialState={initialState}>
        <Stack.Navigator>
          <Stack.Screen
            name="Main"
            component={initial === 'Progress' ? ProgressScreen : MainStub}
          />
          <Stack.Screen name="ProgressMetric" component={ProgressMetricScreen} />
          <Stack.Screen name="ProgressEntry" component={ProgressEntryScreen} />
          <Stack.Screen name="Reminders" component={RemindersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>,
  );
}
