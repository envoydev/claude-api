import { AssistantWebSearchTool } from '../../assistant/ai-assistant.type';

export const webSearchToolName: string = 'web_search';

export function webSearchToolSchema(
  allowedDomains: string[] | undefined,
  maxUses: number,
): AssistantWebSearchTool {
  return {
    type: 'web_search_20260209',
    name: 'web_search',
    max_uses: maxUses,
    allowed_domains: allowedDomains,
    allowed_callers: ['direct'],
  };
}
