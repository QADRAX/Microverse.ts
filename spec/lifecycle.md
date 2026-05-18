# Microverse lifecycle (protocol)

This document describes how a conforming host runs scripts against a **host surface**. It is intentionally independent of any VM, language, or framework.

## Actors

| Actor | Role |
|-------|------|
| **Host** | Application services (database, auth, domain APIs). Never exposed directly inside the sandbox. |
| **Surface** | Declarative contract: bridges, capabilities, profiles, hooks (see `SurfaceSpec` JSON). |
| **Script catalog** | Registered script sources keyed by `scriptId`. |
| **Instance** | One mounted script in an isolated **slot** with a resolved profile and props. |

## Surface compilation

1. The host builds or loads a `SurfaceSpec` (declarative only — no handlers in the JSON artifact).
2. Bridge **handlers** are attached by the implementation in host language code, keyed by `bridge` + `method` names.
3. Capabilities referenced in the spec form the universe of `domain:action` strings for that surface.

## Script catalog

- **`registerScript`**: add `{ scriptId, source, profileId?, … }` to the catalog. Does not allocate a slot.
- Sources and profile ids are implementation-defined; the protocol only requires that `profileId` matches a `componentTypes` entry when present.

## Mount

**`mountInstance`** (names may vary per implementation):

1. Allocate a new **slot** (isolated environment).
2. Resolve **profile** (component type): capability set, props schema, state schema, allowed hooks, allowed bridge tables.
3. Merge **props** from host defaults and mount request; validate against profile props schema.
4. Inject bridge APIs allowed by the profile into the sandbox (see Capabilities).
5. Run script bootstrap and **`init`** lifecycle hook if defined.

## Capabilities

- Each bridge **method** declares `requires: "<domain>:<action>"`.
- Each **profile** declares a capability allowlist (including inherited parent profiles).
- At runtime, a profile only receives bridge **tables** that contain at least one method whose `requires` capability is in the profile set.
- Methods whose capability is not granted are **absent** from the sandbox API (not present but failing at call time).

## Host → script events

- The surface may define **component hooks**: named events with payload schemas (e.g. `OrderPlaced`).
- Profiles declare which hooks they implement.
- **`emit(eventKind, payload)`** delivers to every mounted instance whose profile includes that hook, invoking the implementation-defined handler (e.g. `onOrderPlaced` in Lua profile `lua@1`).

## Props sync

- Host may **`setProps`** / **`patchProps`** on an instance; validated against the profile props schema.
- Implementations may call **`onPropsChanged`** when props change after mount.

## Unmount and shutdown

- **`unmountInstance`**: run **`onDestroy`**, release slot resources.
- **`dispose`**: unmount all instances and tear down shared runtime if applicable.

## Conformance notes

- Timeouts, instruction budgets, and audit tags are implementation extensions; they are not part of `SurfaceSpec` v1.
- Multiple instances may share one process-level runtime; slots must remain isolated by the implementation.
