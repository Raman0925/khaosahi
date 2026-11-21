/** Native Android date/time dialogs (Material pickers), wrapped as promises. */
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

/** Opens a date dialog. Resolves the picked date, or null when cancelled. */
export function pickDate(value: Date, maximumDate?: Date): Promise<Date | null> {
  return new Promise(resolve => {
    DateTimePickerAndroid.open({
      value,
      mode: 'date',
      maximumDate,
      onChange: (event, date) => resolve(event.type === 'set' && date ? date : null),
    });
  });
}

/** Opens a time dialog. Resolves the picked time, or null when cancelled. */
export function pickTime(value: Date): Promise<Date | null> {
  return new Promise(resolve => {
    DateTimePickerAndroid.open({
      value,
      mode: 'time',
      onChange: (event, date) => resolve(event.type === 'set' && date ? date : null),
    });
  });
}
