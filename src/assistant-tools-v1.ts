import 'dotenv/config';
import { AiAssistant } from './assistant/ai-assistant';
import { runTools } from './others/tools/tools-invoker';
import { getCurrentDatetimeSchema } from './others/tools/get-current-datetime.tool';
import { addDurationToDatetimeSchema } from './others/tools/duration-to-datetime.tool';
import { setReminderSchema } from './others/tools/set-reminder.tool';
import {
  AssistantMessage,
  AssistantRequest,
  AssistantTool,
} from './assistant/ai-assistant.type';
import { saveArticleSchema } from './others/tools/save-article.tool';

async function runAssistantStreamCall(
  request: AssistantRequest,
  assistant: AiAssistant,
  tools: AssistantTool[],
): Promise<AssistantMessage> {
  assistant.addUserMessage(request);
  const stream = await assistant.chatStream({
    tools: tools,
  });
  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      console.log(chunk.delta.text);
    }
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'input_json_delta'
    ) {
      console.log(chunk.delta.partial_json);
    }
    if (
      chunk.type === 'content_block_start' &&
      chunk.content_block.type === 'tool_use'
    ) {
      console.log(`\n>>> Tool Call: "${chunk.content_block.name}"`);
    }
    if (chunk.type === 'content_block_stop') {
      console.log('\n');
    }
  }
  const response = await stream.finalMessage();
  return response as AssistantMessage;
}

async function runAssistantResponse(
  request: AssistantRequest,
  assistant: AiAssistant,
  tools: AssistantTool[],
): Promise<AssistantMessage> {
  assistant.addUserMessage(request);
  let response: AssistantMessage;
  do {
    response = await assistant.chat({ tools: tools });
    assistant.addAssistantMessage(response.content);
    const toolsResult = runTools(response.content);
    if (toolsResult.length > 0) {
      assistant.addUserMessage(toolsResult);
      response = await assistant.chat({ tools: tools });
    }
  } while (response.content.some((x) => x.type === 'tool_use'));
  return response;
}

// --- Entry point ---

async function main() {
  const assistant = new AiAssistant();

  const tools = [
    saveArticleSchema,
    getCurrentDatetimeSchema,
    addDurationToDatetimeSchema,
    setReminderSchema,
  ];

  const message = 'Create and save a fake computer science article.';

  //const result = await runAssistantStreamCall(message, assistant, tools);
  const result = await runAssistantResponse(message, assistant, tools);

  console.log(assistant.getTextFromResponse(result.content));
}

main().catch(console.error);
