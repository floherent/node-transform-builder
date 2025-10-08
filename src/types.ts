export type UriParams = {
  folder?: string;
  service?: string;
  version?: string;
  versionId?: string;
  serviceId?: string;
  proxy?: string;
};

export type HttpResponse<T = unknown> = {
  status: number;
  headers?: Record<string, string>;
  body?: T | undefined;
};

export type HandlerEvent<T = unknown> = {
  request: {
    body: T;
    headers: Record<string, string>;
  };
  secrets: {
    authorization: string;
    [key: string]: unknown;
  };
  context: {
    tenant: string;
    spark_url: string;
    service_uri?: string;
    log_level?: string;
    debugger?: boolean;
  } & MetadataParams;
};

export type HandlerResponse<T = unknown> = {
  http_status_code: number;
  headers: Record<string, string>;
  body?: T;
};

export type MetadataParams = {
  // Metadata for Execute API (v3)
  transaction_date?: string | number | Date;
  source_system?: string;
  correlation_id?: string;
  call_purpose?: string;
  compiler_type?: 'neuron' | 'type3' | 'xconnector';
  service_category?: undefined | string | string[];
  debug_solve?: boolean;
  excel_file?: boolean;
  response_data_inputs?: boolean;
  requested_output?: undefined | string | string[];
  array_outputs?: undefined | string | string[];
  requested_output_regex?: string;

  // Extra metadata if something is missing.
  extras?: Record<string, unknown>;
};

/* Data types for the request/response of a transform. Modify this as needed if
 * you want to work with specific data types. The 'any' type is used here to allow
 * for flexibility in the data types.
 *
 * If you want to work with specific data types, you can define them here. For example:
 * ```typescript
 * export type TRequest = { name: string; age: number; };
 * export type TResponse = { message: string; data: any; };
 * ```
 */
export type TRequest = any;
export type TResponse = any;
