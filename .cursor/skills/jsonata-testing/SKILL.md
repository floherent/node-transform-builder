---
name: jsonata-testing
description: >-
  Test JSONata expressions against fixture data in assets/. Use when verifying
  that transforms produce expected output, debugging assertion failures, or
  validating changes before committing.
---

# JSONata Testing

## Run Tests

The lint script doubles as the test runner:

```bash
node scripts/lint-jsonata.js
```

### What It Tests

**Request transform** (`transforms/request.jsonata`):
- Input: `assets/unstructured-request.json`
- Expected: `assets/spark-request.json` (compared against `request_data.inputs`)
- The transform output is compared to the `inputs` object inside the fixture,
  not the full envelope.

**Response transform** (`transforms/response.jsonata`):
- Input: `assets/spark-response.json`
- Expected: `assets/unstructured-response.json`
- The transform output is compared directly to the full fixture content.

### Pass Criteria

- Output must be a non-null object with at least one key.
- Output must deep-equal the expected fixture data.

## Interpreting Results

### Success output

```
✅ Request JSONata expression is valid
✅ Successfully processed request.jsonata
✅ Response JSONata expression is valid
✅ Successfully processed response.jsonata
```

### Failure output

The error message includes the assertion that failed:

```
❌ Failed to process request.jsonata: Request JSONata test failed: expecting objects to be equal
```

## Debugging Failures

1. **Identify the mismatch**: Run the expression manually to see actual output.

```bash
node -e "
  import jsonata from 'jsonata';
  import fs from 'fs';
  const expr = fs.readFileSync('transforms/request.jsonata', 'utf8');
  const data = JSON.parse(fs.readFileSync('assets/unstructured-request.json', 'utf8'));
  jsonata(expr).evaluate(data).then(r => console.log(JSON.stringify(r, null, 2)));
"
```

2. **Compare with expected**: Check against the target fixture to identify which
   fields differ.

3. **Common issues**:
   - Field name typo in the expression vs fixture.
   - Missing conditional logic producing `undefined` (key omitted from output).
   - Wrong nesting depth in path expressions.
   - Transform applied to the wrong source object.

## Full Build Test

To run the complete build pipeline (lint + bundle + create transform):

```bash
npm run build
```

For end-to-end testing (requires `TRANSFORM_MODE="Node"`):

```bash
npm run test:e2e
```
