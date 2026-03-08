# AGENTS.md

## Purpose

Build a web application for jewelry production management.

The current operation is managed mainly by oral updates and a spreadsheet-style manufacturing schedule. The system must replace ad-hoc status sharing with a shared source of truth that tracks products from modeling to delivery.

This repository should prioritize **operational clarity**, **fast status updates**, and **traceability** over complex ERP-style features.

---

## Project context derived from the current task schedule

The reference schedule shows that production is organized by:

- **Brand / project** (examples: VAINON, W TOKYO, UROKO, AAAMYYY)
- **Product / SKU family** (examples: Bangle, Ring, Pierce, Necklace, Bracelet, Key Chain)
- **A standard manufacturing flow** with repeated steps
- **Planned start date / end date / due date / assignee / status**
- **Nested finishing sub-steps** under polishing/finishing
- **A final delivery phase** after inspection and packaging

Typical repeated steps found in the schedule:

- モデリング・プリント
- デザインチェック
- キャスト
- サンプル仕上げ
- レーザーゴム
- 磨き
- 検品
- 袋詰め・箱詰め
- 納品

Typical nested sub-steps found under polishing/finishing:

- 湯口
- 緑
- 赤
- 青
- 燻し
- バレル
- レーザー
- シリコン
- バフ

There are also product-specific flows such as:

- Necklace: チェーンカット → レーザー → 磨き → 組み → 検品 → 梱包 → 納品
- Marriage Ring / special orders: customized workflow variants

Design the system so that workflows are **template-based but overridable per order**.

---

## Product goal

Create an internal operations app that lets a small jewelry manufacturing team:

- see what is being produced now
- know who owns each step
- see delays and bottlenecks immediately
- update progress without meetings or verbal confirmation
- standardize recurring workflows while still supporting custom jobs

The app is an internal production management tool, not a customer-facing store.

---

## Primary users

1. **Production manager**
   - creates production orders
   - assigns workers
   - checks delays
   - approves shipment readiness

2. **Craftsperson / operator**
   - sees only relevant tasks
   - starts / pauses / completes steps
   - records issues or rework

3. **Admin / owner**
   - reviews delivery commitments
   - monitors throughput and bottlenecks
   - manages brands, products, and templates

---

## Scope for MVP

Implement only the minimum needed to replace spreadsheet + oral management.

### Must have

- authentication for internal users
- brands / projects
- products
- production orders
- workflow templates
- workflow steps and sub-steps
- assignee management
- status updates
- due dates and planned dates
- order list view
- order detail view
- kanban / stage board
- basic dashboard
- activity history / audit log
- issue / rework flagging

### Nice to have later

- QR scanning
- inventory / materials
- outside vendor management
- costing / margin tracking
- shipping label integration
- file attachments for CAD, renderings, and reference photos
- notifications to Slack / email / LINE

### Explicitly out of scope for MVP

- accounting
- customer billing
- full procurement ERP
- advanced forecasting
- multi-warehouse stock control

---

## Core domain model

Keep the data model explicit and normalized.

### 1. Brand / Project

Examples: VAINON, W TOKYO, UROKO, AAAMYYY.

Fields:

- id
- name
- code
- active

### 2. Product

Represents the product family or SKU family.

Fields:

- id
- brand_id
- name
- category
- material_notes
- finish_notes
- default_workflow_template_id
- active

### 3. Production Order

Represents one manufacturing job for a product.
This is the central object in the system.

Fields:

- id
- order_code
- brand_id
- product_id
- title
- quantity
- priority
- status
- planned_start_date
- due_date
- ship_date
- current_step_instance_id
- notes

### 4. Workflow Template

A reusable ordered sequence of manufacturing steps.
Must support variants by product type.

Fields:

- id
- name
- product_category
- active
- version

### 5. Workflow Template Step

Template definition of a step.

Fields:

- id
- workflow_template_id
- name
- sequence
- parent_step_id_nullable
- step_type
- default_duration_days
- required

### 6. Step Instance

Actual step generated for a specific production order.
Must be created from the template when the order is created.

Fields:

- id
- production_order_id
- template_step_id_nullable
- name
- sequence
- parent_step_instance_id_nullable
- assignee_id_nullable
- status
- planned_start_date
- planned_end_date
- actual_start_at
- actual_end_at
- blocked_reason_nullable
- rework_count

### 7. User

Internal worker or manager.

Fields:

- id
- name
- email
- role
- active

### 8. Activity Log

Immutable history of important changes.

Fields:

- id
- actor_user_id
- entity_type
- entity_id
- action
- before_json
- after_json
- created_at

### 9. Issue / Rework Log

Tracks failures, returns to previous steps, or special handling.

Fields:

- id
- production_order_id
- step_instance_id_nullable
- issue_type
- severity
- description
- opened_by_user_id
- resolved_by_user_id_nullable
- opened_at
- resolved_at_nullable

---

## Required workflow behavior

