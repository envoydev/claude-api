import { AssistantToolUnion } from '../../../assistant/ai-assistant.type';

export function textEditorToolSchema(model: string): AssistantToolUnion {
  // Claude 4 family (Opus 4.x, Sonnet 4.x, Haiku 4.x) uses the newer tool.
  // Match the '-4-' segment in model IDs like:
  //   claude-opus-4-5-20251101
  //   claude-sonnet-4-5-20250929
  //   claude-haiku-4-5-20251001
  const isClaude4Family = /claude-(opus|sonnet|haiku)-4-/.test(model);
  if (isClaude4Family) {
    return {
      type: 'text_editor_20250728',
      name: 'str_replace_based_edit_tool',
    };
  }
  // Claude 3.5/3.7 Sonnet
  return {
    type: 'text_editor_20250124',
    name: 'str_replace_editor',
  };
}

export const textEditorToolSchemaNames: string[] = [
  'str_replace_based_edit_tool',
  'str_replace_editor',
];
