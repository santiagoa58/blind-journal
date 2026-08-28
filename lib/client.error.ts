export type ErrorMessageValues = Record<string, string | number | Date>;

export interface CodedError<TCode extends string = string> extends Error {
  readonly code: TCode;
  readonly requestId?: string;
  readonly values?: ErrorMessageValues;
}

export function isCodedError(error: unknown): error is CodedError {
  return error instanceof Error && "code" in error && typeof error.code === "string";
}

export function reportClientError(error: unknown): void {
  globalThis.reportError(error);
}

export type ClientErrorOptions = ErrorOptions & {
  values?: ErrorMessageValues;
};

export class ClientError<TCode extends string> extends Error implements CodedError<TCode> {
  readonly code: TCode;
  readonly values?: ErrorMessageValues;

  constructor(code: TCode, options?: ClientErrorOptions) {
    super(code, options);
    this.code = code;
    this.name = "ClientError";
    if (options?.values !== undefined) {
      this.values = options.values;
    }
  }
}
