import 'dotenv/config';
import path from 'path';
import { PromptInputs } from './prompt-evaluation/types';
import { AiAssistant } from './assistant/ai-assistant';
import { PromptEvaluationGenerate } from './prompt-evaluation/prompt-evaluation-generate';
import { PromptEvaluationRun } from './prompt-evaluation/prompt-evaluation-run';
import { getParams } from './others/utils';

// --- Entry point ---

async function main() {
  const params = getParams();

  const tasks: number = parseInt(params['tasks'] ?? '1');

  const promptEvaluationGenerator = new PromptEvaluationGenerate({
    maxConcurrentTasks: tasks,
  });
  const promptEvaluationRun = new PromptEvaluationRun({
    maxConcurrentTasks: tasks,
  });

  const dataFolderPath: string = path.join(__dirname, 'prompt-evaluation/data');
  const dataSetFileName: string = 'dataset.json';

  if ('test-case' in params) {
    const dataset = await promptEvaluationGenerator.generateDataset({
      taskDescription:
        'Extract topics out of a passage of text from a scholarly article into a JSON array of strings',
      promptInputsSpec: {
        content:
          'One paragraph of text from a scholarly journal written in English',
      },
      numCases: 3,
      fileLocation: dataFolderPath,
      outputFile: dataSetFileName,
    });
  }

  if ('evaluate' in params) {
    const runPrompt = async (promptInputs: PromptInputs): Promise<string> => {
      const prompt = `
        Extract topics from <content> into a JSON array of strings.
        
        Guidance
        1. Extract ALL distinct topics - concepts, technologies, methods, theories, diseases, challenges, acronyms, and proper nouns
        2. Output must be a JSON array of strings only - no commentary, no markdown fences
        3. Every topic must be unique - no duplicates
        4. Extract between 8-15 topics; fewer than 8 means you missed something, more than 15 means you are splitting too granularly
        5. Capture at least 80% of explicitly named concepts - every acronym, named theory, named disease, and named technology counts
        6. Keep related concepts as separate entries - 'consciousness' and 'phenomenal experience' are distinct even if connected
        7. After listing explicit topics, check for clearly implied concepts and add those too
        
        <content>
        ${promptInputs['content']}
        </content>
        `;
      const assistant = new AiAssistant();
      assistant.addUserMessage(prompt);
      const result = await assistant.chat({ stopSequence: ['```json', '```'] });
      return assistant.getTextFromResponse(result.content);
    };

    const results = await promptEvaluationRun.runEvaluation({
      runPrompt,
      extraCriteria: `
      - Contains a JSON array of strings, containing each topic mentioned in the article
      - The strings should contain only a topic without any extra commentary
      - Response should contain the JSON array and nothing else
      `,
      filesLocation: dataFolderPath,
      dataSetFileName: dataSetFileName,
    });
  }
}

main().catch(console.error);
