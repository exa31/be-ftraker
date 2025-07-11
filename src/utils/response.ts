import {ResponseModel} from "../types/response";

export const SuccessResponse = <T>(data: T, message: string, statusCode: number): ResponseModel<T> => {
    return {
        statusCode,
        message,
        data,
        success: true
    }
};

export const ErrorResponse = <T>(message: string, error: T, statusCode: number): ResponseModel<T> => {
    return {
        statusCode,
        message,
        error: error,
        data: null,
        success: false
    }
};