### Order creation

When a manager creates a production order:

1. choose brand/project
2. choose product
3. choose workflow template or use the product default
4. enter quantity, priority, planned start date, and due date
5. generate ordered step instances automatically

### Step execution

Each step instance must support:

- not_started
- ready
- in_progress
- blocked
- completed
- skipped
- rework

Workers should be able to update a step in as few taps/clicks as possible.

### Nested steps

The spreadsheet uses child steps under polishing/finishing. The app must support parent-child structure.

Rules:

- child steps belong to a parent step
- a parent can be shown as aggregated progress
- child steps may have separate assignees
- completion of the parent may depend on all required children being completed

### Rework / rollback

Jewelry manufacturing is not strictly linear. The app must support:

- reopening completed steps
- sending an order back to an earlier step
- adding an unplanned step
- logging why rework happened

Do not assume a workflow is traversed only once.

---

## Screens required in MVP

### 1. Dashboard

Show:

- orders due soon
- delayed orders
- blocked orders
- work in progress count by stage
- orders grouped by assignee

### 2. Production Orders List

Columns:

- order code
- brand
- product
- quantity
- current step
- assignee
- due date
- status
- priority

Filters:

- brand
- product
- status
- assignee
- due date range
- delayed only
- blocked only

### 3. Order Detail

Must show:

- order summary
- workflow timeline
- step list with nesting
- assignees
- planned vs actual dates
- issue / rework history
- activity log
- quick actions to move status forward

### 4. Kanban / Stage Board

Columns based on current step or current stage.
Useful for a manager to see bottlenecks.

### 5. My Tasks

Each operator needs a personal task view:

- assigned today
- overdue
- blocked
- completed recently

---

## Business rules

- Every production order must belong to exactly one brand/project and one product.
- Every production order must have one active workflow.
- Each step instance must belong to exactly one production order.
- A step can have zero or one assignee.
- Parent-child steps must preserve order.
- Completed steps are not deleted; they remain in history.
- Changes to assignee, status, dates, and workflow structure must be logged.
- Delivery cannot be marked complete unless required upstream steps are complete or explicitly overridden by a manager.

---

## UX requirements

- Optimize for desktop first, but ensure tablet usability for workshop floor use.
- Fast update actions matter more than decorative UI.
- Dates and current owner must be visible without opening multiple screens.
- Distinguish clearly between:
  - order status
  - current manufacturing step
  - blocked/problem state
- Avoid forcing users to type long notes for routine updates.
- Provide one-click actions such as:
  - start step
  - complete step
  - block step
  - reopen step
  - assign myself

---

## Recommended technical stack

Unless the repository already uses another stack, prefer:

- Next.js (App Router)
- TypeScript
- PostgreSQL
- Prisma
- Tailwind CSS
- shadcn/ui for admin UI primitives
- NextAuth or equivalent for internal auth

If building APIs, prefer clear server actions or route handlers with strict types.

---

## Engineering rules for agents

### General rules

- Favor simple, maintainable CRUD first.
- Build around the domain model above instead of spreadsheet-shaped data.
- Do not hardcode brand/product-specific workflows into UI logic.
- Keep workflow templates data-driven.
- Make schema and code easy to extend for custom jobs.

### Database rules

- Use migrations for every schema change.
- Prefer explicit foreign keys and enums where appropriate.
- Preserve auditability; avoid destructive updates when history matters.

### Frontend rules

- Use server components where appropriate, but do not overcomplicate.
- Keep forms explicit and validated.
- Prioritize usable tables and detail screens over heavy visual effects.

### Backend rules

- Keep business logic out of presentation components.
- Centralize workflow transition rules.
- Validate illegal state transitions on the server.

### Testing rules

At minimum, add tests for:

- workflow generation from template
- step completion rules
- parent-child completion logic
- rollback / rework behavior
- delayed order detection

---

## Seed data expectations

Include seed data that reflects the reference schedule structure, such as:

- brands: VAINON, W TOKYO, UROKO, AAAMYYY
- products: Bangle, Ring, Pierce, Necklace, Bracelet, Key Chain
- workflow templates:
  - cast-based jewelry workflow
  - necklace workflow
  - special-order ring workflow
  - art-piece workflow with design check

This is for development convenience only. Keep the system generic.

---

## Suggested implementation order

1. Prisma schema
2. seed data
3. order list page
4. order detail page
5. workflow template generation
6. step status actions
7. dashboard summary
8. my tasks page
9. issue / rework logging
10. kanban board

---

## Non-goals

Do not optimize for:

- public storefront behavior
- customer checkout
- CMS-like marketing pages
- broad ERP breadth in the first version

This repository exists to solve a workshop operations problem.

---

## Definition of done for MVP

The MVP is successful when a small team can:

- create a production order from a workflow template
- assign workers to steps
- update progress in real time
- see what is delayed or blocked
- inspect who did what and when
- manage delivery readiness without relying on oral status sharing
