import 'dotenv/config';
import { AiAssistant } from './assistant/ai-assistant';
import { runTools } from './others/tools/tools-invoker';
import { webSearchToolSchema } from './others/tools/web-search.tool';

async function runConversation(assistant: AiAssistant): Promise<void> {
  while (true) {
    const response = await assistant.chat({
      tools: [webSearchToolSchema(undefined, 5)],
    });
    assistant.addAssistantMessage(response.content);
    console.log(assistant.getTextFromResponse(response.content));
    if (response.stop_reason !== 'tool_use') {
      break;
    }
    const toolResults = runTools(response.content);
    assistant.addUserMessage(toolResults);
  }
}

// --- Entry point ---

async function main() {
  const assistant = new AiAssistant();
  assistant.setTemperature(1.0);

  assistant.addUserMessage('Who is Andriana Panchuk?');

  await runConversation(assistant);

  console.log(JSON.stringify(assistant.getMessages(), null, 2));
}

main().catch(console.error);
