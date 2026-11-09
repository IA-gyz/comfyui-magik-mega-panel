# Magik Mega Panel

A ComfyUI custom node that produces a persistent integer index and a zero-padded string, with a movable dashboard for counter controls and workflow queuing.

This README describes the implementation reviewed on **2026-10-02**. It is both a user guide and a maintenance reference for humans and LLM coding agents. Descriptions of current behavior are distinct from accepted limitations. The source code remains authoritative if a later revision changes behavior.

## Contents

1. [Purpose and installation](#purpose-and-installation)
2. [Quick start](#quick-start)
3. [Counter semantics](#counter-semantics)
4. [Dashboard and layout](#dashboard-and-layout)
5. [Queue controller](#queue-controller)
6. [Prompter integration](#prompter-integration)
7. [Persistence and recovery](#persistence-and-recovery)
8. [Backend and API contract](#backend-and-api-contract)
9. [Frontend architecture](#frontend-architecture)
10. [Testing and troubleshooting](#testing-and-troubleshooting)
11. [Accepted limitations](#accepted-limitations)
12. [Maintenance guidance for LLMs](#maintenance-guidance-for-llms)

## Purpose and installation

The node manages sequential indexes. It does not load images, scan directories, sample latents, decode images, or produce an image grid. Queue controls submit the current ComfyUI workflow; downstream nodes perform generation.

| Item | Value |
| --- | --- |
| Display name | `Magik Mega Panel` |
| Backend class / API node type | `MagikMegaPanel` |
| Category | `custom` |
| Outputs | `index` (`INT`), `padded_index` (`STRING`) |
| Frontend registration | `magik.MegaPanel` |
| Frontend directory | `./js` |

Install the extension directory under `ComfyUI/custom_nodes/`. The installed files are:

| Relative path | Responsibility |
| --- | --- |
| `__init__.py` | Registers the node and frontend directory |
| `magik_mega_panel.py` | Counter, persistence, execution notification, state endpoint |
| `js/magik_mega_panel.js` | Dashboard, controls, graph discovery, queue lifecycle |
| `js/magik_mega_panel.css` | Dashboard appearance and responsive styles |
| `README.MD` | This guide |

Restart ComfyUI and reload the browser after installing or updating. Replace an existing installation rather than keeping two copies of the same extension.

The backend uses Python standard-library facilities plus ComfyUI's `server` module and its `aiohttp` environment. The frontend uses ComfyUI's `app` and `api` modules, native DOM APIs, and `ResizeObserver`. There is no frontend build step or extension-specific package installation. Restart controls require an available reboot endpoint, typically supplied by ComfyUI-Manager. Counter and queue features do not require Manager.

The node itself does not allocate tensors or directly consume GPU memory. RAM and disk use depend on saved counter entries and dashboard instances. Submitted workflows have their own RAM/VRAM requirements; this extension does not limit them.

## Quick start

1. Add **Magik Mega Panel** to a workflow.
2. Connect `index` or `padded_index` to a downstream consumer that participates in an executed output path. Merely placing the node in the graph does not guarantee ComfyUI will execute it.
3. Leave the default index at 1, or choose a knob value and press **Set Next**.
4. Queue a workflow manually to verify its output.
5. For Aim or Auto, add a supported prompter and check the queue controller's **Prompter**, **Total**, and **End index**.
6. Press **Start Auto** for sequential submission, or **Aim** followed by **Fire** for a batch submission.
7. Save the workflow to preserve its node identity, controls, and layout. Counter progress is stored separately on the server.

An unwired NL Meta Prompter can be discovered for its Total setting. That discovery does not wire the workflow or make either node execute.

## Counter semantics

### Terms

| Term | Meaning |
| --- | --- |
| Current | Most recently produced index, or the immediate preview after Set Next |
| Next | Next execution's index in normal operation; Set Next uses a special current/next preview |
| Knob value | Candidate target for Set Next; changing the knob alone does not reset the counter |
| `current_index` | Initial/reset target submitted to the backend |
| `reset_trigger` | Integer reset generation; changing it requests a reset on execution |
| Persisted `index` | Index the backend will produce on the next execution |
| Persisted `last_output` | Index most recently produced by the backend |

For a fresh identity, the backend produces `current_index`. For an existing identity, it produces the persisted `index`, unless `reset_trigger` differs from the saved generation.

After execution, it persists the produced index plus 1, or the same index when Freeze is enabled. There is no implicit wrap at Total or End index.

| Scenario | Output | Persisted next |
| --- | --- | --- |
| Fresh node, defaults | 1 | 2 |
| Next execution, unfrozen | 2 | 3 |
| Persisted next is 10, frozen | 10 | 10 |
| Reset target 25, new reset generation | 25 | 26 |
| Reset target 25, frozen | 25 | 25 |
| API initial target 0 | 0 | 1 |

### Set Next

Set Next copies the knob value into `current_index` and increments `reset_trigger`. It immediately previews **Current = target** and **Next = target + 1**, or **Next = target** when frozen. This immediate preview is intentional.

The backend has not executed yet: its upcoming output is still the target. Queue calculations therefore use the target as the next unproduced index, independently of the preview's Next display. The reset is committed when the node executes, not when the button is pressed.

Already-submitted prompts retain their captured input values. Set Next changes future submissions; it does not rewrite the pending queue.

### Freeze and padding

Freeze controls advancement; it does not stop a workflow or bypass downstream generation. Frozen executions retain the same next index. ComfyUI caching may reuse unchanged results.

Padding is between 1 and 12, default 3. It supplies a minimum string width with leading zeroes: index 7 becomes `007`, while index 1234 remains `1234` at padding 3. Changing padding updates the display immediately. Until an output or reset preview is known, the output display shows an em dash.

The backend accepts a nonnegative integer `current_index`, including 0. The normal knob range is 1–999999, so 0 requires a configured/API target rather than the knob. Invalid backend padding falls back to 3; invalid index or reset-generation types raise errors.

## Dashboard and layout

The seven dashboard widgets are:

| Widget ID | Purpose |
| --- | --- |
| `padded_index` | Formatted current output |
| `knob_int` | Target selector and knob settings |
| `index_state` | Current/Next display |
| `set_next` | Apply the selected reset target |
| `freeze` | Toggle counter advancement |
| `padding_control` | Adjust zero-padding width |
| `queue_controller` | Index/Total metrics, prompter selection, range and queue controls |

Native backend widgets remain present for prompt serialization but are hidden in the normal frontend. The DOM dashboard provides the controls.

Drag widget title bars to move them and use resize handles to resize them. Right-click a widget for rename, minimize, bring-to-front, and send-to-back actions. Restore minimized widgets from the tray. Layout locking prevents layout manipulation; it does not freeze the counter.

| Toolbar action | Behavior |
| --- | --- |
| Reset layout | Rebuild default geometry; retains existing labels and accents |
| Undo | Restore one captured layout snapshot; not a general workflow/counter undo |
| Save / Load layout | Manage named layouts shared by Mega Panels in this workflow |
| Lock widgets | Toggle layout movement/resizing |
| Snap | Toggle 8-pixel snapping |
| Toolbar auto-hide | Hide toolbar until its reveal area is hovered |
| Copy layout | Apply this layout to other Mega Panels in the active graph |
| Widget colours | Set/reset per-widget accent, background, and foreground overrides |

Named presets store geometry and the canvas size at capture time. Applying a preset scales its coordinates to the current canvas. They are layout presets, not queue presets.

### Knob settings

The selector supports a rotary knob, vertical slider, and horizontal slider. Settings include title, minimum, maximum, step, theme, color, and shape. Bounds are normalized to 1–999999; reversed bounds are swapped. Values snap to steps anchored at the minimum, then clamp to the range.

The increment/decrement buttons deliberately retain their large dimensions. Theme/color previews are temporary: Cancel, Escape, or an outside click discards them. Save commits settings and marks the workflow changed. Custom colors are restored on workflow load.

Available themes: `dark`, `cyberpunk`, `steampunk`, `minimal`, `glass`, `retro`, `futuristic`, `gaming`, `nature`, `cartoon`, `vaporwave`, `brutalist`, `material`, `neumorphism`, and `skeuomorphic`.

### Automatic queue layout

Queue settings and action buttons use a shared fluid scale. Actions use two columns. On resize or settings-area size changes, the frontend measures intrinsic row dimensions and reduces the scale when needed to fit the available body. Fire receives spare vertical space after the other rows fit. The queue dashboard has no scrolling feature.

This fits the contents inside the queue widget; it does not automatically rearrange all freely positioned dashboard widgets or prevent users from deliberately overlapping them. Very small widgets can make content difficult to read; enlarge them when necessary.

## Queue controller

| Control | Meaning |
| --- | --- |
| Index metric | Next unproduced index used for queue calculations |
| Total | Selected prompter's reported range value |
| Prompter | Automatic discovery or explicit node selection |
| End index | Inclusive upper boundary for Aim and Auto |
| Use Total | Follow Total live; enabled by default |
| Reset | Reset the **queue target** to 1; does not reset the counter |
| Aim | Toggle live calculation of the remaining submission count |
| Start Auto / Pause Auto | Enable/disable sequential automatic submissions |
| Fire `×N` | Submit N copies of the current workflow |
| Queue − / + | Adjust submission count and disable live Aim |
| Stop | Disable Auto and request interruption of current server execution |
| Clear | Disable Auto and clear the server's pending prompt queue |
| Restart warning button | Attempt a server reboot, then poll for recovery and reload |

Stop, Clear, and Restart act on the server, not exclusively on this counter's jobs. Pause Auto only disables future automatic submissions; it does not interrupt the active workflow or delete queued jobs.

Fire is independent of End index, prompter validity, and Freeze. A single target is clamped to 0–1000. Target 0 means no submission. Mouse-click Fire to submit; drag it horizontally to adjust the count (approximately one count per 10 pixels).

### End index

Use Total follows the selected prompter's Total. Uncheck it for a custom positive safe integer, saved in workflow JSON. A custom end may be below or above Total. Total itself remains the prompter's value.

The boundary is inclusive. With next index 1 and end 3, the intended sequence is 1, 2, 3; no automatic submission is needed once next becomes 4. A custom end does not change how a downstream prompter interprets or wraps indexes.

Changing End index pauses Auto and recalculates live Aim. A selected prompter with positive Total remains required even when a custom end is supplied.

### Aim

Aim calculates:

```text
remaining = max(0, end_index - max(0, trunc(next_index)) + 1 - outstanding)
queue_target = clamp(round(remaining), 0, 1000)
```

`outstanding` includes pending prompts containing this counter identity and a recognized running prompt whose counter event has not yet been observed. A running prompt whose counter has already executed is represented in the updated next index and is not subtracted twice.

Aim refreshes approximately every two seconds while enabled. Clicking Aim again disables tracking. Aim changes the target; it does not submit work. Fire submits the resulting count. Ranges larger than 1000 require multiple submissions or Auto.

### Auto

1. Validate the prompter Total and the current Freeze control.
2. Recover the persisted next index if needed.
3. Inspect the server queue for prompts containing this counter identity.
4. Wait for existing work, or submit one prompt if an index remains.
5. Record this counter's execution notification against the active prompt.
6. Wait for `execution_success` for the whole workflow. The counter event alone does not trigger replenishment.
7. Submit one further prompt if the range is unfinished and no other matching work is outstanding.

Auto is a session action and is not automatically re-enabled by loading a workflow. Its status reports startup, waiting, generation, completion waiting, completion, and stop reasons. Changing resolved prompter selection disables Auto and live Aim. Stop and Clear disable Auto. Recognized failures and interruptions stop it without automatic retry.

Counter progress is committed when the counter executes, before downstream work finishes. A downstream failure does not roll back that index. To retry, select the desired target and press Set Next, then submit again. Accepted edge cases in Auto are documented below.

## Prompter integration

NL variants are recognized by removing non-alphanumeric characters from the class type, lowercasing it, and checking the prefix `magiknlmetaprompter`. Standard, JSON, and suffixed variants are included. A matching title on an unrelated node type does not qualify.

The explicit legacy type set also includes `MagikPrompterA2S`, `MagikMetaPrompter`, `MagikAnimaXMetaPrompter`, and `MagikAnimaMetaPrompter`.

### Selection rules

1. A saved manual selection takes precedence if its node exists and is supported.
2. A missing/unsupported manual choice remains visible; another node is not silently substituted.
3. Automatic mode prefers NL variants over legacy candidates.
4. A breadth-first walk through output connections chooses the nearest eligible downstream prompter. Equal-distance matches are ambiguous.
5. If no connected match resolves selection, a single present NL variant can be used without a wire. Multiple NL candidates require manual selection.
6. Legacy-only automatic selection requires a downstream connection.

Discovery polls approximately every 500 ms. Traversal uses the current graph; nested subgraph boundaries are not expanded. Selecting a prompter reads its settings and does not modify graph connections.

### Total lookup

For NL variants, Total reads **Facial**, falling back to `max_index` only if Facial is absent/null. Legacy types use `max_index`. Total is truncated to an integer; invalid/nonpositive values become 0.

Setting reads use this order:

1. Live `_magikSettings.proxies` entry.
2. Native widget with a normalized matching name.
3. Parsed `settings` JSON widget with a normalized matching key.

Live proxies take priority because serialized JSON can lag a user edit by a microtask. An explicitly invalid Facial value does not fall through to a valid max_index. Total is not a sum of enabled phases or an ACTIVE count.

Aim and Auto are disabled when selection is unresolved or Total is not positive.

## Persistence and recovery

### Identity and ownership

Each node carries a UUID in the hidden `state_id` widget. It is saved in workflow JSON and is the backend counter key. Graph node IDs are only graph identifiers; they are not persistence keys.

Separately created nodes receive independent identities. Duplicating a node within a graph regenerates a duplicate identity. Reopening a saved workflow resumes its counter. Copies of that workflow retain the same UUID and therefore share the same counter on the same server account/state path. For API clients, reuse an identity to resume or use another UUID for independent progress.

Legacy graph-ID state is not migrated automatically because it cannot be assigned reliably to a workflow. A workflow without a valid UUID receives one from the frontend; save it afterward.

### Files

The default server-side location is:

```text
~/.comfyui_magik_mega_panel_state.json
```

It is relative to the operating-system user running ComfyUI, not the browser user. `MagikMegaPanel.STATE_FILE` controls the path in source; there is no UI path setting.

| File | Purpose |
| --- | --- |
| Primary `.json` | Current state for all identities |
| `.json.bak` | Previous known-good whole-file snapshot |
| `.json.lock` | Stable sidecar used for cooperating process locks |
| `.json.corrupt.<time>.<uuid>.json` | Preserved damaged primary bytes before recovery |
| Temporary `.tmp` files | Staging for atomic writes |

Each entry stores `index`, `last_reset`, `last_output`, and `ts`. Legacy entries without optional last-output/timestamp fields remain readable. Writes prune entries untouched for 90 days and cap the store at 2000 entries by recency. Consequently, an old or evicted identity may restart from its submitted initial target.

### Durability and recovery

Transactions hold a thread lock and an OS lock on the sidecar. POSIX uses `fcntl`; Windows uses `msvcrt`. The lock deadline is 30 seconds. Cooperating updated processes can safely share the state file; older versions that ignore this lock cannot.

Writes validate state, save the previous primary to backup, then commit the new primary. They use unique temporary files, file flush/fsync, atomic replacement, and directory fsync on POSIX. A backup-write failure prevents advancement of the primary.

Reads reject malformed JSON, duplicate keys, non-finite values, invalid entry types, negative/noninteger indexes, and invalid timestamps. Recovery preserves damaged primary bytes first. Healthy primary entries are retained while damaged entries are recovered from backup. A missing or wholly corrupt primary can be restored from a valid backup. If required recovery data is missing or invalid, execution fails rather than silently clearing the store.

Recovery may replay an index from the previous snapshot. Persistence failure prevents a successful output/event. If replacement succeeded before a later durability error, the saved state may already have advanced: inspect it before retrying.

Counter progress is not embedded in workflow JSON. Moving a workflow to another server without its state store does not transfer runtime progress.

## Backend and API contract

### Serialized inputs

All these inputs are required in the node schema; `unique_id` is injected by ComfyUI.

| Name | Type | Default / constraints | Role |
| --- | --- | --- | --- |
| `knobValue` | INT | 1; widget range 1–999999 | Frontend reset selector; not an automatic reset |
| `freeze` | BOOLEAN | false | Retain next index instead of advancing |
| `padding` | INT | 3; 1–12 | Minimum formatted output width |
| `current_index` | INT | 1; nonnegative | Initial/reset output target |
| `reset_trigger` | INT | 0 | Reset generation |
| `state_id` | STRING | Schema default empty; runtime requires UUID | Persistent counter identity |
| `unique_id` | Hidden UNIQUE_ID | Supplied by ComfyUI | Execution node identifier |

`process()` returns `(index, padded_index)`. `IS_CHANGED()` includes saved index/reset generation and submitted controls in its change signature. Do not assume unchanged frozen inputs force another Python execution.

### API prompt fragment

This is a node fragment, not a complete executable workflow. Add downstream output nodes and submit through ComfyUI's normal prompt API.

```json
{
  "1": {
    "class_type": "MagikMegaPanel",
    "inputs": {
      "knobValue": 1,
      "freeze": false,
      "padding": 3,
      "current_index": 1,
      "reset_trigger": 0,
      "state_id": "12345678-1234-4234-8234-123456789abc"
    }
  }
}
```

Use a newly generated UUID for an independent counter. Increment `reset_trigger` to apply a new `current_index` to an existing identity. Changing `knobValue` alone does not request a reset. Headless submissions do not run the browser dashboard's Aim or Auto logic.

### State endpoint

`GET /magik_mega_panel/state/{state_id}` returns:

```json
{"found": true, "index": 12, "last_output": 11, "last_reset": 0}
```

An unknown valid identity returns `{"found": false}`. Invalid UUIDs return HTTP 400; persistence errors return HTTP 503 with an `error` message. File work runs via `asyncio.to_thread`. The endpoint does not advance the counter; its read path may perform corruption recovery.

### Execution event

The backend emits `magik_mega_panel_executed` after successful state persistence. Its payload contains:

```json
{
  "node_id": "1",
  "state_id": "12345678-1234-4234-8234-123456789abc",
  "current": 11,
  "next": 12,
  "freeze": false,
  "padded_index": "011",
  "knob_value": 1,
  "padding": 3,
  "reset_trigger": 0
}
```

The notification uses `PromptServer.instance.client_id` to target the executing client. It contains no `prompt_id`; the frontend associates it with its observed `execution_start`. Event delivery failure is logged after state has committed and does not undo output.

## Frontend architecture

`MegaPanelUI` owns one node's DOM, widget map `_W`, layout, display state, and queue state `_qcState`.

| Area | Main functions |
| --- | --- |
| Identity | `ensureStateId` |
| Prompter integration | `isNLMetaPrompter`, `prompterSetting`, `prompterTotal`, `resolvePrompter` |
| Queue math | `remainingPrompts` |
| Knob normalization | `knobBounds`, `knobValue`, `knobGeometry` |
| Dashboard creation | `_build`, `_buildWidget`, `_buildQueueControllerContent` |
| Geometry and fitting | `_styleWidget`, `_applyLayout`, `_attachFluidScaling`, `_restoreLayout` |
| Controls and display | `_doSetNext`, `_doFreeze`, `_changePad`, `_syncControlState`, `_updateDisplays` |
| Backend synchronization | `_bindServer`, `_fetchInitialState` |
| Saved settings | `_saveLayout`, `_loadLayout`, `_savePreset`, `_applyPreset`, `_syncKnobFromProperties` |
| Lifecycle | `syncFromNode`, `_observeSize`, `dispose`, extension hooks |

Display restoration uses request IDs, state revisions, and reset generations to reject stale responses. `_pendingReset` protects the Set Next preview until the corresponding reset is observed. Current workflow controls take precedence over obsolete padding/freeze values from previously queued work.

Queue state is separate: `sb2Idx` is the next unproduced index, `_sb2IdxKnown` distinguishes initialized progress, `completedCounter` associates counter results with prompt IDs, `autoEpoch` invalidates Auto work, and `selectionEpoch` guards selection/range changes. `queueBusy` serializes automatic submission paths; `pendingSuccess` defers a completion that arrives during submission.

| Stored location | Data |
| --- | --- |
| Hidden native widgets / workflow widget values | Backend inputs, UUID and reset generation |
| `node.properties.mmpLayout` | Widget geometry, labels, stacking, minimization, color settings |
| `node.properties.mmpPrompterId` | Manual prompter graph ID; absent means automatic |
| `node.properties.mmpEndIndex` | Custom end; absent means Use Total |
| `node.properties.knob*` | Knob title, bounds, step, theme, shape and color |
| `graph.extra.mmpLayoutPresets` | Shared named layout presets |
| Server state JSON | Counter runtime progress |
| Runtime JS state | Auto/Aim state, active prompt tracking, temporary previews |

Older fractional layouts, browser-local layout data, and per-node named presets have compatibility paths. Do not confuse these layout migrations with counter-identity migration.

The extension hooks node creation, addition, configuration, resize, drawing, and removal. Restoration waits for usable canvas dimensions to avoid persisting a zero-sized layout. Removal disconnects observers, drag handlers, server listeners, queue timers, and open knob settings through the removal/cleanup hooks.

## Testing and troubleshooting

### Tests

The development workspace includes tests under `tests/`, alongside the extension folder. They are not included in the normal install ZIP.

Run from the development workspace root:

```bash
node --input-type=module --check < magik_mega_panel/js/magik_mega_panel.js
node tests/test_frontend.cjs
node tests/test_ui.cjs
python3 tests/test_counter.py
python3 tests/test_persistence.py
```

Run Python test files separately: the counter test invokes `unittest.main()` at import time and is not compatible with ordinary unittest discovery as currently written.

Coverage includes UUID isolation, counter/reset/freeze behavior, corruption recovery, write failures, process locks, concurrent counters, prompter variants, live settings lookup, Aim/Auto boundaries, delayed state responses, settings transactions, cleanup, and simulated layout fitting. The latest review passed both JS suites and 17 Python tests.

The DOM and ComfyUI APIs are mocked. Layout tests use simulated dimensions rather than a real CSS engine. Multiprocess persistence was tested on Linux; the Windows lock branch was not exercised. The user reported that the current auto-layout works well, but automated live ComfyUI/Firefox layout verification has not been completed. The accepted queue edge cases below were reproduced with separate review probes and are not corrected by the passing regression suites.

### Troubleshooting

| Symptom | Check / action |
| --- | --- |
| Dashboard absent or old appearance | Verify the `js` folder and `WEB_DIRECTORY`; remove duplicate installations, restart ComfyUI, reload the browser, inspect frontend errors |
| Counter does not advance | Ensure it participates in the executed output path; check Freeze and server persistence errors |
| Knob changes but output does not reset | Press Set Next; API clients must change reset_trigger |
| Total is 0 or unexpected | Check selected node, Facial/max_index, live proxies and serialized settings; Total is not an active-phase sum |
| Aim/Auto disabled | Resolve an ambiguous/missing selection and ensure positive Total |
| Range ends earlier/later than expected | Check End index and Use Total; manual Fire ignores the range boundary |
| Auto remains enabled but stops submitting | Review accepted tracking limitations; pause and restart Auto after the running work finishes |
| Index skipped after generation failure | Counter persistence happens before downstream completion; use Set Next to retry intentionally |
| Two workflow copies share progress | They retain the same state_id and server state path |
| Persistence corruption error | Inspect server logs and preserved files; back up primary/backup before manual repair; avoid deleting state as a routine fix |
| Lock timeout | Check other cooperating processes or slow storage; do not bypass the lock |
| Small or clipped-looking controls | Enlarge the queue widget/node and reload current JS/CSS; there is intentionally no queue scrollbar |
| Restart button fails | Verify Manager/reboot endpoint availability and server logs; restart manually if needed |

## Accepted limitations

The following five issues were reviewed and explicitly accepted by the user on **2026-10-02**. They remain part of the current implementation, not promised fixes.

| Limitation | Trigger and effect | Practical handling |
| --- | --- | --- |
| Auto can stall when attaching to an already-running prompt | Panel missed execution_start, so the counter event is not associated with that prompt; Auto stays enabled without replenishing | Let existing work finish, then pause/restart Auto |
| Auto can miss failures before this counter executes | Failure recognition depends on a recorded counter event; an upstream failure can leave Auto enabled | Inspect server error, pause Auto, resolve failure, restart intentionally |
| Freeze can allow one additional Auto submission | Freeze enabled after the counter event; replenishment checks the earlier result's frozen flag | Pause Auto when changing Freeze during active work |
| Delayed Aim can overwrite a manual target | An in-flight queue response resolves after Aim was disabled or target changed | Wait for the response, then adjust the target again |
| Fire lacks keyboard activation | Queuing uses mouse release rather than a click/keyboard handler | Use the mouse to activate Fire |

Related operational limits: graph traversal does not expand nested subgraphs; pending submissions keep their captured inputs; failed downstream work does not roll back progress; and Auto progress depends on the browser receiving the relevant lifecycle events.

The layout fitter observes an area it also resizes. Repeated fitting is a possible performance concern for future real-browser investigation, not a confirmed current defect.

## Maintenance guidance for LLMs

Read this README and the relevant source before editing. Preserve the distinction between output progress, reset preview, and queue progress. Do not infer semantics solely from names such as Current, Next, Total, or Reset.

### Behavior to preserve

- Keep node registration `MagikMegaPanel`, output types/order, and `WEB_DIRECTORY = "./js"` consistent across Python and frontend.
- Keep UUID-based persistence independent of graph IDs. Do not silently migrate ambiguous legacy counter state.
- Keep Set Next's immediate Current/Next preview and upcoming backend output semantics exactly as documented.
- Preserve backend support for index 0 while maintaining the normal knob bounds.
- Keep large knob increment/decrement button dimensions; they are an explicit user preference.
- Keep prompter discovery compatible with present NL variants, including settings-store nodes without a wire.
- Keep NL Total based on Facial, not ACTIVE or a sum of enabled phases.
- Keep End index inclusive, defaulting to Total, and separate from manual Fire.
- Keep Auto replenishment tied to whole-workflow success, not merely this counter's event.
- Keep theme/color cancellation transactional and custom colors restorable.
- Keep queue scrolling removed; use automatic fitting instead.
- Preserve validation, backup recovery, locks, atomic writes, and failure-before-success behavior.

### Scope constraints

The user accepted the five queue/keyboard limitations above. Do not automatically fix them as part of documentation or an unrelated change. Do not add successful-run progress tracking, a Retry failed index feature, or named queue presets without a new request. Named **layout** presets already exist and should remain distinct.

### Change workflow

1. Identify the owning layer: Python state, JS queue/control behavior, CSS layout, or workflow serialization.
2. Trace both backend output semantics and frontend previews for any counter change.
3. Check delayed-response behavior, already-queued prompts, and node removal for asynchronous changes.
4. Add focused regression checks for substantive behavior changes; do not claim mocked DOM checks prove real browser layout.
5. Run the affected checks above and report any test limitations.
6. Update this README when behavior or accepted constraints change.
7. Package one extension directory with its Python files, `js` assets, and this README. Exclude development tests, temporary state, and bytecode caches from the install ZIP.

Do not describe unimplemented features as available, or report accepted issues as fixed unless the source and verification support that claim.
