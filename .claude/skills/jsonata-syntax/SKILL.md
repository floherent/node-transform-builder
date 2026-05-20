---
name: jsonata-syntax
description: >-
  JSONata language reference and project-specific authoring rules. Use when
  writing, editing, or reviewing JSONata expressions. Covers operators, path
  expressions, functions, and project constraints.
---

# JSONata Syntax Reference

## Project-Specific Rules

These rules **must** be followed in every JSONata expression in this project:

1. **No backticks** — backtick characters break `dist/handler.js` at runtime.
2. **Block comments only** — use one-line `/* comment */`. No `//` line comments.
3. **Double quotes in source** — the build pipeline converts `"` to `'` during cleaning.
4. **Standalone expressions** — no JavaScript, no template literals, no `require`/`import`.

## Quick Reference

### Path expressions

```
$.field_name              /* root-level field */
$.parent.child            /* nested access */
$."field-with-dashes"     /* quoted field names for special characters */
$.array[0]                /* array index */
$.array[field > 10]       /* filter */
```

### Object construction

```
{
  "target_key": $.source_key,
  "nested": { "inner": $.deep.value }
}
```

### Conditional (ternary)

```
$.value >= 0 ? $.value : 0          /* with else */
$.value >= 0 ? $.value              /* without else (returns undefined if false) */
```

### String functions

```
$string(value)          /* convert to string */
$length(str)            /* string length */
$substring(str, start)  /* substring */
$trim(str)              /* trim whitespace */
$uppercase(str)         /* to upper case */
$lowercase(str)         /* to lower case */
$replace(str, pattern, replacement)
$split(str, separator)
$join(array, separator)
```

### Numeric functions

```
$number(value)     /* convert to number */
$round(n, places)  /* round */
$floor(n)          /* floor */
$ceil(n)           /* ceiling */
$abs(n)            /* absolute value */
$sum(array)        /* sum of array */
$average(array)    /* average */
$min(array)        /* minimum */
$max(array)        /* maximum */
```

### Array functions

```
$count(array)              /* length */
$append(arr1, arr2)        /* concatenate */
$sort(array)               /* sort */
$reverse(array)            /* reverse */
$distinct(array)           /* unique values */
$map(array, fn)            /* transform each element */
$filter(array, fn)         /* filter elements */
$reduce(array, fn, init)   /* reduce to single value */
```

### Object functions

```
$keys(obj)                 /* array of keys */
$values(obj)               /* array of values */
$lookup(obj, key)          /* dynamic key lookup */
$merge([obj1, obj2])       /* merge objects */
$spread(obj)               /* array of {key: value} pairs */
$each(obj, fn)             /* iterate over key-value pairs */
```

### Type checks and conversion

```
$type(value)               /* returns type as string */
$exists(path)              /* true if path exists */
$boolean(value)            /* convert to boolean */
$not(bool)                 /* logical not */
```

### Date/time

```
$now()                     /* current ISO timestamp */
$millis()                  /* current time in milliseconds */
$toMillis(iso)             /* ISO string to millis */
$fromMillis(ms)            /* millis to ISO string */
```

For the full JSONata function catalog, see [reference.md](reference.md).
