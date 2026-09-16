export type Role = "ADMIN" | "AGENT" | "CUSTOMER";
export type TransactionType = "DEPOSIT" | "WITHDRAWAL" | "INTEREST_CREDIT";

export type SavingsPlan = {
  id: number;
  name: string;
  interestRate: number;
  minimumBalance: number;
};

export type FixedDepositPlan = {
  id: number;
  durationMonths: number;
  interestRate: number;
};

export type Transaction = {
  id: number;
  accountId: number;
  type: TransactionType;
  amount: number;
  timestamp: string;
  reference: string;
  actingUserId: number;
  status: string;
};
