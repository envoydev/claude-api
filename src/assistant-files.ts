import 'dotenv/config';
import path from 'path';
import { AiAssistant } from './assistant/ai-assistant';
import { loadFileAsBase64, loadImageAsBase64 } from './others/file-utils';
import { codeExecutionToolSchema } from './others/tools/code-execution-tool';

async function runImages() {
  const assistant = new AiAssistant();

  const imagePath = path.join(__dirname, '/helpers/images/prop1.png');
  const base64Image = loadImageAsBase64(imagePath);

  const prompt = `
    Analyze the attached satellite image of a property with these specific steps:
    
    1. Residence identification: Locate the primary residence on the property by looking for:
       - The largest roofed structure 
       - Typical residential features (driveway connection, regular geometry)
       - Distinction from other structures (garages, sheds, pools)
       Describe the residence's location relative to property boundaries and other features.
    
    2. Tree overhang analysis: Examine all trees near the primary residence:
       - Identify any trees whose canopy extends directly over any portion of the roof
       - Estimate the percentage of roof covered by overhanging branches (0-25%, 25-50%, 50-75%, 75-100%)
       - Note particularly dense areas of overhang
    
    3. Fire risk assessment: For any overhanging trees, evaluate:
       - Potential wildfire vulnerability (ember catch points, continuous fuel paths to structure)
       - Proximity to chimneys, vents, or other roof openings if visible
       - Areas where branches create a "bridge" between wildland vegetation and the structure
       
    4. Defensible space identification: Assess the property's overall vegetative structure:
       - Identify if trees connect to form a continuous canopy over or near the home
       - Note any obvious fuel ladders (vegetation that can carry fire from ground to tree to roof)
    
    5. Fire risk rating: Based on your analysis, assign a Fire Risk Rating from 1-4:
       - Rating 1 (Low Risk): No tree branches overhanging the roof, good defensible space around the structure
       - Rating 2 (Moderate Risk): Minimal overhang (<25% of roof), some separation between tree canopies
       - Rating 3 (High Risk): Significant overhang (25-50% of roof), connected tree canopies, multiple points of vulnerability
       - Rating 4 (Severe Risk): Extensive overhang (>50% of roof), dense vegetation against structure, numerous ember catch points, limited defensible space
    
    For each item above (1-5), write one sentence summarizing your findings, with your final response being the numeric Fire Risk Rating (1-4) with a brief justification.
  `;

  assistant.addUserMessage([
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: base64Image.mediaType,
        data: base64Image.data,
      },
    },
    {
      type: 'text',
      text: prompt,
    },
  ]);

  const response = await assistant.chat({ thinking: true });
  const text = assistant.getTextFromResponse(response.content);

  console.log(text);
}

async function runDocuments() {
  const assistant = new AiAssistant();

  const pdfPath = path.join(__dirname, '/helpers/documents/earth.pdf');
  const base64Pdf = loadFileAsBase64(pdfPath);

  assistant.addUserMessage([
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: base64Pdf,
      },
      title: 'earth.pdf',
      citations: { enabled: true },
    },
    {
      type: 'text',
      text: "How were Earth's atmosphere and oceans were formed?",
    },
  ]);

  const response = await assistant.chat({ thinking: true });
  const text = assistant.getTextFromResponse(response.content);

  console.log(text);
}

async function runCsv() {
  const assistant = new AiAssistant();

  const csvPath = path.join(__dirname, '/helpers/documents/streaming.csv');

  const fileMetadata = await assistant.upload(csvPath);

  assistant.addUserMessage([
    {
      type: 'text',
      text: `
        Run a detailed analysis to determine major drivers of churn.
        Your final output should include at least one detailed plot summarizing your findings.
         
        Critical note: Every time you execute code, you're starting with a completely clean slate.
        No variables or library imports from previous executions exist. You need to redeclare/reimport all variables/libraries.
      `,
    },
    { type: 'container_upload', file_id: fileMetadata.id } as any,
  ]);

  const response = await assistant.chat({ tools: [codeExecutionToolSchema] });
  const text = assistant.getTextFromResponse(response.content);

  const codeExecutionResults = response.content.filter(
    (content) => content.type === 'bash_code_execution_tool_result',
  );
  if (Boolean(codeExecutionResults)) {
    for (const codeExecutionResult in codeExecutionResults) {
      if (
        Boolean(
          (codeExecutionResult as any).type ===
          'bash_code_execution_tool_result',
        )
      ) {
        for (const fileData in ((codeExecutionResult as any).content as any)
          .content as any[]) {
          const fileId = (fileData as any).file_Id;
          console.log('Code execution result:', fileId);
          await assistant.downloadFile(
            fileId,
            path.join(__dirname, '/helpers/documents/'),
          );
        }
      }
    }
  }

  console.log(text);
}

// --- Entry point ---

async function main() {
  //await runImages();
  //await runDocuments();
  await runCsv();
}

main().catch(console.error);
