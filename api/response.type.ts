export type ApiError = {
  code: string;
  message?: string;
};

export type ApiResponse<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: ApiError;
    };
