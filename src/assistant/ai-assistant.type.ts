import Anthropic from '@anthropic-ai/sdk';
import { MessageStream } from '@anthropic-ai/sdk/lib/MessageStream';

export type AssistantTool = Anthropic.Tool;
export type AssistantToolUnion = Anthropic.ToolUnion;
export type AssistantToolUse = Anthropic.ToolUseBlock;
export type AssistantToolResult = Anthropic.ToolResultBlockParam;
export type AssistantWebSearchTool = Anthropic.WebSearchTool20260209;
export type AssistantCodeExecutionTool = Anthropic.CodeExecutionTool20260120;
export type AssistantResponse = Anthropic.ContentBlock[];
export type AssistantRequest = string | Anthropic.ContentBlockParam[];
export type AssistantMessage = Anthropic.Message;
export type AssistantMessageParam = Anthropic.MessageParam;
export type AssistantMessageStream = MessageStream<unknown>;
export type AssistantMessageCreateParams =
  Anthropic.MessageCreateParamsNonStreaming;

export type StopSequence = [string, string];

export type ChatParams = {
  stopSequence?: StopSequence;
  tools?: (AssistantTool | AssistantToolUnion)[];
  thinking?: boolean;
};

export type BatchInvocation = {
  name: string;
  arguments: string; // stringified JSON object
};

export type BatchToolInput = {
  invocations: BatchInvocation[];
};
