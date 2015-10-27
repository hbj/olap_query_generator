# OLAP query generator

## Config

```json
{
  "my-store": {
    "levels": {
      "product": "unit",
      "location": "store",
      "calendar": "week"
    }
  }
}
```

This creates one service end point (`POST`, http://localhost:3000/my-store) configured with the dimensions
`product`, `location` and `calendar` with the respective default levels `unit`, `store` and `week`.

It's possible to add as many end points as needed.

## Examples

### Example 1

Query a metric.

```json
[{
  "measure": "unit"
}]
```

### Example 2

Query the total profit per week and department and city.

```json
[{
  "levels": {
    "product": "department",
    "location": "city",
    "calendar": "month"
  },
  "key": [
    {"dimension": "product", "attribute": "label"},
    {"dimension": "location", "attribute": "label"},
    {"dimension": "calendar", "attribute": "label"}
  ],
  "measure": [
    {
      "total": {
        "multiply": [
          "units",
          {"subtract": ["retail", "cost"]}
        ]
      },
      "group": [{"calendar": "week"}, "location", "product"]
    }
  ]
}]
```

### Example 3

Query the maximum monthly profit per year, city and department. Notice that we are requesting labels for both years
and months, where year labels are set through the default calendar level and the month labels are set explicitly.

```json
[{
  "levels": {
    "product": "department",
    "location": "city",
    "calendar": "year"
  },
  "key": [
    {"dimension": "product", "attribute": "label"},
    {"dimension": "location", "attribute": "label"},
    {"dimension": "calendar", "attribute": "label"},
    {"dimension": "calendar", "level": "month", "attribute": "label"}
  ],
  "measure": [{
    "max": {
      "total": {
        "multiply": [
          "units",
          {"subtract": ["retail", "cost"]}
        ]
      },
      "group": [{"calendar": "month"}]
    },
    "group": ["calendar", "location", "product"]
  }]
}]
```
