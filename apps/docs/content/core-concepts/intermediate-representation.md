---
title: Intermediate Representation
description: IR structure, entities, fields, relationships, and validation rules.
---

# Intermediate Representation

The IR is JSON stored at `.fastbackend/ir.json`. It is the contract between `@fastbackend/core` and runtime adapters.

## Root Structure

```json
{
  "version": "1.0.0",
  "metadata": {
    "projectName": "my-api",
    "schemaFormat": "sqlalchemy",
    "adapter": "fastapi",
    "generatedAt": "2026-01-01T00:00:00.000Z",
    "schemaVersion": "1.0.0"
  },
  "entities": [],
  "relationships": [],
  "enums": []
}
```

## Entity

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | PascalCase entity name (e.g. `User`) |
| `tableName` | string | Database table name (e.g. `users`) |
| `fields` | IRField[] | Column definitions |
| `primaryKey` | string[] | Primary key field names |
| `uniqueConstraints` | string[][] | Unique constraint groups |
| `indexes` | IRIndex[] | Database indexes |

## Field

```json
{
  "name": "email",
  "type": { "base": "string", "format": "email" },
  "nullable": false,
  "defaultValue": null,
  "validation": [{ "type": "required" }],
  "metadata": {}
}
```

**Type bases:** `string`, `integer`, `float`, `boolean`, `date`, `datetime`, `json`, `enum`, `array`

**Formats:** `email`, `uuid`, `url`

## Relationship

```json
{
  "name": "posts",
  "type": "one-to-many",
  "sourceEntity": "User",
  "targetEntity": "Post",
  "sourceField": "id",
  "targetField": "user_id",
  "cascadeDelete": false,
  "metadata": { "backPopulates": "author" }
}
```

**Types:** `one-to-one`, `one-to-many`, `many-to-one`, `many-to-many`

## Validation Rules

| Type | Description |
|------|-------------|
| `required` | Field must be present |
| `min` / `max` | Numeric bounds |
| `minLength` / `maxLength` | String length |
| `pattern` | Regex pattern |
| `email` / `url` / `uuid` | Format validation |
