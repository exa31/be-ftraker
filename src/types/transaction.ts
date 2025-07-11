import {Transaction} from "../modules/transaction/transactionModel";

export type responseCreateTransaction = Transaction

export type responseUpdateTransaction = Transaction

export type getTransaction = {
    current: Transaction[];
    last: Transaction[]
}