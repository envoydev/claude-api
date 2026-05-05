import { AssistantTool } from '../../assistant/ai-assistant.type';

export const saveArticleSchema: AssistantTool = {
  name: 'save_article',
  description: 'Saves a scholarly journal article',
  eager_input_streaming: true,
  input_schema: {
    type: 'object',
    properties: {
      abstract: {
        type: 'string',
        description: 'Abstract of the article. One sentence max',
      },
      meta: {
        type: 'object',
        properties: {
          word_count: {
            type: 'integer',
            description: 'Word count',
          },
          review: {
            type: 'string',
            description: 'Eight sentence review of the paper',
          },
        },
        required: ['word_count', 'review'],
      },
    },
    required: ['abstract', 'meta'],
  },
};
