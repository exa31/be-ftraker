import {Transaction} from "../modules/transaction/transactionModel";

export type responseCreateTransaction = Transaction

export type responseUpdateTransaction = Transaction

export type getTransaction = {
    current: Transaction[];
    last: Transaction[]
}

export type AggregateTransactionSummary = {
    income: number;
    expense: number;
    userId: string;
    email: string;
    name: string;
}