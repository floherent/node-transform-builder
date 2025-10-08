import { Utils } from './utils.js';
import { HttpStatus, REQUEST_JSONATA, RESPONSE_JSONATA } from './constants.js';
import { HandlerEvent, HandlerResponse, HttpResponse } from './types.js';

/**
 * Handles a request for a node transform.
 * @param {HandlerEvent} event is expected to have a request body with unstructured input data.
 * @returns {HandlerResponse} with structured output data.
 *
 * This handler mimics the workflow of a JSONata transform document using the Node.js Transform
 * Document API. It first compiles the request JSONata expression, then makes an HTTP request to
 * the Spark Execute API using v3 API, and finally compiles the response JSONata expression.
 */
async function handler(event: HandlerEvent): Promise<HandlerResponse> {
  const { request, context } = event;

  try {
    const req_transform = await Utils.compileAndRun(REQUEST_JSONATA, request.body, context.debugger);
    const response = await Utils.makeRequest(event, req_transform);
    const res_transform = await Utils.compileAndRun(RESPONSE_JSONATA, response.body, context.debugger);

    return Utils.populateResponse(
      { status: HttpStatus.OK, body: res_transform },
      context.debugger ? { event, req_transform, original_response: response } : undefined
    );
  } catch (error) {
    // NOTE: Catch-all for http-shaped errors that may occur during the process.
    return Utils.populateResponse(error as HttpResponse, context.debugger ? { event, error } : undefined);
  }
}

// IMPORTANT: Do NOT remove this line below. Rollup will use this line to generate the bundle.
export { handler };
