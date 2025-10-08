export const REQUEST_JSONATA = `{{REQUEST_JSONATA_EXPRESSION}}`;
export const RESPONSE_JSONATA = `{{RESPONSE_JSONATA_EXPRESSION}}`;
export const HttpStatus = { OK: 200, BAD_REQUEST: 400, UNPROCESSABLE_ENTITY: 422 } as const;
export const URI_FORMAT =
  'Service URIs should be one of these formats: ' +
  '"{folder}/{service}[{version}?]" or ' +
  '"service/{serviceId}" or ' +
  '"version/{versionId}" or ' +
  '"proxy/{custom-endpoint}"';
