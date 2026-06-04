# Wizard Redesign Plan — Class Event, Class Group & Assignment

> Handoff spec for Claude Code. Based on a live walkthrough of all three wizards at `localhost:5173` (dev account) plus a source review of `frontend/src`. Goal: unify the three wizards behind shared components, cut mandatory fields, move from hard relationships to a tag/label model, fix the student picker, and fix responsiveness.

---

## 1. Executive summary

The three creation/edit wizards were clearly built at different times and never reconciled. They use three different modal shells, three different field-styling systems, two different step-navigation patterns, and only one of them shows a header or a progress indicator. The student picker (shared by all three) is the heaviest, most confusing screen in each flow and traps the action buttons below a nested scroll area. Several fields are mandatory that don't need to be, and the data model leans on hard single-relationships (one subject, fixed class groups) where lightweight tags would serve filtering far better.

Net effect matches the reported pain: amateur look-and-feel, too many mandatory fields, a bad student/group picker, and broken responsiveness.

The plan below is in priority order: fix the confirmed bugs, build a shared wizard kit, redesign the student picker, introduce tags, then polish per-wizard.

### What was tested live
Created a class event ("Year 9 English – Macbeth"), a class group ("GCSE Biology Set A", Physics, 2 students), and an assignment ("Macbeth Act 1 Essay") — all via full submit on the dev account. The assignment submit surfaced a real bug (below); the other two succeeded.

---

## 2. Confirmed bugs & irregularities

Severity: 🔴 critical · 🟡 moderate · 🟢 minor

