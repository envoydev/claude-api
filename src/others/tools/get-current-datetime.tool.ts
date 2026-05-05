import { AssistantTool } from '../../assistant/ai-assistant.type';

export function getCurrentDatetimeTool(
  dateFormat: string = '%Y-%m-%d %H:%M:%S',
): string {
  if (!dateFormat) {
    throw new Error('dateFormat cannot be empty');
  }
  const now = new Date();
  return dateFormat
    .replace('%Y', now.getFullYear().toString())
    .replace('%m', String(now.getMonth() + 1).padStart(2, '0'))
    .replace('%d', String(now.getDate()).padStart(2, '0'))
    .replace('%H', String(now.getHours()).padStart(2, '0'))
    .replace('%M', String(now.getMinutes()).padStart(2, '0'))
    .replace('%S', String(now.getSeconds()).padStart(2, '0'));
}

export const getCurrentDatetimeSchema: AssistantTool = {
  name: 'get_current_datetime',
  description:
    'Returns the current date and time formatted according to the specified format string. This tool provides the current system time formatted as a string. Use this tool when you need to know the current date and time, such as for timestamping records, calculating time differences, or displaying the current time to users. The default format returns the date and time in ISO-like format (YYYY-MM-DD HH:MM:SS).',
  input_schema: {
    type: 'object',
    properties: {
      date_format: {
        type: 'string',
        description:
          "A string specifying the format of the returned datetime. Uses Python's strftime format codes. For example, '%Y-%m-%d' returns just the date in YYYY-MM-DD format, '%H:%M:%S' returns just the time in HH:MM:SS format, '%B %d, %Y' returns a date like 'May 07, 2025'. The default is '%Y-%m-%d %H:%M:%S' which returns a complete timestamp like '2025-05-07 14:32:15'.",
        default: '%Y-%m-%d %H:%M:%S',
      },
    },
    required: [],
  },
};
