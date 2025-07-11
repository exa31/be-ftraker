import zod from "zod";

export const createTransactionBodySchema = zod.object({
    amount: zod.number().min(1000, "Amount must be a positive number"),
    type: zod.enum(["Income", "Expense"], "Type must be either 'income' or 'expense'"),
    description: zod.string().min(3, "Description is required"),
    createdAt: zod.string().optional().refine((date) => {
        if (date) {
            const parsedDate = new Date(date);
            return !isNaN(parsedDate.getDate());
        }
        return true; // If createdAt is not provided, it's valid
    }, {
        message: "Invalid date format for createdAt",
    }),
})

export const updateTransactionBodySchema = zod.object({
    amount: zod.number().min(1000, "Amount must be a positive number"),
    type: zod.enum(["Income", "Expense"], "Type must be either 'income' or 'expense'"),
    description: zod.string().min(3, "Description is required"),
    createdAt: zod.string().optional().refine((date) => {
        if (date) {
            const parsedDate = new Date(date);
            return !isNaN(parsedDate.getDate());
        }
        return true; // If createdAt is not provided, it's valid
    }, {
        message: "Invalid date format for createdAt",
    }),
})

export const getTransactionQuerySchema = zod.object({
    view: zod.enum(["Day", "Month", "Year", "Week", "All"], "View must be either 'day', 'month', 'year', 'All', or 'week'"),
})