import {ZodError, ZodSchema} from "zod";

export const validate = <T>(values: T, schema: ZodSchema): void => {
    schema.parse(values);
};

export const formatErrorValidation = (error: ZodError): Record<string, string> => {
    const formattedErrors: Record<string, string> = {};
    error.issues.forEach(issue => {
            const path = issue.path[0] as string;
            formattedErrors[path] = issue.message;
        }
    );
    return formattedErrors;
}