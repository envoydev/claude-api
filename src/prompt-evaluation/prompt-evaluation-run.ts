import fs from 'fs';
import { chunkArray, getFilePath } from './utils';
import { generatePromptEvaluationReport } from './report-builder';
import { AiAssistant } from '../assistant/ai-assistant';
import {
  EvaluationResult,
  ModelGrade,
  PromptInputs,
  RunEvaluation,
  TestCase,
} from './types';

export class PromptEvaluationRun {
  private readonly maxConcurrentTasks: number;

  constructor(
    options: { maxConcurrentTasks: number } = { maxConcurrentTasks: 3 },
  ) {
    this.maxConcurrentTasks = options.maxConcurrentTasks;
  }

  public render(
    template: string,
    variables: Record<string, string | number>,
  ): string {
    const placeholders = [...template.matchAll(/\{([^{}]+)}/g)].map(
      (m) => m[1],
    );

    let result = template;
    for (const placeholder of placeholders) {
      if (placeholder in variables) {
        result = result.replace(
          new RegExp(`\\{${placeholder}\\}`, 'g'),
          String(variables[placeholder]),
        );
      }
    }

    return result.replace(/\{\{/g, '{').replace(/}}/g, '}');
  }

  public async runEvaluation(
    params: RunEvaluation,
  ): Promise<EvaluationResult[]> {
    if (!params.jsonOutputFile) {
      params.jsonOutputFile = 'output.json';
    }

    if (!params.htmlOutputFile) {
      params.htmlOutputFile = 'output.html';
    }

    if (!params.dataSetFileName) {
      params.dataSetFileName = 'dataset.json';
    }

    const datasetFileFullPath = getFilePath(
      params.dataSetFileName,
      params.filesLocation,
    );
    const dataset = JSON.parse(
      fs.readFileSync(datasetFileFullPath, 'utf-8'),
    ) as TestCase[];
    const results: EvaluationResult[] = [];
    const total = dataset.length;

    let completed = 0;
    let lastReportedPct = 0;

    const chunks = chunkArray(dataset, this.maxConcurrentTasks);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map((tc) =>
          this.runTestCase(tc, params.runPrompt, params.extraCriteria),
        ),
      );
      for (const result of chunkResults) {
        results.push(result);
        completed++;
        const pct = Math.floor((completed / total) * 100);
        const milestone = Math.floor(pct / 20) * 20;
        if (milestone > lastReportedPct) {
          console.log(`Graded ${completed}/${total} test cases`);
          lastReportedPct = milestone;
        }
      }
    }

    const avgScore =
      results.reduce((sum, r) => sum + r.score, 0) / results.length;
    console.log(`Average score: ${avgScore}`);

    const jsonOutputFileFullPath = getFilePath(
      params.jsonOutputFile,
      params.filesLocation,
    );
    const htmlOutputFileFullPath = getFilePath(
      params.htmlOutputFile,
      params.filesLocation,
    );

    fs.writeFileSync(jsonOutputFileFullPath, JSON.stringify(results, null, 2));
    fs.writeFileSync(
      htmlOutputFileFullPath,
      generatePromptEvaluationReport(results),
      'utf-8',
    );

    return results;
  }

  private async runTestCase(
    testCase: TestCase,
    runPromptFunction: (inputs: PromptInputs) => Promise<string>,
    extraCriteria: string | null = null,
  ): Promise<EvaluationResult> {
    const output = await runPromptFunction(testCase.promptInputs);
    const grade = await this.gradeOutput(testCase, output, extraCriteria);

    return {
      output: output,
      testCase: testCase,
      score: grade.score,
      reasoning: grade.reasoning,
    };
  }

  private async gradeOutput(
    testCase: TestCase,
    output: string,
    extraCriteria: string | null,
  ): Promise<ModelGrade> {
    const promptInputs = Object.entries(testCase.promptInputs)
      .map(([key, value]) => `"${key}":"${value.replace(/\n/g, '\\n')}",`)
      .join('\n');

    const extraCriteriaSection = extraCriteria
      ? `Mandatory Requirements - ANY VIOLATION MEANS AUTOMATIC FAILURE (score of 3 or lower):
         <extra_important_criteria>
         ${extraCriteria}
         </extra_important_criteria>`
      : '';

    const evalPrompt = `
        Your task is to evaluate the following AI-generated solution with EXTREME RIGOR.
        
        Original task description:
        <task_description>
        ${testCase.taskDescription}
        </task_description>
        
        Original task inputs:
        <task_inputs>
        { ${promptInputs} }
        </task_inputs>
        
        Solution to Evaluate:
        <solution>
        ${output}
        </solution>
        
        Criteria you should use to evaluate the solution:
        <criteria>
        ${testCase.solutionCriteria.join('\n')}
        </criteria>
        
        ${extraCriteriaSection}
        
        Scoring Guidelines:
        * Score 1-3: Solution fails to meet one or more MANDATORY requirements
        * Score 4-6: Solution meets all mandatory requirements but has significant deficiencies in secondary criteria
        * Score 7-8: Solution meets all mandatory requirements and most secondary criteria, with minor issues
        * Score 9-10: Solution meets all mandatory and secondary criteria
        
        IMPORTANT SCORING INSTRUCTIONS:
        * Grade the output based ONLY on the listed criteria. Do not add your own extra requirements.
        * If a solution meets all of the mandatory and secondary criteria give it a 10
        * ANY violation of a mandatory requirement MUST result in a score of 3 or lower
        * The full 1-10 scale should be utilized
        
        Output Format
        Provide your evaluation as a structured JSON object:
        - "strengths": An array of 1-3 key strengths
        - "weaknesses": An array of 1-3 key areas for improvement
        - "reasoning": A concise explanation of your overall assessment
        - "score": A number between 1-10
        
        Respond with JSON. Keep your response concise and direct.
        Example response shape:
        {
          "strengths": string[],
          "weaknesses": string[],
          "reasoning": string,
          "score": number
        }
        `;

    const assistant = new AiAssistant();
    assistant.setTemperature(0.0);
    assistant.addUserMessage(evalPrompt.trim());
    const result = await assistant.chat({ stopSequence: ['```json', '```'] });
    const evalText = assistant.getTextFromResponse(result as any);

    return JSON.parse(evalText) as ModelGrade;
  }
}
