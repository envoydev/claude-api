import 'dotenv/config';
import * as readline from 'readline';
import { AiAssistant } from './assistant/ai-assistant';

// --- Entry point ---

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = (prompt: string): Promise<string> => {
    return new Promise((resolve) => rl.question(prompt, resolve));
  };

  const assistant = new AiAssistant();
  assistant.setSystemPrompt('You are a helpful assistant.');
  assistant.setTemperature(0.7);

  console.log('Chat started. Type "quit" to exit.\n');

  let isRunning = true;

  while (isRunning) {
    const userInput = await askQuestion('You: ');

    if (userInput.trim().toLowerCase() === 'quit') {
      console.log('Goodbye!');
      rl.close();
      isRunning = false;
      break;
    }

    if (!userInput.trim()) {
      continue;
    }

    assistant.addUserMessage(userInput);

    const stream = await assistant.chatStream({ thinking: true });

    process.stdout.write('Assistant: ');

    let firstThinking = true;
    let firstResult = true;

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        (event.delta.type === 'text_delta' ||
          event.delta.type === 'thinking_delta')
      ) {
        if (event.delta.type === 'thinking_delta') {
          if (firstThinking) {
            console.log('\n###Thinking: \n');
          }
          firstThinking = false;
          process.stdout.write(event.delta.thinking);
        }
        if (event.delta.type === 'text_delta') {
          if (firstResult) {
            console.log('\n###Response: \n');
            firstResult = false;
          }
          process.stdout.write(event.delta.text);
        }
      }
    }

    console.log('\n');

    const finalMessage = await stream.finalMessage();

    assistant.addAssistantMessage(finalMessage.content);
  }
}

main().catch(console.error);
