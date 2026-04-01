---
name: designing-efficient-web-databases
description: Use when planning database schemas, optimizing data retrieval, building migrations, or selecting persistence strategies
---

# Designing Efficient Web Databases

## Overview

An efficient web database ensures high performance, minimal storage footprint, and seamless horizontal scaling. Well-designed schemas reduce costly data mutations and complex join operations.

## When to Use

- When creating new tables, schemas, or models for an application
- When designing index strategies for fast reads
- When evaluating SQL vs NoSQL vs Graph constraints
- When optimizing slow queries affecting web performance

## Core Pattern

### 1. Identify Data Access Patterns

Before defining tables, diagram out your primary read/write operations:

- _Are you doing point reads?_ (e.g., `user_id = 123`) -> Requires B-Tree indexes.
- _Are you logging immense event volumes?_ -> Consider append-only NoSQL or time-series logic.

### 2. Schema Normalization Standards

- Always enforce Third Normal Form (3NF) initially to prevent data anomalies.
- Denormalize explicitly **only if** reads become the bottleneck and computation cost of JOINs is provably too high.

### 3. Indexing First

- Every foreign key requires an index.
- Use compound indexes for multi-column `WHERE/ORDER BY` clauses.
- Do not over-index. Writes slow down proportionally to the number of indexes maintaining the data.

## Quick Reference

| Strategy     | When to Apply                                                                         |
| ------------ | ------------------------------------------------------------------------------------- |
| Primary Keys | Use UUIDs (v4 or v7) for distributed systems, or INT GENERATED ALWAYS for simplicity. |
| Migrations   | Always script `up` and `down` files. Never alter tables manually in production.       |
| Caching      | Wrap heavy analytical queries or frequent config reads in a Redis or Memcached layer. |

## Common Mistakes

- **N+1 Query Problems**: Issuing nested queries during ORM looping.
  - Fix: Always use `.join()`, `.prefetch_related()`, or `JOIN` explicit SQL.
- **Select \***: Loading all columns lazily.
  - Fix: Specifically select only the fields needed in the web view.
- **Missing Soft Deletes**: Overusing `DELETE` breaking historical references.
  - Fix: Implement an `is_deleted` or `deleted_at` timestamp.
