---
name: mapping-document
description: >-
  Define, validate, and maintain the mapping document (assets/mapping.json) that
  serves as the source of truth for JSONata transforms. Use when creating a new
  mapping, updating field relationships, or preparing source/target JSON fixtures.
---

# Mapping Document

The mapping document (`assets/mapping.json`) defines how fields in unstructured
input/output JSON map to Spark request/response fields. Both `transforms/request.jsonata`
and `transforms/response.jsonata` must be derived from this document.

## Template

```json
{
  "$schema": "mapping-document-v1",
  "description": "Short description of what this mapping does",
  "request": {
    "source": "assets/unstructured-request.json",
    "target": "assets/spark-request.json",
    "mappings": [
      {
        "source_path": "dot.notation.path.in.source",
        "target_path": "field_name_in_spark_inputs",
        "transform": null,
        "default_value": null,
        "description": "Human-readable note"
      }
    ]
  },
  "response": {
    "source": "assets/spark-response.json",
    "target": "assets/unstructured-response.json",
    "mappings": [
      {
        "source_path": "response_data.outputs.field",
        "target_path": "unstructured_field",
        "transform": null,
        "default_value": null,
        "description": "Human-readable note"
      }
    ]
  }
}
```

## Mapping Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source_path` | string | yes | Dot-notation path in the source JSON |
| `target_path` | string | yes | Dot-notation path in the target JSON |
| `transform` | string or null | no | JSONata fragment applied to `$` (the source value), e.g. `>= 0 ? $ : 0` |
| `default_value` | any or null | no | Fallback when source is missing or null |
| `description` | string | no | Human-readable explanation |

## Request Mapping Notes

- `source` is the unstructured input (what the API consumer sends).
- `target` is the Spark request fixture. The JSONata transform only produces the
  `request_data.inputs` object — the handler adds the envelope (`request_data`, `request_meta`).
- So `target_path` values are the **input field names** (e.g., `radius`), not
  full paths like `request_data.inputs.radius`.

## Response Mapping Notes

- `source` is the full Spark response (includes `response_data`, `response_meta`).
- `target` is the unstructured output sent back to the consumer.
- `source_path` uses the full dot-notation from the response root
  (e.g., `response_data.outputs.volume`).

## Validation

Run validation before authoring transforms:

```bash
node scripts/validate-mapping.js
```

This checks:
- Schema structure (`$schema`, `request`, `response`, `mappings` arrays)
- Source paths exist in the referenced source fixture
- Target paths exist in the referenced target fixture
- Transform fragments are valid JSONata and contain no backticks

## Preparing Fixture Files

When setting up a new transform project:

1. Place the sample unstructured input in `assets/unstructured-request.json`.
2. Place the expected Spark request in `assets/spark-request.json` (must include
   the full envelope with `request_data.inputs` containing the mapped fields).
3. Place a sample Spark response in `assets/spark-response.json`.
4. Place the expected unstructured output in `assets/unstructured-response.json`.
5. Create `assets/mapping.json` using the template above.
6. Run `node scripts/validate-mapping.js` to verify.
