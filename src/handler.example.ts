import jsonata from 'jsonata';
import { XMLBuilder } from 'fast-xml-parser';
import { readFileSync } from 'fs';
import { join } from 'path';

const EVENT = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'assets', 'sample-test-event.json'), 'utf8'));

/**
 * This example aims to show how the EVENT object is shaped and how to use it in
 * combination with JSONata to transform the request body.
 * @param event - The expected object that is passed to the handler when invoked.
 *
 * NOTE: For testing purposes only. Run `npm run example` to see the output.
 */
async function handler(event = EVENT) {
  const { request, context } = event;

  const expression = jsonata('{"subjects": [$.subject], "grade": $average($.score)~>$round(2)}');
  const transformed = await expression.evaluate(request.body);
  const xml = new XMLBuilder().build(transformed);

  return {
    http_status_code: 200,
    headers: { 'Content-Type': 'application/json', 'x-tenant-name': context.tenant },
    body: { transformed, xml }
  };
}

handler().then(console.log);
