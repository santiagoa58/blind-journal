export type ErrorMessageValues = Record<string, string | number | Date>;

export interface CodedError<TCode extends string = string> extends Error {
  readonly code: TCode;
  readonly values?: ErrorMessageValues;
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
