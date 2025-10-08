import 'dotenv/config';
import path from 'path';
import { DIST_PATH, readFileOnce, writeFile } from './utils.js';
import { cleanJsonata, lintJsonata } from './utils.js';

const TRANSFORM_NAME = process.env.TRANSFORM_NAME;
const TRANSFORM_MODE = process.env.TRANSFORM_MODE || 'Node';
const EXTERNAL_DOMAINS = (process.env.TRANSFORM_EXTERNAL_DOMAINS || '').split(',').filter(Boolean);
const NODE_OPTIONS = { docname: TRANSFORM_NAME, schema: 'Nodejs22_v1.0.0', domains: EXTERNAL_DOMAINS };
const JSONATA_OPTIONS = { docname: TRANSFORM_NAME, schema: 'JSONtransforms_v1.0.1', apiVersion: 'v3' };

const FILES = {
  requestJsonata: path.join(DIST_PATH, 'request.jsonata'),
  responseJsonata: path.join(DIST_PATH, 'response.jsonata'),
  handlerJs: path.join(DIST_PATH, 'handler.js')
};

const createTransformCode = (sourceCode, requestJsonata, responseJsonata) => {
  const transformations = [
    ['{{REQUEST_JSONATA_EXPRESSION}}', cleanJsonata(requestJsonata)],
    ['{{RESPONSE_JSONATA_EXPRESSION}}', cleanJsonata(responseJsonata)],
    [`import jsonata from 'jsonata';`, `const jsonata = require('jsonata');`],
    ['export { handler };', ''] // Spark Engine complains if this line is present
  ];

  let code = sourceCode;
  for (const [search, replace] of transformations) {
    if (code.includes(search)) {
      code = code.replace(search, replace);
    }
  }

  // Remove extra whitespace and newlines
  return code.replace(/\n+/g, '').replace(/\s{2,}/g, '');
};

const createNodeTransform = (options = {}) => {
  const { docname, schema, domains } = options;
  const [requestJsonata, responseJsonata, sourceCode] = [
    readFileOnce(FILES.requestJsonata),
    readFileOnce(FILES.responseJsonata),
    readFileOnce(FILES.handlerJs)
  ];

  const transformCode = createTransformCode(sourceCode, requestJsonata, responseJsonata);
  const transformDoc = { transform_type: schema, transform_code: transformCode };
  if (domains.length > 0) transformDoc.transform_allowed_external_domains = [...domains];

  const filename = `${docname}_transform.json`;
  const content = JSON.stringify(transformDoc, null, 2);
  const filePath = path.join(DIST_PATH, filename);

  writeFile(filePath, content, `✅ Created \x1b[35m${filename}\x1b[0m successfully.`);
  return { filename, transformDoc };
};

const createJsonataTransform = (options = {}) => {
  const { docname, schema, apiVersion } = options;
  const requestJsonata = readFileOnce(FILES.requestJsonata);
  const responseJsonata = readFileOnce(FILES.responseJsonata);

  const transformDoc = {
    transform_type: schema,
    target_api_version: apiVersion,
    input_body_transform: lintJsonata(requestJsonata),
    output_body_transform: lintJsonata(responseJsonata)
  };

  const filename = `${docname}_transform.json`;
  const content = JSON.stringify(transformDoc, null, 2);
  const filePath = path.join(DIST_PATH, filename);

  writeFile(filePath, content, `✅ Created \x1b[35m${filename}\x1b[0m successfully.`);
  return { filename, transformDoc };
};

try {
  console.log(`Creating transform documents...`);

  if (/node/i.test(TRANSFORM_MODE)) createNodeTransform(NODE_OPTIONS);
  else if (/jsonata/i.test(TRANSFORM_MODE)) createJsonataTransform(JSONATA_OPTIONS);
  else throw new Error(`Invalid transform mode: ${TRANSFORM_MODE}`);

  console.log(`\nTransform documents created successfully!`);
} catch (error) {
  console.error(`\n❌ Failed to create transform documents: ${error.message}`);
  process.exit(1);
}
