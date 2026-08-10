export type ServiceResult<TData, TErrorCode extends string> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: {
        code: TErrorCode;
      };
    };
