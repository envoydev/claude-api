export interface PromptInputs {
  [key: string]: string;
}

export interface TestCase {
  promptInputs: PromptInputs;
  solutionCriteria: string[];
  taskDescription: string;
  scenario: string;
}

export interface EvaluationResult {
  output: string;
  testCase: TestCase;
  score: number;
  reasoning: string;
}

export interface ModelGrade {
  strengths: string[];
  weaknesses: string[];
  reasoning: string;
  score: number;
}

export type GenerateDataset = {
  taskDescription: string;
  promptInputsSpec: PromptInputs;
  numCases: number;
  fileLocation: string;
  outputFile: string;
};

export type RunEvaluation = {
  runPrompt: (promptInputs: PromptInputs) => Promise<string>;
  extraCriteria?: string;
  filesLocation?: string;
  dataSetFileName?: string;
  jsonOutputFile?: string;
  htmlOutputFile?: string;
};
