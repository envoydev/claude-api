import 'dotenv/config';
import path from 'path';
import { AiAssistant } from './assistant/ai-assistant';
import { runTools } from './others/tools/tools-invoker';
import { textEditorToolSchema } from './others/tools/text-editor/text-editor.tool-schema';

async function runConversation(assistant: AiAssistant): Promise<void> {
  const basePath = path.join(__dirname, 'helpers/tool-test-files');
  const meta: Record<string, unknown> = {
    baseDir: basePath,
    backupDir: path.join(basePath, '.backups'),
  };
  while (true) {
    const response = await assistant.chat({
      tools: [textEditorToolSchema(assistant.modelName)],
    });
    assistant.addAssistantMessage(response.content);
    console.log(assistant.getTextFromResponse(response.content));
    if (response.stop_reason !== 'tool_use') {
      break;
    }
    const toolResults = runTools(response.content, meta);
    assistant.addUserMessage(toolResults);
  }
}

// --- Entry point ---

async function main() {
  const assistant = new AiAssistant();
  assistant.setTemperature(1.0);

  assistant.addUserMessage(
    'Open the ./main.ts file file and write out a function to calculate pi to the 5th digit.',
  );

  await runConversation(assistant);
}

main().catch(console.error);
