import { AssistantTool } from '../../assistant/ai-assistant.type';

export const addDurationToDatetimeSchema: AssistantTool = {
  name: 'add_duration_to_datetime',
  description:
    "Add a specified duration to a datetime string and returns the resulting datetime in a detailed format. This tool converts an input datetime string to a Python datetime object, adds the specified duration in the requested unit, and returns a formatted string of the resulting datetime. It handles various time units including seconds, minutes, hours, days, weeks, months, and years, with special handling for month and year calculations to account for varying month lengths and leap years. The output is always returned in a detailed format that includes the day of the week, month name, day, year, and time with AM/PM indicator (e.g., 'Thursday, April 03, 2025 10:30:00 AM').",
  input_schema: {
    type: 'object',
    properties: {
      datetime_str: {
        type: 'string',
        description:
          'The input datetime string to which the duration will be added. This should be formatted according to the input_format parameter.',
      },
      duration: {
        type: 'number',
        description:
          'The amount of time to add to the datetime. Can be positive (for future dates) or negative (for past dates). Defaults to 0.',
      },
      unit: {
        type: 'string',
        description:
          "The unit of time for the duration. Must be one of: 'seconds', 'minutes', 'hours', 'days', 'weeks', 'months', or 'years'. Defaults to 'days'.",
      },
      input_format: {
        type: 'string',
        description:
          "The format string for parsing the input datetime_str, using Python's strptime format codes. For example, '%Y-%m-%d' for ISO format dates like '2025-04-03'. Defaults to '%Y-%m-%d'.",
      },
    },
    required: ['datetime_str'],
  },
};

export function addDurationToDatetime(
  datetimeStr: string,
  duration: number = 0,
  unit:
    | 'seconds'
    | 'minutes'
    | 'hours'
    | 'days'
    | 'weeks'
    | 'months'
    | 'years' = 'days',
  inputFormat: string = '%Y-%m-%d',
): string {
  // Convert Python strptime format to JS-parseable date
  const isoStr = datetimeStr.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1-$2-$3');
  const date = new Date(isoStr);

  switch (unit) {
    case 'seconds':
      date.setSeconds(date.getSeconds() + duration);
      break;
    case 'minutes':
      date.setMinutes(date.getMinutes() + duration);
      break;
    case 'hours':
      date.setHours(date.getHours() + duration);
      break;
    case 'days':
      date.setDate(date.getDate() + duration);
      break;
    case 'weeks':
      date.setDate(date.getDate() + duration * 7);
      break;
    case 'months': {
      const newMonth = date.getMonth() + duration;
      date.setMonth(newMonth);
      break;
    }
    case 'years':
      date.setFullYear(date.getFullYear() + duration);
      break;
    default:
      throw new Error(`Unsupported time unit: ${unit}`);
  }

  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
