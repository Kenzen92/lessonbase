# Luminous Design Rollout — Migration Plan

> Handoff spec for Claude Code. Goal: roll the **Luminous EdTech** design system (already shipped on the dashboard) out to the five remaining authenticated pages — **Students, Classes, Resources, Assignments, Settings/Profile** — by extracting the shell + chrome into reusable components **once**, then migrating one page at a time.
>
> This document is the single source of truth for the rollout and **must be kept current**: update the status tables in §8 as each item lands so the work can be picked up by a fresh context/instance at any point.

---

## 1. Executive summary

The teacher **dashboard** was rebuilt against the Stitch "Luminous EdTech" design (`DESIGN.md` at repo root) and merged to `main` (commit `b3ff114`). Its implementation lives under `frontend/src/components/Dashboard/luminous/` and is fully token-driven via `tokens.js` (`lumi`, `lumiType`, `tint`).

The other five pages still use the **legacy chrome**: a top `AppBar` from `components/main_navigation.jsx`, an `ActionStatisticsBar`, a MUI `Container`, and hardcoded colours (`#333`, `#0a0a1a`, `rgba(255,255,255,…)`). They look nothing like the new dashboard.

The Stitch export (`Downloads/stitch_unified_ui_design_system`) provides one reference screenshot per page. **These screenshots are AI-generated and mutually inconsistent** in exactly the chrome we want to unify (see §3). The strategy is therefore: **build the shared chrome once, let it override the per-screenshot inconsistencies, then reskin each page's content onto it.**

