import jsonata from 'jsonata';
import { HttpStatus, URI_FORMAT } from './constants.js';
import { HandlerEvent, UriParams, HttpResponse, HandlerResponse } from './types.js';

const START_TIME = Date.now(); // start timer for the handler.

/** Helper functions for the handler. */
abstract class Utils {
  /**
   * Compiles and evaluates a JSONata expression.
   * @param {string} expr - The JSONata expression to compile and run.
   * @param {unknown} input - The input data to be passed to the JSONata expression.
   * @param {boolean} debug - Whether to include debug information in the response.
   * @returns {Promise<T>} The result of the JSONata expression.
   *
   * When the expression fails to compile, it throws a Bad-Request with a structure
   * that can be used to return a HTTP response with the error message.
   */
  static async compileAndRun<T = unknown>(expr: string, input: unknown, debug: boolean = false): Promise<T> {
    try {
      return await jsonata(expr).evaluate(input);
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'unable to compile and run JSONata expression';
      throw {
        status: HttpStatus.BAD_REQUEST,
        body: { error: { message }, __debugger: debug ? { expr, input, error: err } : undefined }
      };
    }
  }

  /**
   * Makes an HTTP request to the Spark Execute API using v3 API.
   * @param {HandlerEvent} event - contains Spark connection details and metadata.
   * @param {unknown} inputs - of flat structure that's acceptable for Spark computations.
   * @returns {Promise<HttpResponse>} in v3 format.
   *
   * When the request fails, this will throw an object with a structure that can be
   * used to return an HTTP response with the error message.
   */
  static async makeRequest(event: HandlerEvent, inputs: unknown): Promise<HttpResponse> {
    try {
      const { spark_url: baseUrl, tenant, service_uri: serviceUri = '' } = event.context;
      const { authorization: Authorization } = event.secrets;

      const url = Uri.toUrl(`${baseUrl}/${tenant}`, serviceUri).toString();
      const metadata = new ExecuteMeta(event.context, serviceUri);
      const payload = { request_data: { inputs }, request_meta: metadata.values };
      const headers = { 'Content-Type': 'application/json', 'x-tenant-name': tenant, Authorization };

      const request = { method: 'POST', body: JSON.stringify(payload), headers };
      const response = await fetch(url, request); // https://nodejs.org/en/learn/getting-started/fetch
      if (!response.ok) {
        throw { status: response.status, body: HandlerError.format(response.statusText) };
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body: any = await response.json(); // safe extraction of JSON response
        const error = HandlerError.runDiagnostics(body);

        return { status: HttpStatus.OK, body: error ?? body };
      }

      // NOTE: Ideally, this should never happen.
      throw new HandlerError(`expecting response with JSON content type but got (${contentType})`);
    } catch (err) {
      if (err instanceof Error) {
        const message = `unable to process request; ${err.message}`;
        throw { status: HttpStatus.UNPROCESSABLE_ENTITY, body: HandlerError.format(message) };
      }
      throw err;
    }
  }

  /** Formats and returns the expected data structure for a Handler response. */
  static populateResponse(
    { status = HttpStatus.OK, headers = {}, body }: HttpResponse,
    __debugger?: Record<string, unknown>
  ): HandlerResponse {
    const elapsed = Date.now() - START_TIME;
    const payload = { ...(body as object), __debugger };
    return {
      http_status_code: status,
      headers: { ...headers, 'Content-Type': 'application/json', 'X-Transform-Elapsed-Time': `${elapsed}ms` },
      body: payload
    };
  }
}

/**
 * Copycat of @cspark/sdk's Uri class to avoid bundling the entire package.
 * This is used to build the Spark URI from the UriParams and vice versa.
 */
