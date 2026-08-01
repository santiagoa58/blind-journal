export interface ApiSuccessResponse<T> {
  data: T;
  status: number;
}

export interface ApiErrorResponse {
  error: string;
  status: number;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
