# Claude API Learning Project

A comprehensive TypeScript/Node.js project demonstrating advanced features and patterns for working with the Claude API, including prompt caching, retrieval-augmented generation (RAG), extended thinking, prompt evaluation, and tool integration.

## Features

### Core AI Assistant
- **Interactive Chat Interface** - Real-time chat with Claude using streaming responses
- **Extended Thinking** - Support for Claude's extended thinking capability with visible thinking process
- **Prompt Caching** - Optimize API costs by caching frequently-used prompts
- **File Handling** - Upload and manage files with the Claude API
- **Tool Integration** - Build and execute custom tools within conversations

### Retrieval-Augmented Generation (RAG)
- **Dual Indexing System**
  - **Vector Search** - Semantic search using vector embeddings (Voyage AI)
  - **BM25 Full-Text Search** - Keyword-based retrieval
- **Document Management** - Add, search, and retrieve documents efficiently
- **Hybrid Retrieval** - Combine vector and keyword search for better results

### Tools & Utilities
- **Web Search** - Integrate web search capabilities into conversations
- **Code Execution** - Execute Python code and return results
- **Database Queries** - Execute database queries and retrieve results
- **Text Editor** - Create, edit, and manage files with undo/backup functionality
- **Batch Processing** - Process multiple requests efficiently using the Batch API

### Evaluation & Testing
- **Prompt Evaluation Framework** - Test and grade Claude's responses
- **Report Generation** - Generate detailed evaluation reports
- **Test Case Management** - Generate and manage test datasets

## Prerequisites

- Node.js 18+ 
- npm or yarn
- API Keys:
  - `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com)
  - `VOYAGE_API_KEY` (optional) - For vector embeddings, get from [Voyage AI](https://www.voyageai.com)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claude-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```env
ANTHROPIC_API_KEY=your_api_key_here
VOYAGE_API_KEY=your_voyage_key_here  # Optional
```

## Dependencies

- **@anthropic-ai/sdk** - Official Anthropic SDK for Claude API
- **voyageai** - Vector embeddings client
- **ts-node** - TypeScript execution for Node.js
- **prettier** - Code formatter
- **readline** - Interactive CLI interface

## Learning Resources

This project demonstrates:
- Streaming API responses
- Prompt engineering with caching
- Building conversational agents
- Implementing RAG systems
- Tool use and function calling
- Extended thinking with Claude
- Batch processing
- API cost optimization