| # | Severity | Area | Finding | Evidence |
|---|----------|------|---------|----------|
| B1 | 🔴 | Assignment | **Successful create reported as failure.** `POST /assignment/` returns **201**, but the UI shows "An error occurred while creating the assignment", never closes the modal, and never refreshes the board. Two causes: (a) the 201 body is empty, so `apiRequest` calls `response.json()` and throws `Unexpected end of JSON input`; (b) the wizard checks `result.status == 201`, but `apiRequest` resolves to the parsed body (no `.status` field), so even a clean parse would fail the check. | Network 201 + console `Unexpected end of JSON input`; `utils/agent.js` `apiRequest` line ~33 vs `add_assignment_wizard.jsx` `handleFinalSubmit` |
| B2 | 🔴 | Class Group | **Modal can be impossible to submit.** `screens/class-groups.jsx` renders the wizard in a hand-rolled `Box` with `width:900px`, `maxWidth:90%`, **no `maxHeight`, no `overflowY`**, centered with `alignItems:center`. On a 1440×900 viewport the content is taller than the screen, the top is clipped, the modal itself doesn't scroll (only the inner student list does), and Back/Submit sit below the fold and cannot be reached. Had to enlarge the window to 1200px tall to submit. | Live repro at 1440×900; source confirms no maxHeight/overflow |
| B3 | 🔴 | All / layout | **Responsive grids are dead.** The app is on MUI v7 but still uses the v1 `<Grid item xs={…} sm={…}>` API across `class-groups`, `resources`, `students`, `signup`, `login`, and several drawers. v7 removed `item`/`xs`/`sm`/`md`/`lg`/`xl` on `Grid`, so these props are ignored and the responsive column behaviour silently does nothing. | Console: "MUI Grid: The `item`/`xs`/`sm`/`lg`/`xl` prop has been removed"; `grep '<Grid item'` |
| B4 | 🟡 | Class Event | **Date/time validation errors never render.** `DatePicker`/`TimePicker` use the removed `renderInput` prop (MUI X v6+), so the `helperText`/error wiring is dead. Invalid dates can't surface inline. Same `renderInput` misuse appears on the Assignment `max_score` field (a plain `TextField`), leaking a `renderInput` attribute to the DOM. | Console: "MUI X: The `renderInput` prop has been removed"; React DOM warning `renderInput renderinput`; `class_event_wizard.jsx`, `add_assignment_wizard.jsx` |
| B5 | 🟡 | Class Event | **Duration field shows the wrong error.** The Duration `TextField` binds `error={!!errors.class_code}` / `helperText={errors.class_code?.message}` — a copy-paste from a non-existent `class_code` field. Duration validation (10–180) can't display. The edit path also `setValue("class_code", …)` for a field that doesn't exist. | `class_event_wizard.jsx` lines ~220, ~74 |
| B6 | 🟡 | Class Event | **Edit mode can crash.** Default values read `classData?.subject.id` — optional chaining stops at `subject`, so a null/absent subject throws. Separately, `schedule_class_modal.jsx` resolves the subject by **name** while the wizard expects `subject.id`, so the subject may not pre-populate on edit. | `class_event_wizard.jsx` line 63; `schedule_class_modal.jsx` lines 36–41 |
| B7 | 🟢 | Assignment | **Debug text in production.** Step 2 renders a literal `<Typography>Step 2</Typography>` above the student search. | Live; `add_assignment_wizard.jsx` step 2 |
| B8 | 🟢 | Navigation | **"Add New Class" is overloaded.** The same label on the Dashboard opens the *class event* wizard, and on the Classes page opens the *class group* wizard. Two different objects, one label. | Live |
| B9 | 🟢 | All | **No submit/loading state.** No wizard disables its submit button or shows a spinner during the async request, so a double-click can double-submit (plausibly how B1's retry created duplicates). | All three wizards |
| B10 | 🟢 | Class Group | **Color picker is 120 lines of copy-paste.** Ten `<MenuItem>`s each hand-build a swatch + label inline; the palette should be data-driven. | `class_group_wizard.jsx` lines 238–377 |

---

## 3. Root-cause inconsistencies (the "why it feels amateur")

Three parallel implementations of the same idea:

**Modal shell**

| Wizard | Shell | Header? | Step indicator? | Scrolls? |
|--------|-------|---------|-----------------|----------|
| Assignment | `FormModal` → `ModalContainer` + `WizardLayout` | ✅ "Create New Assignment" | ✅ 3 dots | ✅ `maxHeight:90vh; overflowY:auto` |
| Class Event | inline `Modal`+`Box` (`#333`) in `schedule_class_modal.jsx` | ❌ | ❌ | ❌ no maxHeight |
| Class Group | inline `Modal`+`Box` (`#333`, `width:900px`) in `class-groups.jsx` | ❌ | ❌ | ❌ no maxHeight |

`WizardLayout` and the `stepIndicator` style exist but are only wired into the assignment flow.

**Field styling** — three systems in parallel: `styles/input.jsx` (`inputStyle`, transparent + hardcoded `#fff` borders), `styles/components/ModalStyles.jsx` (`modalStyles.inputField`, `#2A2A2A` fill), and raw MUI `TextField`/`Select` with inline `sx`. Colors are hardcoded (`#fff`, `#333`, `#1E1E1E`, `#2A2A2A`, `#00b0ff`, `#ff5252`) rather than theme tokens, so there's no single source of truth and dark/light theming is impossible.

**Step navigation** — Class Event & Class Group hardcode `setStep(1)`/`setStep(2)`; Assignment uses `setStep(prev => prev±1)`. Step state lives in the parent screen, not the wizard.

**Buttons** — Class Event & Class Group use raw `<Button>`; Assignment uses `ModalButton`. `CancelButton`/`NextButton`/`SubmitButton` are defined but unused.

---

## 4. Target architecture — shared wizard kit

Build one set of primitives and refactor all three wizards onto them.

### 4.1 `<WizardShell>`
The single modal scaffold. Replaces `FormModal`, `schedule_class_modal`'s inline Box, and `class-groups`'s inline Box.

- Owns its own step state (`useWizard()` hook returning `{ step, next, back, goTo, isFirst, isLast }`); parents stop passing `step`/`setStep`.
- Props: `title`, `steps: WizardStep[]`, `open`, `onClose`, `onSubmit`, `submitting`.
- Always renders: header (title + step label), a real step indicator (numbered, labelled, clickable to completed steps), a scrollable body, and a **sticky footer** holding Back / Next / Cancel / Submit.
- Footer is sticky to the modal bottom so actions are always reachable regardless of body height (fixes B2). Body scrolls; footer doesn't.
- Container: `max-height: 90vh`, `overflow-y: auto` on the body only, responsive width `min(640px, 95vw)`. No nested scroll regions inside the body (fixes the picker double-scrollbar).
- Disables Next/Submit while `submitting` and shows an inline spinner (fixes B9).

**Acceptance**
- AC-WS1: All three wizards render through `<WizardShell>`; `FormModal`, `WizardLayout`, and both inline modal Boxes are deleted.
- AC-WS2: At 1280×720, 1440×900, 768×1024, and 390×844, Back/Next/Cancel/Submit are visible without scrolling for every step of every wizard.
- AC-WS3: The body is the only scroll container; there is never more than one vertical scrollbar visible.
- AC-WS4: The step indicator shows the current step, total steps, and step names; completed steps are clickable, future steps are not.
- AC-WS5: Submitting disables the primary action and shows a spinner; a second click cannot fire a second request.

### 4.2 `<Field*>` kit
One themed field set used everywhere: `<TextField>`, `<SelectField>`, `<DateField>`, `<TimeField>`, `<NumberField>`, `<TagField>` (section 6). Wrappers over MUI that read theme tokens, expose `label`, `error`, `helperText`, `required`, `hint`, and use **current** MUI X slot APIs (`slotProps.textField`), never `renderInput` (fixes B4).

**Acceptance**
- AC-FK1: No component passes `renderInput` to any MUI X picker or `TextField`; console is free of the `renderInput` removed-prop warning and the React DOM `renderInput` attribute warning.
- AC-FK2: `inputStyle`, `modalStyles.inputField`, and ad-hoc inline `sx` color overrides are removed; all field colors resolve from theme tokens.
- AC-FK3: Every field's error text renders inline beneath the field, including date/time and duration (fixes B4/B5).

### 4.3 `<StudentPicker>` — see section 5.

### 4.4 Submit contract fix
Normalise `apiRequest` so callers get a predictable result and 201-with-empty-body is a success, not a throw.

- Treat 200/201/204 as success. If the body is empty or non-JSON, resolve to `{ ok: true, data: null }` rather than throwing.
- Return a consistent envelope `{ ok, status, data, error }`; update all three wizards to branch on `result.ok` (fixes B1).
- On success: toast success, refresh the parent list, reset + close. On failure: keep the modal open, keep entered data, show the server error.

**Acceptance**
- AC-SC1: Creating an assignment with a 201 empty-body response shows the success toast, closes the modal, and the new card appears in "Set" without a manual refresh.
- AC-SC2: A forced 4xx/5xx keeps the modal open with data intact and shows the server's error message.
- AC-SC3: No "Unexpected end of JSON input" path remains; verified by a unit test around `apiRequest` with empty-body 201/204.

---

## 5. Student picker redesign (highest-impact UX fix)

Current `StudentSearch` problems, all observed live:
- A fixed-height inner list (`maxHeight:400px, overflowY:auto`) sits inside a `minHeight:500px` container inside the modal → **two scrollbars**, and the action buttons live *below* the inner scroll region so they're easily lost (and, in the class-group modal, unreachable — B2).
- The "Filter by Class Group" block is a grid of `Paper` cards, each with a checkbox **and** its own Select-All / Deselect-All buttons, plus a second global Select-All-Visible / Deselect-All-Visible bar. Filtering and bulk-selection are visually conflated; it's a lot of controls for "pick some students".
- Hardcoded colors (`#00b0ff`, `#ff5252`, `#999`, `rgba(255,255,255,…)`), forced-white checkboxes, `minWidth:180px` cards that wrap awkwardly when narrow.

### Target design
A single `<StudentPicker>` primitive, used identically by all three wizards.

- **One scroll region.** The list scrolls within the modal body; no inner fixed-height box. No nested scrollbars (AC-WS3).
- **Top bar:** a search input (debounced, matches name / username / email — keep existing match logic) and a compact filter control. Replace the card grid with **filter chips** (one per class group/tag) that toggle the visible set. Selecting a filter chip never selects students — filtering and selection are separated.
- **Bulk actions** collapse to a single context line: "`N of M shown selected`" with one "Select all shown" / "Clear shown" affordance. Drop the per-group Select-All/Deselect-All buttons; a group filter + "Select all shown" achieves the same in two clicks with far less chrome.
- **Rows:** avatar, name, username, and the student's tag chips on the right. Whole row is a click target; checkbox is the affordance. Selected rows get a subtle filled state.
- **Selected summary:** a sticky count and a "Selected (N)" chip rail at the top of the picker so the user always sees who's in without scrolling.
- **Virtualise** the list if student counts can exceed ~100.
- **Empty state** stays ("No students found"), themed via tokens.

### Acceptance
- AC-SP1: The picker contributes no second scrollbar at any breakpoint; the modal footer stays reachable.
- AC-SP2: Search filters by name, username, and email; clearing search restores the full list.
- AC-SP3: Tag/group filter chips narrow the visible list and combine with search (AND); selecting a filter never changes the selection set.
- AC-SP4: "Select all shown" selects only the currently filtered rows; "Clear shown" removes only those; selections outside the current filter are preserved.
- AC-SP5: The selected count and selected-student chips are visible without scrolling.
- AC-SP6: Identical component and behaviour in all three wizards (no per-wizard copy).
- AC-SP7: At 390px width the picker is single-column, chips wrap, and no horizontal scroll appears.

---

## 6. Labels & tags model (reduce hard relationships)

Today: a class event has exactly one `subject` (required); assignments have one `subject` (required); class groups have a required `class_code` and a single `color`; students relate to class groups through a hard membership used both for grouping and for picker filtering. This forces data in at creation time and makes cross-cutting queries ("all Macbeth work", "all Year 9 things", "everything tagged revision") impossible without overloading subject.

### Proposal
Introduce a lightweight, polymorphic **tag** (label) that attaches to events, groups, assignments, and students. Keep subject as a first-class field where it's pedagogically meaningful, but make most categorisation optional tags.

- **Data:** a `Tag { id, name, color, kind? }` and a generic tagging join (`taggable_type`, `taggable_id`). Free-form create-on-type, with autocomplete over existing tags so the vocabulary converges without being enforced.
- **UI:** a `<TagField>` (MUI Autocomplete, `freeSolo`, `multiple`, chip render) in every wizard. Typing a new value offers "Create '…'". Existing tags autocomplete with their colour.
- **Filtering:** the dashboard, classes board, and assignment board gain tag filters; the student picker's filter chips are tags too (class-group membership becomes one tag kind among others).
- **Migration:** seed tags from existing subjects and class codes so nothing is lost; existing subject/group relations remain but are no longer the only axis.

### Lower the barrier to entry
- Class Group: make `class_code` **optional** (auto-suggest e.g. slug of name; let the user override). Subjects become optional tags rather than a required multi-select. Color defaults sensibly.
- Class Event: keep date/time/duration (sensible defaults already exist — today's date, now, 60 min); make **subject optional** (offer it as a tag) so a class can be scheduled in seconds; name optional.
- Assignment: keep title required; make **subject optional**; keep the good defaults (due = +7 days, max score = 100). Students optional at create (can be assigned later).

### Acceptance
- AC-TAG1: Every wizard exposes a `<TagField>` that creates-on-type and autocompletes existing tags.
- AC-TAG2: A class event and an assignment can each be created with only their truly essential field(s) — date/time for an event, title for an assignment — and nothing else.
- AC-TAG3: `class_code` is optional on class groups, with an auto-suggested default.
- AC-TAG4: At least one board (assignments) can filter by tag, and the student picker filter chips are backed by tags.
- AC-TAG5: Existing subjects/class codes are represented as tags after migration; no existing record loses categorisation.

---

## 7. Per-wizard plans

### 7.1 Class Event wizard
**Now:** 2 steps (details → students). No header, no step indicator, wrong-field duration error, broken date errors, edit-mode crash risk, raw buttons, inline-Box modal with no scroll.

**Target**
- Step 1 "Details": name (optional), date, time, duration (with working min/max error), subject as optional tag, plus general tags. Sensible defaults preserved.
- Step 2 "Students": shared `<StudentPicker>`.
- Through `<WizardShell>` with header "Schedule a class" and a 2-step indicator.
- Fix B5 (duration error binds to `errors.duration`), B6 (`classData?.subject?.id`, resolve subject by id in the modal), B4 (date/time via `slotProps`).

**Acceptance**
- AC-CE1: A class event can be created with just date + time + duration (defaults already valid), no subject required.
- AC-CE2: Entering duration < 10 or > 180 shows the duration error inline; date/time errors render inline.
- AC-CE3: Editing an existing event with a missing subject does not throw; an existing subject pre-populates correctly.
- AC-CE4: Header and a working 2-step indicator are present.

### 7.2 Class Group wizard
**Now:** 2 steps (details → students). Fixed `width:900px` modal with no maxHeight/overflow (B2 — submit can be unreachable), required `class_code`, required subjects, 120-line inline color picker, no header/indicator.

**Target**
- Step 1 "Details": name (required), description (optional), subjects as optional tags, code **optional** with auto-suggest, color from a data-driven palette (B10), general tags.
- Step 2 "Students": shared `<StudentPicker>`.
- Through `<WizardShell>` (fixes B2 via sticky footer + body scroll), header "Create class group", 2-step indicator.
- Replace the legacy `<Grid item>` on the classes board (B3) with current Grid/CSS layout.

**Acceptance**
- AC-CG1: At 1440×900 the wizard submits without resizing the window; footer always reachable.
- AC-CG2: A group can be created with only a name; code auto-suggests and is editable.
- AC-CG3: The color palette renders from an array (no per-color JSX duplication).
- AC-CG4: The classes board lays out responsively (1 col mobile, 2–3 col desktop) with no MUI Grid console warnings.

### 7.3 Assignment wizard
**Now:** 3 steps (details → students → files). Best of the three (has header + indicator via `FormModal`/`WizardLayout`) but submit is broken (B1), shows "Step 2" debug text (B7), and `max_score` misuses `renderInput` (B4).

**Target**
- Keep 3 steps but move to `<WizardShell>`; remove the "Step 2" debug text.
- Step 1: title (required), subject optional tag, description, start/due dates (defaults kept), max score (clean `NumberField`), general tags.
- Step 2: shared `<StudentPicker>` (students optional).
- Step 3: file dropzone (already optional) — keep.
- Fix the submit contract (B1) so a 201 is success, the board refreshes, and the modal closes.

**Acceptance**
- AC-AS1: Submitting creates the assignment, shows success, closes the modal, and the card appears on the board with no manual refresh (B1 resolved).
- AC-AS2: No "Step 2" debug text; steps are labelled via the indicator.
- AC-AS3: `max_score` is a plain number field with inline validation; no `renderInput` DOM warning.
- AC-AS4: An assignment can be created with only a title (+ default dates/score).

---

## 8. Design language notes

The current dark theme is fine as a direction; the problem is execution (hardcoded hex, inconsistent spacing, no tokens). Establish a token layer and apply it uniformly.

- **Tokens / theme:** define color, spacing, radius, and typography in the MUI theme; ban hardcoded hex in components. Map the existing palette (`#2196F3` primary, `#4CAF50` success, `#ff5252` danger, surfaces `#1E1E1E`/`#2A2A2A`) to `theme.palette` and surface tokens. One source of truth enables eventual light mode.
- **Surfaces:** modal `#1E1E1E` with a 1px `rgba(255,255,255,0.1)` border and `border-radius` from the theme (use the existing `ModalContainer` look as the canonical surface). Inputs one step lighter (`#2A2A2A`).
- **Spacing:** 8px base. Field vertical rhythm 24px (`mb:3`); modal padding 32px desktop / 16px mobile; button gap 16px. No more mixed `mb:2`/`mb:4`/`mb:3` per field.
- **Typography:** modal title 20px/600; field labels 14px; helper/error 12px. Sentence case for all labels and buttons ("Create class group", not "CREATE" or "Create Class Group").
- **Inputs:** consistent height (~48px), 1px border at `rgba(255,255,255,0.15)`, hover `0.3`, focus = primary, error = danger; floating labels; helper-text row always reserved to avoid layout jump.
- **Buttons:** one `ModalButton`. Primary = filled primary; secondary/Back = outlined; Cancel = text. Full-width pair on mobile, right-aligned auto-width on desktop. Disabled + spinner while submitting.
- **Chips/tags:** rounded, colored from the tag's own color at low-alpha fill with the same hue for text (never plain black/white on color). Group/subject chips reuse the same chip.
- **States:** every interactive element needs hover, focus-visible, active, disabled, and loading. Inputs need error and (where relevant) success.
- **Step indicator:** numbered + labelled, primary fill for current/completed, muted for upcoming, connecting line; replaces the bare dots.
- **Motion:** keep it light — 150–200ms ease for step transitions and button hovers; respect `prefers-reduced-motion`.

---

## 9. Accessibility & responsiveness requirements

- **Responsive:** rebuild any layout still on the legacy `<Grid item>` API (B3) using current MUI Grid (v2) or CSS grid/flex. Targets: 390 (mobile), 768 (tablet), 1024+, 1440. Boards: 1 column on mobile, 2–3 on desktop. Modals: full-width sheet feel on mobile (≤480px → near-full-screen with sticky footer), centered card on desktop.
- **Touch targets:** ≥44px for checkboxes, chips, and buttons in the picker.
- **Contrast:** all text ≥ WCAG AA (4.5:1) on its surface; verify the muted greys (`#999` today) and chip text on colored fills.
- **Keyboard:** full tab order through fields → footer; Enter advances/submits; Esc closes; focus moves to the first field of each new step; focus is trapped in the modal.
- **Screen reader:** modal labelled by its title; step indicator announces "Step X of N: <name>"; required fields and errors are associated via `aria-describedby`.

---

## 10. Suggested build order

1. `apiRequest` envelope + submit-contract fix (B1) and add the empty-body 201/204 test — unblocks correct success handling.
2. Theme tokens + `<Field*>` kit (kills `renderInput`, hardcoded colors, B4/B5).
3. `<WizardShell>` + `useWizard` (sticky footer fixes B2; header + indicator everywhere).
4. `<StudentPicker>` rebuild (single scroll, chip filters) — biggest UX win.
5. Refactor the three wizards onto the shell + kit + picker; delete `FormModal`, `WizardLayout`, both inline modal Boxes, `inputStyle`, `modalStyles.inputField`, the unused button variants, and the inline color list (B10).
6. Tags model + `<TagField>` + make fields optional (B-set on barriers); migrate subjects/codes to tags.
7. Responsive grid migration (B3) and a11y pass.
8. Remove debug text (B7); de-duplicate the "Add New Class" label (B8).

---

## 11. Cross-cutting acceptance criteria

- AC-X1: All three wizards share `<WizardShell>`, `<Field*>`, and `<StudentPicker>`; no wizard contains a bespoke modal, field-style object, or student list.
- AC-X2: The browser console is warning-free during a full create flow in each wizard (no MUI Grid, MUI X `renderInput`, or React DOM attribute warnings).
- AC-X3: Each wizard can be completed at 390, 768, and 1440px wide with all actions reachable and no nested scrollbars.
- AC-X4: A "minimum-effort" create succeeds in each wizard (event: date/time/duration; group: name; assignment: title) with everything else optional.
- AC-X5: Tags can be added in each wizard and used to filter at least the assignments board and the student picker.
- AC-X6: No hardcoded hex colors remain in the three wizards or the picker; all resolve from theme tokens.

---

### Appendix — key files

- `frontend/src/components/ClassEvents/class_event_wizard.jsx`, `…/schedule_class_modal.jsx`
- `frontend/src/components/ClassGroups/class_group_wizard.jsx`, `frontend/src/screens/class-groups.jsx`
- `frontend/src/components/Assignments/add_assignment_wizard.jsx`, `…/add_assignment_modal.jsx`
- `frontend/src/components/Students/student_search.jsx`, `…/student_select_card.jsx`
- `frontend/src/layouts/FormModal.jsx`, `…/WizardLayout.jsx`
- `frontend/src/styles/input.jsx`, `…/components/ModalStyles.jsx`, `…/components/ModalButtons.jsx`, `…/components/FormInput.jsx`, `…/components/SharedStyles.jsx`
- `frontend/src/utils/agent.js` (`apiRequest`, `handleCreateAssignment`, `handleCreateClassGroup`, `handleUpdateClassGroup`)
