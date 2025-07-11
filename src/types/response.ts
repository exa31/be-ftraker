export interface ResponseModel<T> {
    statusCode: number;
    message: string;
    data: T | null;
    error?: T | null;
    success: boolean;
}