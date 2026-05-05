import { AssistantTool } from '../../assistant/ai-assistant.type';

export const dbQuerySchema: AssistantTool = {
  name: 'db_query',
  description:
    'Executes SQL queries against a SQLite database and returns the results. This tool allows running SELECT, INSERT, UPDATE, DELETE, and other SQL statements on a specified SQLite database. For SELECT queries, it returns the query results as structured data. For other query types (INSERT, UPDATE, DELETE), it returns metadata about the operation effects, such as the number of rows affected. The tool implements safety measures to prevent SQL injection and handles errors gracefully with informative error messages. Complex queries are supported, including joins, aggregations, subqueries, and transactions.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'The SQL query to execute against the database. Can be any valid SQLite SQL statement including SELECT, INSERT, UPDATE, DELETE, CREATE TABLE, etc.',
      },
      database_path: {
        type: 'string',
        description:
          'The path to the SQLite database file. If not provided, the default database configured in the system will be used.',
      },
      params: {
        type: 'object',
        description:
          "Parameters to bind to the query for parameterized statements. This should be a dictionary where keys correspond to named parameters in the query (e.g., {'user_id': 123} for a query containing ':user_id'). Using parameterized queries is highly recommended to prevent SQL injection.",
      },
      result_format: {
        type: 'string',
        description:
          "The format in which to return query results. Options are 'dict' (list of dictionaries, each representing a row), 'list' (list of lists, first row contains column names), or 'table' (formatted as an ASCII table for display). Defaults to 'dict'.",
        enum: ['dict', 'list', 'table'],
        default: 'dict',
      },
      max_rows: {
        type: 'integer',
        description:
          'The maximum number of rows to return for SELECT queries. Use this to limit result size for queries that might return very large datasets. A value of 0 means no limit. Defaults to 1000.',
        default: 1000,
      },
      transaction: {
        type: 'boolean',
        description:
          'Whether to execute the query within a transaction. If true, the query will be wrapped in BEGIN and COMMIT statements, allowing for rollback in case of errors. Defaults to false for SELECT queries and true for other query types.',
        default: false,
      },
    },
    required: ['query'],
  },
};
