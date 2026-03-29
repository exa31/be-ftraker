import zod from "zod";

export const createTransactionBodySchema = zod.object({
    amount: zod.number().min(1000, "Amount must be a positive number"),
    type: zod.enum(["Income", "Expanse"], "Type must be either 'income' or 'expense'"),
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
    type: zod.enum(["Income", "Expanse"], "Type must be either 'income' or 'expense'"),
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

export const n8nWebhookBodySchema = zod.object({
    sessionId: zod.string().optional(),
    jid: zod.string(),
    message: zod.string(),
    amount: zod.number().min(1, "Amount must be a positive number"),
    type: zod.enum(["Income", "Expanse"], "Type must be either 'income' or 'expense'"),
    description: zod.string().min(1, "Description is required"),
    createdAt: zod.string().optional().refine((date) => {
        if (date) {
            const parsedDate = new Date(date);
            return !isNaN(parsedDate.getDate());
        }
        return true;
    }, {
        message: "Invalid date format for createdAt",
    }),
    user: zod.string().regex(/^[0-9a-f]{24}$/, "Invalid MongoDB ObjectId"),
})