### Decisions locked with the product owner
1. **Scope per page:** full redesign — page chrome **and** cards/lists **and** the detail drawers, creation wizards, and modals belonging to that page. (Drawers/wizards aren't in the screenshots; style them from `DESIGN.md` + the shared kit.)
2. **Rollout order (simple → complex):** Students → Classes → Resources → Assignments → Settings/Profile.
3. **Top bar:** build one reusable `TopBar` (search + notifications + profile). Wire its search to each page's **existing** filter logic where one exists (Students, Classes, Assignments, Resources); presentational placeholder otherwise. **Leave the shipped dashboard's welcome-hero banner as-is** — do not retrofit it.

---

## 2. Current architecture snapshot

### 2.1 What already exists and is reusable (under `components/Dashboard/luminous/`)
| File | Exports | Reuse plan |
|------|---------|-----------|
| `tokens.js` | `lumi`, `lumiType`, `tint` | **Promote** to shared. Single source of colour/type/radius. |
| `shared.jsx` | `LumiIcon`, `accentColor`, `statusAccent`, `SubjectChip` | **Promote** to shared. Add icons as needed. |
| `side_nav.jsx` | `SideNav`, `SIDEBAR_WIDTH` | **Promote** to shared — this is the canonical left nav for every page. |
| `sample_data.js` | `navItems`, sample\* | Move `navItems` to a stable module; sample data stays dashboard-local. |
| `recent_assignments.jsx` | (private) `StatusPill` | **Promote** `StatusPill` to shared; it's needed by Assignments. |
| `metrics_grid.jsx` | `MetricsGrid` | Dashboard-specific (big metric cards). Page headers use a lighter `StatSummary` instead (§4). |
| `luminous_dashboard.jsx` | `LuminousDashboard` | Reference for how the shell is composed. The shell logic gets extracted into `AppShell`. |

### 2.2 What is legacy and gets replaced
| Concern | Legacy | Replacement |
|---------|--------|-------------|
| Top nav | `components/main_navigation.jsx` (`AppBar`) | `SideNav` (left) + `TopBar` |
| Page actions + stats | `components/Dashboard/action_statistics_bar.jsx` | `PageHeader` + `StatSummary` |
| Page wrapper | MUI `Container` | `AppShell` content slot |
| Per-page cards | `ClassGroupCard`, `StudentInfoCard`, `ResourceCard` (inline), `AssignmentCard` | Luminous re-skins (§5) |

### 2.3 Routing
`App.jsx` wraps the five pages in `<PrivateRoutes>`. Routes unchanged by this work:
`/students/:id?`, `/class-groups/:id?`, `/assignments/:id?`, `/resources`, `/profile`, `/dashboard/:id?`.
Each page currently renders `<Navigation/>` itself; after migration each renders `<AppShell>` instead. Auth screens (`login`, `signup`, `verify-email`, `forgot/reset-password`) are **out of scope** and keep the legacy MUI `darkTheme`.

### 2.4 Wizards already have a shared kit
`components/wizard/` (`WizardShell`, `useWizard`, `StepIndicator`) exists and is partly adopted. See `docs/wizard-redesign-plan.md`. The drawer/wizard restyle (Phase 6) builds on that kit rather than inventing a new one — coordinate the two plans.

### 2.5 Data is already in contexts (no backend work)
`user`, `students`, `subjects`, `class_groups`, `statistics`, `assignments`, `class_event` contexts already supply everything. This rollout is **frontend-only, presentational**. Don't change context shapes; transform at the screen boundary like `dashboard-luminous.jsx` does.

---

## 3. Screenshot inconsistencies → canonical decisions

The Stitch screenshots disagree. The shared components resolve each conflict **once**:

| Element | What the screenshots show | Canonical decision |
|---------|---------------------------|--------------------|
| Brand block | "Luminous / EdTech Platform" vs "Luminous / EDTECH PLATFORM" vs top-bar "Luminous EdTech" | `SideNav` brand only, fixed casing, app name **"Lessonbase"** (matches shipped dashboard), not "Luminous". |
| Top-bar search copy | "Search classes, students…" / "Search resources…" / "Search student…" / "Search…" | One `TopBar`; placeholder is a per-page prop. |
| Top-bar extras | date pill (Settings), help icon (Students/Assignments), none (Classes) | Drop date + help icon. `TopBar` = search + notifications + profile, everywhere. |
| Profile block | "John Doe/Instructor", "Teacher One/Senior Instructor", "Admin User/System Admin", bare avatar | Real `user` context (name + avatar). Role line optional/omitted. |
| Page action button | in top bar (Resources "Add Resource") vs in page header (others) | Primary action lives in `PageHeader`, right-aligned, consistently. |
| Status/subject chips | mixed pill styles, some mono, some not | `SubjectChip` (tinted pill) + `StatusPill` (dot + border). Mono = `labelMd` for system labels only. |
| Card top strip | green/blue 4px strip, varies | `StripCard` base with an `accent` prop driving the strip colour. |

---

## 4. Phase 0 — Shared foundation (build once, before any page)

Create `frontend/src/components/luminous/` as the app-level design-system module and move/extract into it. Add a barrel `index.js`. Update the dashboard's imports to the new location (re-export shims are fine to avoid a big-bang change).

**Move (no behaviour change):** `tokens.js`, `shared.jsx`, `side_nav.jsx`, plus a `nav.js` holding `navItems`.

**Promote to shared (extract from existing files):**
- `StatusPill` — out of `recent_assignments.jsx`.

**Build new:**

| Component | Purpose | Key props | Drawn from |
|-----------|---------|-----------|-----------|
| `AppShell` | Page scaffold: `SideNav` + `TopBar` + scrollable `<main>` (maxWidth 1280, sidebar offset). Owns logout + create-new wiring like `dashboard-luminous.jsx`. | `activeNav`, `user`, `topBar={placeholder,value,onChange}`, `onCreateNew`, `onLogout`, `onNavigate`, `children` | extracted from `luminous_dashboard.jsx` layout `<Box>` |
| `TopBar` | Sticky top bar: `SearchInput` + notifications + profile (name/avatar). | `searchPlaceholder`, `searchValue`, `onSearchChange`, `user`, `actions?` | screenshots (normalized per §3) |
| `SearchInput` | Token-styled search field (icon + input, focus glow). | `placeholder`, `value`, `onChange` | DESIGN.md "Input Fields" |
| `PageHeader` | Title + subtitle + right-aligned primary action + optional `StatSummary`. | `title`, `subtitle`, `action={label,icon,onClick}`, `stats?` | all 5 screenshots |
| `StatSummary` | Inline row of (icon + value + mono label) stat items from `statistics`. Replaces `ActionStatisticsBar` stats. | `items=[{icon,value,label}]` | Classes/Students/Assignments headers |
| `PrimaryActionButton` | Electric-blue CTA (`primaryContainer`, 40/48px, `buttonText`). | `label`, `icon`, `onClick` | DESIGN.md "Buttons / Primary" |
| `StripCard` | Card base with 4px coloured top strip, `surfaceContainer`, hairline border, hover lift. | `accent`, `children` | Classes/Resources cards |
| `AvatarStack` | Overlapping initials avatars + "+N" overflow. | `people`, `max` | Classes card |
| `KebabMenu` | `MoreVert` → menu (edit/delete/…). | `items` | Classes card |
| `EmptyState` | Centered icon + message. | `icon`, `message` | Assignments columns, Resources empty |
| `ViewToggle` | Grid/list segmented toggle. | `value`, `onChange` | Resources |
| `KanbanColumn` | Coloured header strip + scroll body + `EmptyState`. | `title`, `accent`, `children`, `empty` | Assignments board |
| `FilterBar` | Filter button + clickable chip row. | `chips`, `selected`, `onToggle`, `onClear` | Resources filter, Assignments tag filter |

**Definition of done for Phase 0:** dashboard still renders identically; `npm run lint` + `npm run test` green; new components have a minimal render test where the existing `luminous` pieces do.

> Build pragmatically: a component may be created in the phase of the first page that needs it (e.g. `KanbanColumn` with Assignments) rather than all upfront — but `AppShell`, `TopBar`, `SearchInput`, `PageHeader`, `StatSummary`, `PrimaryActionButton`, `StripCard` are needed by page 1 and must come first.

---

## 5. Per-page rollout

Each page follows the same loop:
1. Swap `<Navigation/>` + `Container` + `ActionStatisticsBar` for `<AppShell activeNav=… topBar=…>` + `<PageHeader/>`.
2. Rebuild the page's cards/rows onto the Luminous primitives.
3. Wire search/filter into `TopBar` (where the page already had it).
4. (Phase 6 per page) restyle that page's drawer/wizard/modal.
5. Verify against the screenshot + run lint/tests; update §8.

### Phase 1 — Students (`screens/students.jsx`) — simplest, builds the kit
- **Reference:** Students Directory — full-width **rows** (not cards): avatar, name, "No email available", class-group chips, status badge (ACTIVE/INACTIVE), Chat button, Details link.
- Header: title "Students Directory", action "Add New Student", `StatSummary` = Total / Active / Inactive / Avg Assignments (from `statistics`).
- Replace `StudentInfoCard` → `StudentRow` (Luminous). Reuse `student_list_search` logic → drive `TopBar` search ("Search student…").
- Keep `StudentDetailsDrawer`, the add-student `Modal`, and `Chat` mounted; restyle in Phase 6.
- This page first-lands: `AppShell`, `TopBar`, `SearchInput`, `PageHeader`, `StatSummary`, `PrimaryActionButton`.

### Phase 2 — Classes (`screens/class-groups.jsx`)
- **Reference:** Classes — responsive **card grid**. Each `StripCard`: accent strip, "Class N" title, subject `SubjectChip` (mono), `AvatarStack` of members + "+N", "Details ›", `KebabMenu`.
- Header: title "Classes", subtitle "Manage your teaching groups and subjects.", action "Create class group", `StatSummary` = Total Groups / ~Students per Group.
- Replace `ClassGroupCard` → Luminous `StripCard`. First-lands: `StripCard`, `AvatarStack`, `KebabMenu`.
- Keep `ClassDetailsDrawer` + `ClassWizard`; restyle in Phase 6.

### Phase 3 — Resources (`screens/resources.jsx`)
- **Reference:** Resource Library — `FilterBar` + `ViewToggle` (grid/list), file cards (`StripCard`): file-type icon, filename, type label (mono), size + "Updated…" meta, download + trash icons. Header action "Add Resource"; "Show Trash" toggle.
- Wire `TopBar` search to the existing `query` state (already debounced server-side via `loadResources`).
- First-lands: `ViewToggle`, `FilterBar`, `EmptyState`. Note current page hardcodes `#0a0a1a` and uses `react-icons` — switch to `lumi` tokens + `LumiIcon`.
- Keep the upload `Dialog` (file/link tabs) mounted; restyle in Phase 6.

### Phase 4 — Assignments (`screens/assignments.jsx`) — most complex
- **Reference:** Kanban board — coloured column headers (To Mark / Set / Upcoming / Complete), assignment cards with subject chips + "Late" `StatusPill` + Details, per-column empty states; tag-filter row above the board.
- Replace the inline column `Box`es → `KanbanColumn` (accent per column: To-Mark=amber, Set=primary, Upcoming=violet/secondary, Complete=tertiary). Replace `AssignmentCard` → Luminous card.
- Move the existing tag filter (`allTags`/`selectedTags`, AC-TAG4) into `FilterBar`. Header action "Create Assignment"; `StatSummary` = Total Assignments / Files.
- Keep `AssignmentDetailsDrawer`, `AddAssignmentWizard`, `AssignmentFeedbackModal` mounted; restyle in Phase 6.

### Phase 5 — Settings / Profile (`screens/profile.jsx`)
- **Reference:** Teacher's Profile — centered `StripCard` panel: avatar w/ edit badge, "Teacher's Profile" + subtitle, Personal Information (Username disabled, First/Last name, Email), Teaching Subjects as `SubjectChip`s with remove + add-input, full-width "Update Profile" CTA.
- Reuse the existing Formik + yup logic; reskin fields with token styles (replace `styles/input.jsx`, `react-select` → token-styled). `activeNav="settings"`.

---

## 6. Phase 6 — Drawers, wizards & modals (per page, in scope)

After a page's surface is migrated, restyle the overlays it owns, onto `lumi` tokens and the `components/wizard/` kit:

| Page | Overlays to restyle |
|------|---------------------|
| Students | `student_details_drawer.jsx` (28.8 KB), add-student `Modal`, `Chat` |
| Classes | `class_group_details_drawer.jsx`, `class_group_wizard.jsx` |
| Resources | upload `Dialog` (file/link tabs), `dropzone.jsx` |
| Assignments | `assignment_details_drawer.jsx` (22.8 KB), `add_assignment_wizard.jsx`, `assignment_feedback_modal.jsx` |
| Shared | `class_event_wizard.jsx` + `class_event_details_drawer.jsx` (used by dashboard) |

Coordinate with `docs/wizard-redesign-plan.md` — the three creation wizards have a separate redesign track; do the Luminous token pass and the wizard-kit unification together to avoid double work.

---

## 7. Cross-cutting concerns

- **Tokens only.** No new hardcoded hex in migrated files; read from `lumi`/`lumiType`. `tint(hex, alpha)` for translucency.
- **Presentational split.** Keep screens as data/wiring (contexts → transform → props), components as pure UI — mirror `dashboard-luminous.jsx`.
- **Responsiveness.** Sidebar collapses to a mobile top bar < `md` (already in `SideNav`). Verify each page at xs/md/lg. Note repo history of dead MUI v7 `<Grid item>` usage (`docs/wizard-redesign-plan.md` B3) — use `Grid` v7 `size={{…}}` or CSS grid.
- **e2e.** `frontend/tests/e2e/` (Playwright) includes `wizards.spec.js`, `chat-flows.spec.js`, signup specs. Nav/markup changes can break selectors; commit `6bdb837` already fixed wizard reachability across breakpoints. Run `npx playwright test` after each page and fix selectors as needed.
- **Unit tests.** `npm run test` (Vitest). Add a render test per new shared component.
- **Per-page commit.** One page per branch/PR, each green before the next, so the rollout is interruptible and reviewable.

---

## 8. Progress tracker  *(keep this current)*

Legend: ⬜ not started · 🟦 in progress · ✅ done

### Phase 0 — shared foundation
Core set (needed by page 1) is **built, tested, and green** (`npm run build` ✓, `vitest` 68 ✓). Deferred primitives are intentionally left to land with the first page that consumes them (per §4's pragmatic note).

| Item | Status | Notes |
|------|--------|-------|
| `components/luminous/` module + barrel | ✅ | `index.js` barrel; tokens/shared/side_nav moved + `nav.js` added |
| Promote `StatusPill` | ✅ | extracted from `recent_assignments.jsx` → `luminous/StatusPill.jsx` |
| `AppShell` | ✅ | extracted from `luminous_dashboard.jsx`; owns router-nav + logout |
| `TopBar` + `SearchInput` | ✅ | desktop-only TopBar (SideNav owns mobile bar) |
| `PageHeader` + `StatSummary` | ✅ | |
| `PrimaryActionButton` | ✅ | |
| `StripCard` | ✅ | |
| `AvatarStack` | ✅ | built with **Classes** (Phase 2) |
| `KebabMenu` | ✅ | built with **Classes** (Phase 2) |
| `EmptyState` | ✅ | built with **Resources** (Phase 3) |
| `ViewToggle` | ✅ | built with **Resources** (Phase 3) |
| `KanbanColumn` | ✅ | built with **Assignments** (Phase 4) |
| `FilterBar` | ✅ | built with **Resources** (Phase 3); to be reused by Assignments |
| Dashboard re-points to shared module, still green | ✅ | via re-export shims; dashboard unchanged visually |
| Smoke tests for new components | ✅ | `luminous/luminous.test.jsx` (7 tests) |

### Pages
| Page | Surface (Phases 1–5) | Overlays (Phase 6) | Notes |
|------|----------------------|--------------------|-------|
| Dashboard | ✅ shipped (reference) | ⬜ | hero kept; `class_event_*` overlays pending |
| Students | ✅ surface done | ⬜ | `screens/students.jsx` on AppShell; new `student_row.jsx`; TopBar search wired. Visually confirmed by owner. Legacy `student_info_card.jsx` + `student_list_search.jsx` deleted. Drawer + add-student modal still legacy-styled (Phase 6). |
| Classes | 🟦 code-complete | ⬜ | `screens/class-groups.jsx` on AppShell; `class_group_card.jsx` rebuilt on StripCard + AvatarStack + KebabMenu (View/Edit); TopBar search filters by name/subject; build+unit green; **visual review pending**. Drawer + wizard still legacy-styled (Phase 6). |
| Resources | 🟦 code-complete | ⬜ | `screens/resources.jsx` on AppShell; new `resource_card.jsx` (grid + list layouts on StripCard); `EmptyState`/`ViewToggle`/`FilterBar` first-landed; TopBar search → server `q`; type FilterBar + grid/list toggle client-side. Dropped the legacy no-op "Show trash" button (was hardcoded `trashed={false}`). Upload dialog still legacy-styled (Phase 6). build+unit green; **visual review pending**. |
| Assignments | 🟦 code-complete | ⬜ | `screens/assignments.jsx` on AppShell; `assignment_card.jsx` rebuilt on StripCard (tags + due-status pill + progress); `KanbanColumn` first-landed (4 columns: To Mark/amber, Set/primary, Upcoming/violet, Complete/tertiary); tag filter moved into FilterBar; TopBar title search added. Card title kept as `h6` to preserve the edit-flow e2e selector. Drawer + wizard + feedback modal still legacy-styled (Phase 6). build+unit green; **visual review pending**. |
| Settings/Profile | 🟦 code-complete | n/a | `screens/profile.jsx` on AppShell; centered StripCard panel; Formik + yup + avatar upload preserved; fields token-styled; react-select retuned to Luminous (pill multi-values). `TopBar` search made optional → Settings shows no search box (no dead input). Username left editable (kept behaviour; screenshot's "cannot be changed" not adopted). build+unit green; **visual review pending**. No detail drawer/wizard (form-only page). |

**Post-rollout cleanup (pending owner OK):** `components/Dashboard/class_event_dashboard.jsx` (pre-Luminous dashboard, no longer routed) and its only-consumers `main_navigation.jsx` + `action_statistics_bar.jsx` are now fully orphaned and can be deleted.

### Phase 6 — overlays (in progress)
Shared overlay shells built first, then applied per overlay (smallest first).

| Item | Status | Notes |
|------|--------|-------|
| `LumiModal` shell | ✅ | token Dialog: header + close, body, actions footer |
| `LumiDrawer` shell | ✅ | token right Drawer: sticky header/footer, scroll body |
| Shared `fieldSx` | ✅ | promoted from profile; used by modals + forms |
| Students: add-student modal | ✅ | on LumiModal |
| Resources: upload dialog | ✅ | on LumiModal (tabs/fields token-styled) |
| Students: `student_details_drawer` | ⬜ | ~800 lines, deeply custom; needs LumiDrawer + token pass |
| Classes: `class_group_details_drawer` | ✅ | on LumiDrawer; stat/info/subject/student sections token-swapped; Edit in footer |
| Classes: `class_group_wizard` | ⬜ | coordinate with wizard-redesign-plan |
| Assignments: `assignment_details_drawer` | ⬜ | |
| Assignments: `add_assignment_wizard` | ⬜ | coordinate with wizard-redesign-plan |
| Assignments: `assignment_feedback_modal` | ✅ | on LumiModal; submit in footer; fields use shared fieldSx; existing test still green |
| Shared: `class_event_details_drawer` | ✅ | on LumiDrawer; actions in footer; surfaces token-swapped (shell + key surfaces depth) |
| Shared: `class_event_wizard` | ⬜ | used by dashboard; coordinate with wizard-redesign-plan |

---

## 9. Quick-start for a fresh instance

1. Read `DESIGN.md` (repo root) and `frontend/src/components/Dashboard/luminous/tokens.js` — the design language.
2. Read `frontend/src/screens/dashboard-luminous.jsx` + `…/luminous/luminous_dashboard.jsx` — the reference pattern (data wiring vs presentational shell).
3. Check §8 for the next ⬜ item. Foundation (§4) before pages; pages in the §1 order.
4. Reference screenshots: `Downloads/stitch_unified_ui_design_system/{students,classes,resources,assignments,settings}_lessonbase/` — **treat as inconsistent**; §3 wins.
5. One page per PR; lint + unit + e2e green; tick §8.
