export const SQL_TODO_MESSAGE = "BLOCKED — SQL TODO required";

export type SqlTodo = {
  operation: string;
  tables: string[];
  purpose: string;
  transactionRequired: boolean;
  conditions: string[];
  expectedResult: string;
  concurrencyNotes?: string[];
};

/*
  This metadata lets the team understand exactly what SQL each endpoint needs
  without the project writing the SQL for them.
*/
