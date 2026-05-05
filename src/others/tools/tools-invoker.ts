import {
  getCurrentDatetimeSchema,
  getCurrentDatetimeTool,
} from './get-current-datetime.tool';
import { batchTool } from './batch-tool';
import {
  addDurationToDatetime,
  addDurationToDatetimeSchema,
} from './duration-to-datetime.tool';
import { setReminderSchema, setReminderTool } from './set-reminder.tool';
import {
  AssistantResponse,
  AssistantToolResult,
  AssistantToolUse,
} from '../../assistant/ai-assistant.type';
import { textEditorToolSchemaNames } from './text-editor/text-editor.tool-schema';
import { TextEditorTool } from './text-editor/text-editor.tool';
import { dbQuerySchema } from './db-query.tool';

export function runTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  meta?: Record<string, unknown>,
): unknown {
  if (toolName === batchTool.name) {
    console.log('Some Batch actions', toolInput);
    return undefined;
  }
  if (toolName === dbQuerySchema.name) {
    console.log('dbQuerySchema action', toolInput);
    return undefined;
  }
  if (toolName === getCurrentDatetimeSchema.name) {
    const dateFormat = toolInput['date_format'] as string | undefined;
    return getCurrentDatetimeTool(dateFormat);
  }
  if (toolName === addDurationToDatetimeSchema.name) {
    const datetimeStr = toolInput['datetime_str'] as string;
    const duration = toolInput['duration'] as number | undefined;
    const unit = toolInput['unit'] as
      | 'seconds'
      | 'minutes'
      | 'hours'
      | 'days'
      | 'weeks'
      | 'months'
      | 'years'
      | undefined;
    const inputFormat = toolInput['input_format'] as string | undefined;
    return addDurationToDatetime(datetimeStr, duration, unit, inputFormat);
  }
  if (toolName === setReminderSchema.name) {
    const content = toolInput['content'] as string;
    const timestamp = toolInput['timestamp'] as string;
    return setReminderTool(content, timestamp);
  }
  if (textEditorToolSchemaNames.includes(toolName)) {
    const baseDir = meta?.['baseDir'] as string;
    const backupDir = meta?.['backupDir'] as string;
    const textEditorTool = new TextEditorTool(baseDir, backupDir);
    const textEditorToolInput = toolInput as TextEditorToolInput;
    const {
      path,
      command,
      view_range,
      old_str,
      new_str,
      insert_line,
      file_text,
    } = textEditorToolInput;
    switch (toolInput.command) {
      case 'view':
        return textEditorTool.view(path, view_range);
      case 'str_replace':
        return textEditorTool.strReplace(path, old_str!, new_str!);
      case 'create':
        return textEditorTool.create(path, file_text!);
      case 'insert':
        return textEditorTool.insert(path, insert_line!, new_str!);
      case 'undo_edit':
        return textEditorTool.undoEdit(path);
      default:
        throw new Error(`Unknown text editor command: ${command}`);
    }
  }
  throw new Error(`Unknown tool: ${toolName}`);
}

export function runTools(
  message: AssistantResponse,
  meta?: Record<string, unknown>,
): AssistantToolResult[] {
  const toolRequests = message.filter(
    (block): block is AssistantToolUse => block.type === 'tool_use',
  );
  return toolRequests.map((toolRequest) => {
    const assistantToolResult = {
      type: 'tool_result',
      tool_use_id: toolRequest.id,
    } as AssistantToolResult;
    try {
      const toolOutput = runTool(
        toolRequest.name,
        toolRequest.input as Record<string, unknown>,
        meta,
      );
      assistantToolResult.content = JSON.stringify(toolOutput);
      assistantToolResult.is_error = false;
      return assistantToolResult;
    } catch (e) {
      assistantToolResult.content = `Error: ${e}`;
      assistantToolResult.is_error = true;
      return assistantToolResult;
    }
  });
}
