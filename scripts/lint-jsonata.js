import jsonata from 'jsonata';
import assert from 'assert';
import { join, basename } from 'path';
import { TRANSFORMS_PATH, DIST_PATH, ASSETS_PATH } from './utils.js';
import { readFileOnce, deleteDirectory, writeFile, lintJsonata } from './utils.js';

const TEST_DATA = {
  request: {
    name: 'Request',
    in: join(ASSETS_PATH, 'unstructured-request.json'),
    out: join(ASSETS_PATH, 'spark-request.json'),
    conditions: (expected, actual) => {
      assert.equal(typeof expected === 'object' && expected !== null, true, 'expecting JSON object');
      assert.equal(Object.keys(expected).length > 0, true, 'expecting object to have keys');
      assert.deepStrictEqual(expected, actual.request_data.inputs, 'expecting objects to be equal');
      // NOTE: add more assertions as needed
    }
  },
  response: {
    name: 'Response',
    in: join(ASSETS_PATH, 'spark-response.json'),
    out: join(ASSETS_PATH, 'unstructured-response.json'),
    conditions: (expected, actual) => {
      assert.equal(typeof expected === 'object' && expected !== null, true, 'expecting JSON object');
      assert.equal(Object.keys(expected).length > 0, true, 'expecting object to have keys');
      assert.deepStrictEqual(expected, actual, 'expecting objects to be equal');
    }
  }
};

const testJsonataExpression = async (expr, testData) => {
  try {
    const inData = JSON.parse(readFileOnce(testData.in));
    const outData = JSON.parse(readFileOnce(testData.out));
    const transformed = await jsonata(expr).evaluate(inData);

    testData.conditions(transformed, outData);
    console.log(`✅ ${testData.name} JSONata expression is valid`);
  } catch (error) {
    throw new Error(`${testData.name} JSONata test failed: ${error.message}`);
  }
};

const processJsonataFile = async (sourceFile, outputFile, testData) => {
  try {
    const rawExpression = readFileOnce(sourceFile);
    const lintedExpression = lintJsonata(rawExpression);
    await testJsonataExpression(lintedExpression, testData);

    // NOTE: if testData.conditions pass, write the linted expression to the output file
    writeFile(outputFile, lintedExpression, `✅ Successfully processed ${basename(sourceFile)}`);
  } catch (error) {
    console.error(`❌ Failed to process ${basename(sourceFile)}: ${error.message}`);
    throw error;
  }
};

async function main() {
  try {
    console.log('Starting JSONata linting process...\n');
    deleteDirectory(DIST_PATH);

    const [reqName, resName] = ['request.jsonata', 'response.jsonata'];
    await Promise.all([
      processJsonataFile(join(TRANSFORMS_PATH, reqName), join(DIST_PATH, reqName), TEST_DATA.request),
      processJsonataFile(join(TRANSFORMS_PATH, resName), join(DIST_PATH, resName), TEST_DATA.response)
    ]);

    console.log('\nAll JSONata expressions processed successfully!');
  } catch (error) {
    console.error('\nProcess failed:', error.message);
    process.exit(1);
  }
}

main();
