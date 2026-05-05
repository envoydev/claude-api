import fs from 'fs';
import { chunkArray, getFilePath } from './utils';
import { AiAssistant } from '../assistant/ai-assistant';
import { GenerateDataset, TestCase } from './types';

export class PromptEvaluationGenerate {
  private readonly maxConcurrentTasks: number;

  constructor(
    options: { maxConcurrentTasks: number } = { maxConcurrentTasks: 3 },
  ) {
    this.maxConcurrentTasks = options.maxConcurrentTasks;
  }

  public async generateDataset(params: GenerateDataset): Promise<TestCase[]> {
    const ideas = await this.generateUniqueIdeas(
      params.taskDescription,
      params.promptInputsSpec,
      params.numCases,
    );

    const dataset: TestCase[] = [];
    let completed = 0;
    const total = ideas.length;
    let lastReportedPct = 0;

    // Run with limited concurrency
    const chunks = chunkArray(ideas, this.maxConcurrentTasks);
    for (const chunk of chunks) {
      const results = await Promise.all(
        chunk.map((idea) =>
          this.generateTestCase(
            params.taskDescription,
            idea,
            params.promptInputsSpec,
          ),
        ),
      );
      for (const result of results) {
        dataset.push(result);
        completed++;
        const pct = Math.floor((completed / total) * 100);
        const milestone = Math.floor(pct / 20) * 20;
        if (milestone > lastReportedPct) {
          console.log(`Generated ${completed}/${total} test cases`);
          lastReportedPct = milestone;
        }
      }
    }

    const fullPath = getFilePath(params.outputFile, params.fileLocation);
    fs.writeFileSync(fullPath, JSON.stringify(dataset, null, 2));
    return dataset;
  }

  private async generateUniqueIdeas(
    taskDescription: string,
    promptInputsSpec: Record<string, string>,
    numCases: number,
  ): Promise<string[]> {
    const examplePromptInputs = Object.entries(promptInputsSpec)
      .map(([key, value]) => `"${key}": str # ${value.replace(/\n/g, '\\n')},`)
      .join('');

    const prompt = `
        Generate ${numCases} unique, diverse ideas for testing a prompt that accomplishes this task:
        
        <task_description>
        ${taskDescription}
        </task_description>
        
        The prompt will receive the following inputs
        <prompt_inputs>
        ${examplePromptInputs}
        </prompt_inputs>
        
        Each idea should represent a distinct scenario or example that tests different aspects of the task.
        
        Output Format:
        Provide your response as a structured JSON array where each item is a brief description of the idea.
        
        Example:
        \`\`\`json
        [
          "Testing with technical computer science terminology",
          "Testing with medical research findings",
          "Testing with complex mathematical concepts",
          ...
        ]
        \`\`\`
        
        Ensure each idea is:
        - Clearly distinct from the others
        - Relevant to the task description
        - Specific enough to guide generation of a full test case
        - Quick to solve without requiring extensive computation or multi-step processing
        - Solvable with no more than 400 tokens of output
        
        Remember, only generate ${numCases} unique ideas
        `;

    const systemPrompt =
      'You are a test scenario designer specialized in creating diverse, unique testing scenarios.';

    const assistant = new AiAssistant();
    assistant.setSystemPrompt(systemPrompt);
    assistant.addUserMessage(prompt);
    const response = await assistant.chat({ stopSequence: ['```json', '```'] });
    const text = assistant.getTextFromResponse(response.content);

    return JSON.parse(text) as string[];
  }

  private async generateTestCase(
    taskDescription: string,
    idea: string,
    promptInputsSpec: Record<string, string> = {},
  ): Promise<TestCase> {
    const examplePromptInputs = Object.entries(promptInputsSpec)
      .map(
        ([key, value]) =>
          `"${key}": "EXAMPLE_VALUE", // ${value.replace(/\n/g, '\\n')}`,
      )
      .join('\n');

    const allowedKeys = Object.keys(promptInputsSpec)
      .map((k) => `"${k}"`)
      .join(', ');

    const prompt = `
        Generate a single detailed test case for a prompt evaluation based on:
        
        <taskDescription>
        ${taskDescription}
        </taskDescription>
        
        <specificIdea>
        ${idea}
        </specificIdea>
        
        <allowedInputKeys>
        ${allowedKeys}
        </allowedInputKeys>
        
        Output Format:
        \`\`\`json
        {
          "promptInputs": {
          ${examplePromptInputs}
          },
          "solutionCriteria": ["criterion 1", "criterion 2", ...] // Concise list of criteria for evaluating the solution, 1 to 4 items
        }
        \`\`\`
        
        IMPORTANT REQUIREMENTS:
        - You MUST ONLY use these exact input keys in your prompt_inputs: ${allowedKeys}
        - Do NOT add any additional keys to prompt_inputs
        - All keys listed in allowed_input_keys must be included in your response
        - Make the test case realistic and practically useful
        - Include measurable, concise solution criteria
        - The solution criteria should ONLY address the direct requirements of the task description and the generated prompt_inputs
        - Avoid over-specifying criteria with requirements that go beyond the core task
        - Keep solution criteria simple, focused, and directly tied to the fundamental task
        - The test case should be tailored to the specific idea provided
        - Quick to solve without requiring extensive computation or multi-step processing
        - Solvable with no more than 400 tokens of output
        - DO NOT include any fields beyond those specified in the output format
        `;

    const systemPrompt =
      'You are a test case creator specializing in designing evaluation scenarios.';

    const assistant = new AiAssistant();
    assistant.setSystemPrompt(systemPrompt);
    assistant.setTemperature(0.7);
    assistant.addUserMessage(prompt);
    const result = await assistant.chat({ stopSequence: ['```json', '```'] });
    const text = assistant.getTextFromResponse(result.content);

    const testCase = JSON.parse(text) as Omit<
      TestCase,
      'taskDescription' | 'scenario'
    >;
    return { ...testCase, taskDescription: taskDescription, scenario: idea };
  }
}