abstract class Uri {
  /**
   * Builds a Spark URI from UriParams.
   * The order of priority: versionId > serviceId > folder & service > proxy.
   * However, if a `proxy` is provided, it will be used as the endpoint.
   */
  static toUrl(baseUrl: string, uri: string, endpoint = 'execute', path = 'api/v3'): URL {
    if (!uri || isEmptyObject(Uri.decode(uri))) throw new Error(`Service URI is required; ${URI_FORMAT}`);

    const { folder, service, versionId, serviceId, proxy } = Uri.decode(uri);
    if (versionId) path += `/version/${versionId}`;
    else if (serviceId) path += `/service/${serviceId}`;
    else if (folder && service) path += `/folders/${folder}/services/${service}`;
    else if (proxy) path += `/proxy/${Uri.sanitize(proxy)}`;

    if (endpoint && !proxy) path += `/${endpoint}`;
    try {
      return new URL(`${baseUrl}/${path}`);
    } catch {
      throw new HandlerError(`Invalid Service URI; ${URI_FORMAT}`);
    }
  }

  /**
   * Decodes a Spark-friendly service URI into `UriParams`.
   * This can understand a uri only in the following formats:
   * - `folder/service[?version]` or `folders/folder/services/service[?version]`
   * - `service/serviceId`
   * - `version/versionId`
   * - `proxy/custom-endpoint`
   *
   * Otherwise, it is considered an invalid service URI.
   */
  static decode(uri: string): UriParams {
    uri = Uri.sanitize(uri).replace('folders/', '').replace('services/', '');
    const match = uri.match(/^([^\/]+)\/([^[]+)(?:\[(.*?)\])?$/); // matching folder/service[version?]
    if (!match) return {};

    const [, folder, service, version] = match;
    if (folder === 'version') return { versionId: service };
    if (folder === 'service') return { serviceId: service };
    if (folder === 'proxy') return { proxy: service };
    return { folder, service, version: version || undefined };
  }

  /**
   * Encodes `UriParams` into a Spark-friendly service URI.
   * @param {UriParams} uri - the parameters to encode
   * @param {boolean} long - whether to use long format or not (e.g., "folders/folder/services/service[version]")
   * This long format is from older versions of the Spark APIs. It's still supported
   * but not recommended for new implementations.
   * @returns {string} the encoded service URI or an empty string if no parameters
   * are provided. It is expected to be appended to the base URL to locate a specific
   * resource.
   */
  static encode(uri: UriParams, long: boolean = true): string {
    const { folder, service, version, serviceId, versionId, proxy } = uri;
    if (proxy) return `proxy/${proxy}`;
    if (versionId) return `version/${versionId}`;
    if (serviceId) return `service/${serviceId}`;
    if (folder && service)
      return (long ? `folders/${folder}/services` : folder) + `/${service}${version ? `[${version}]` : ''}`;
    return '';
  }

  static sanitize(url: string, leading = false): string {
    const sanitized = url.replace(/\/{2,}/g, '/').replace(/\/$/, '');
    return leading ? sanitized : sanitized.replace(/^\//, '');
  }
}

abstract class StringUtils {
  static isString(text: unknown): text is string {
    return typeof text === 'string' || text instanceof String;
  }

  static isEmpty(text: unknown): boolean {
    return !text || (StringUtils.isString(text) && (text as string).trim().length === 0);
  }

  static isNotEmpty(text: unknown): boolean {
    return !StringUtils.isEmpty(text);
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  static join(value: string | string[] | undefined, separator: string = ','): undefined | string {
    return Array.isArray(value) ? value.join(separator) : value;
  }
}

abstract class DateUtils {
  static toDate(value: unknown): Date | undefined {
    return DateUtils.isDate(value) ? new Date(value) : undefined;
  }

  static isDate(value: unknown): value is Date {
    if (value instanceof Date) return true;
    if (typeof value === 'string') return !Number.isNaN(Date.parse(value));
    if (typeof value === 'number') return !Number.isNaN(Date.parse(new Date(value).toString()));
    return false;
  }

  static parse(
    start: number | string | Date | undefined,
    end?: number | string | Date | undefined,
    { years = 10, months = 0, days = 0 }: { days?: number; months?: number; years?: number } = {}
  ): [Date, Date] {
    const startDate = new Date(start ?? Date.now());
    const endDate =
      end && DateUtils.isAfter(end, startDate)
        ? new Date(end)
        : new Date(startDate.getFullYear() + years, startDate.getMonth() + months, startDate.getDate() + days);
    return [startDate, endDate];
  }

  static isAfter(date: string | number | Date, when: Date): boolean {
    return new Date(date).getTime() > when.getTime();
  }
}

class ExecuteMeta {
  constructor(
    readonly context: Omit<HandlerEvent['context'], 'spark_url' | 'tenant'> = {},
    readonly uri: string = ''
  ) {}

  /** The sanitized metadata values for the execution request. */
  get values() {
    const { context: metadata, uri } = this;
    const { version, serviceId, versionId } = Uri.decode(uri);
    const type = metadata.compiler_type?.toLowerCase() ?? 'neuron';

    const values = {
      // URI locator via metadata (v3 also supports service URI in url path)
      service_id: serviceId,
      version_id: versionId,
      version: version,

      // v3 expects extra metadata
      transaction_date: DateUtils.toDate(metadata.transaction_date)?.toISOString(),
      call_purpose: StringUtils.isNotEmpty(metadata.call_purpose) ? metadata.call_purpose : 'Single Execution',
      source_system: metadata.source_system ?? 'Transform Document',
      correlation_id: metadata.correlation_id,
      array_outputs: StringUtils.join(metadata.array_outputs),
      compiler_type: ['neuron', 'type3', 'xconnector'].includes(type) ? StringUtils.capitalize(type) : 'Neuron',
      debug_solve: metadata.debug_solve,
      excel_file: metadata.excel_file,
      requested_output: StringUtils.join(metadata.requested_output),
      requested_output_regex: metadata.requested_output_regex,
      response_data_inputs: metadata.response_data_inputs,
      service_category: StringUtils.join(metadata.service_category),

      // extra metadata
      ...(metadata.extras ?? {})
    };

    // filter out undefined values.
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
  }
}

class HandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HandlerError';
  }

  static format(message: string, code: string = 'SPARK_LAMBDA_EXECUTION_ERROR'): any {
    return { spark_transform_response_httpstatuscode: 422, code, message };
  }

  /**
   * Analyzes Spark model execution response and throw an error under the following conditions:
   * - Spark runtime error
   * - Lambda runtime error
   *
   * @param body - the Spark model execution response
   * NOTE: Thrown error objects are meant to be populated as a successful response so EIS
   * can process the payload and display the error message accordingly.
   */
  static runDiagnostics(body: any = {}): any {
    if (body.status === 'Success') {
      // Possible Spark runtime error.
      const { errors, warnings: _ } = body.response_data ?? {}; // NOTE: ignore warnings for now.
      if (Array.isArray(errors) && errors.length > 0) {
        return {
          spark_transform_response_httpstatuscode: 422,
          code: 'SPARK_MODEL_EXECUTION_ERROR',
          message: errors.map((e: any) => `[${e.error_type}] ${e.message}`).join('; ')
        };
      }
    } else if (body.status === 'Error' || body.errorCode) {
      // Possible Lambda runtime error.
      return {
        spark_transform_response_httpstatuscode: 422,
        code: body.errorCode ?? 'SPARK_MODEL_EXECUTION_ERROR',
        message: String(body.error ?? body.errors)
      };
    }

    return undefined;
  }
}

const isEmptyObject = (obj: object | null | undefined): boolean => {
  if (!obj) return true;
  for (const _k in obj) return false;
  return true;
};

const isJsonatable = (expr: string): boolean => {
  try {
    jsonata(expr); // throws if invalid
    return true;
  } catch {
    return false;
  }
};

export { Utils, Uri, StringUtils, DateUtils, HandlerError, ExecuteMeta, isEmptyObject, isJsonatable };
