---
name: jsonata-lint
description: >-
  Validate JSONata expressions for syntax correctness and project compliance.
  Use when checking transforms for errors, scanning for forbidden patterns, or
  debugging lint failures from the build.
---

# JSONata Lint

## Run the Built-in Linter

The project includes a lint script that validates syntax and tests against fixtures:

```bash
node scripts/lint-jsonata.js
```

This script:
1. Parses each `transforms/*.jsonata` file with the `jsonata` library.
2. Evaluates the request transform against `assets/unstructured-request.json` and
   asserts the output matches `assets/spark-request.json` (inputs only).
3. Evaluates the response transform against `assets/spark-response.json` and
   asserts the output matches `assets/unstructured-response.json`.
4. Writes cleaned expressions to `dist/`.

A non-zero exit code means either a syntax error or a test assertion failed.

## Additional Compliance Checks

Beyond `lint-jsonata.js`, verify these project rules manually or via grep:

### Forbidden: backtick characters

```bash
grep -n '`' transforms/*.jsonata
```

Backticks break `dist/handler.js` at runtime. If found, replace with quoted
field access (`$."field-name"`) or string concatenation.

### Forbidden: line comments

```bash
grep -n '//' transforms/*.jsonata
```

Only `/* ... */` block comments are allowed. The build strips block comments
during cleaning; line comments would break the minified output.

### Forbidden: template literals

```bash
grep -nP '\$\{' transforms/*.jsonata
```

JSONata expressions must be standalone — no JavaScript template syntax.

## Interpreting Errors

| Error message | Cause | Fix |
|---------------|-------|-----|
| `Invalid JSONata expression` | Syntax error in the expression | Check for unbalanced braces, missing commas, or invalid operators |
| `expecting JSON object` | Transform returned a non-object | Ensure the expression produces a `{ ... }` result |
| `expecting object to have keys` | Transform returned `{}` | At least one mapping must produce a value |
| `expecting objects to be equal` | Output doesn't match fixture | Compare actual vs expected; check field names and paths |

## Fix Suggestions

- **Unquoted special field names**: Use `$."field-name"` for fields with dashes or spaces.
- **Missing conditional else**: `$.x >= 0 ? $.x` returns `undefined` when false, which
  omits the key from the result. Add `: default` if the key must always be present.
- **Wrong path depth**: For response transforms, remember the source is the full Spark
  response — use `$.response_data.outputs.field`, not just `$.field`.
