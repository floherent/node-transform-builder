# JSONata Extended Reference

## Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `.` | Path navigation | `$.address.city` |
| `[]` | Array index / filter | `$.items[price > 10]` |
| `^()` | Sort | `$.items^(price)` |
| `{}` | Object construction | `{ "key": $.value }` |
| `*` | Wildcard | `$.*.name` |
| `**` | Recursive descent | `$**.id` |
| `&` | String concatenation | `$.first & " " & $.last` |
| `? :` | Ternary conditional | `$.x > 0 ? $.x : 0` |
| `:=` | Variable binding | `$x := $.field` |
| `~>` | Chain operator | `$.items ~> $map(fn) ~> $filter(fn)` |

## Variable Binding

```
(
  $x := $.some_field;
  $y := $x * 2;
  { "result": $y }
)
```

## Lambda Functions

```
$fn := function($v) { $v * 2 };
$.items ~> $map($fn)
```

## Pattern Matching (Regular Expressions)

```
$match(str, /pattern/)            /* returns match object */
$match(str, /pattern/i)           /* case-insensitive */
$contains(str, /pattern/)         /* boolean */
$replace(str, /pattern/, "repl")  /* regex replace */
```

## Aggregation

```
$.orders { account: $sum(price) }           /* group + sum */
$.orders { account: { "total": $sum(price), "count": $count(price) } }
```

## Conditional Expressions

```
/* Multi-condition */
$x < 0 ? "negative" : $x = 0 ? "zero" : "positive"

/* Existence check */
$exists($.optional_field) ? $.optional_field : "fallback"
```

## Transform Functions

```
$each(object, function($v, $k) { ... })
$sift(object, function($v, $k) { $v != null })
$zip(array1, array2)
```

## Error Handling

```
$error("custom error message")
$assert(condition, "assertion message")
```

## Useful Patterns

### Safe field access with default

```
$exists($.field) ? $.field : "default"
```

### Map array of objects to new shape

```
$.items ~> $map(function($item) {
  {
    "id": $item.identifier,
    "label": $item.name
  }
})
```

### Flatten nested arrays

```
$.groups.items[]
```

### Conditional field inclusion

```
$merge([
  { "always": $.required_field },
  $exists($.optional) ? { "optional": $.optional } : {}
])
```
