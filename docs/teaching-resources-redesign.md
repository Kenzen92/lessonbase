# Teaching Resources — System Redesign Design Document

**Status:** Proposed
**Author:** Design critique + redesign (for handoff to Claude Code)
**Scope:** Full overhaul of the "teaching resources" concept across backend data model, API, file management, and frontend UX.

---

## 0. How to use this document

This is an implementation brief. It has three parts:

1. **Critique** — what exists today and why it's broken (with file references).
2. **Target design** — the data model, API, file-management model, and UX to build.
3. **Implementation plan** — migration strategy, component inventory, and a concrete bug-fix checklist.

Section 6 lists **open decisions** that should be confirmed before implementation starts.

---

## 1. Current state (critique)

"Teaching resources" today is a single Django model, `TeachingResource` (`backend/lessonbase/apps/classes/models.py`), reused — via M2M relations — for four conceptually distinct things:

| Use | Where | Relation |
|-----|-------|----------|
| Teacher's class materials | `ClassEvent.resources` | FK `class_event` (required) |
| Assignment materials (worksheets) | `Assignment.material` | M2M |
| Student submission files | `AssignmentAttempt.submitted_files` | M2M |
| Teacher feedback attachments | `Feedback.submitted_files` | M2M |

### 1.1 Data model problems

- **A required `class_event` FK on a model used in non-class contexts.** `TeachingResource.class_event` is `ForeignKey(..., on_delete=CASCADE)` with no `null=True`, and `subject` is also required. But assignment materials, submissions, and feedback files have no class event. `AssignmentCreateSerializer.create()` does `TeachingResource.objects.create(file=file)` with no `subject`/`class_event` → this cannot satisfy the schema. The model definition and the way it's used are in direct conflict.
- **One model, four ownership/visibility/lifecycle profiles.** Class material (teacher→class), assignment material (teacher→assignees), student submission (student→teacher, private), and feedback file (teacher→one student) have completely different access rules. Folding them into one table makes correct permission checks impossible.
- **Destructive cascade.** `on_delete=CASCADE` on `class_event` means deleting a class event hard-deletes the file row — even if that same row is also referenced as assignment material elsewhere.
- **No uploader/owner.** There is no `uploaded_by`. You cannot build "my resources", cannot authorize edits/deletes, cannot show provenance.
- **No file metadata or soft-delete.** No `mime_type`, `size_bytes`, original filename (the `name` field is nullable), and no soft-delete/restore. Delete is irreversible and identifies files by string match (see below).
- **No reuse.** Every upload is a one-off bound to a single context. A teacher cannot upload a worksheet once and attach it to three classes.

### 1.2 API problems (`backend/lessonbase/apps/.../views.py`, `serialisers.py`)

- **Hardcoded student on submission.** `AssignmentAttemptCreateSerializer.create()` sets `student=Student.objects.last()` — every submission is attributed to whichever student happens to be last in the table. Critical correctness/security bug.
- **Field-name mismatches break uploads end-to-end:**
  - Frontend wizard sends `files`; `AssignmentCreateSerializer` reads `material`. → assignment worksheets never attach.
  - `AssignmentAttemptCreateSerializer.create()` iterates `validated_data.get("files", [])` while the serializer field is `submitted_files`. → submission files never save.
  - `AssignmentAttemptViewSet.post()` maps `data["submitted_files"] = request.FILES.getlist("files")`, but standard DRF routing sends POSTs to `create()`, not this custom `post()`.
- **Overloaded, debug-laden class-material view.** `class_material/` handles both upload and delete in one function with `print()` statements left in. Delete locates the file by **filename string match** (`TeachingResource.objects.filter(file=file_name).first()`) — fragile and collision-prone, with no ownership check (anyone authenticated can delete by guessing a path).
- **Feedback queryset references a non-existent field.** `FeedbackViewSet.get_queryset()` filters `Q(student=user)`, but `Feedback` has no `student` field → runtime error.
- **Inconsistent endpoints.** `/class_material/`, `/assignment_material` (no trailing slash), `/assignment-attempt/`, `/feedback/` — mixed conventions, mixed verbs.
- **Feedback file upload not implemented** (commented out in the modal and serializer).

### 1.3 Frontend problems (`frontend/src/components/...`)

- **One component misused in three contexts.** `Resources/class_resources.jsx` is hardcoded with the title "Class Resources", the empty state "No class resources available", and a POST to `/class_material/` that requires `class_id`. It is dropped verbatim into:
  - the class-event drawer (correct-ish),
  - the **student submission** form,
  - the **teacher feedback modal** (verified live — see screenshot evidence below).
  In the feedback modal this produces a "Class Resources" dropzone in the middle of a grading screen that cannot work.
- **Duplicated heading.** The class drawer renders "Class Resources" twice — once as the card title, once inside the component (verified live).
- **Broken submission upload.** `student_assignment_attempt_form.jsx` does `formData.append(file, file.filename)` — uses the `File` object as the key and `file.filename` (undefined; should be `file.name`) as the value. It also references `Link`, `toast`, and `handleReloadData` without importing/defining them, and shows the wrong empty-state copy ("No class resources available").
- **Unbuilt features.** `Resources/assignment_attempt_files.jsx` and `Resources/assignment_feedback_files.jsx` are empty stubs containing only TODO comments.
- **Literal markdown rendered as text.** The feedback modal prints `**Submitted Text:**` and `**Submitted Files:**` literally (verified live).
- **Rigid dropzone.** `Resources/dropzone.jsx` hardcodes accepted MIME types and has no notion of a dynamic upload target (its own stub comments call this out).
- **No global resource view.** There is no screen for teachers or students to browse/manage resources outside the per-event and per-assignment detail panes.

### 1.4 Live evidence captured

- Class-event drawer: duplicated "Class Resources" header, bare dropzone, "No class resources available." empty state.
- Assignments board: kanban (To Mark / Set / Upcoming / Complete) with a top-right "0 Files" counter; assignment detail shows submissions to grade but **no teacher-materials section**.
- Feedback modal ("Feedback for: Homework 1"): literal `**Submitted Text:**` / `**Submitted Files:**`, a misplaced "Class Resources" dropzone, "No class resources available." + "No files submitted."

---

## 2. Target design — domain model

The central idea: **separate the file (a `Resource` in someone's library) from the act of attaching it to a context (class, assignment, submission, feedback).** A resource is uploaded once and can be attached anywhere the owner has rights.

### 2.1 `Resource` (canonical model — new app `apps/resources`)

```python
class Resource(models.Model):
    class Kind(models.TextChoices):
        FILE = "file", "File"
        LINK = "link", "Link"

    owner          = models.ForeignKey(CustomUser, on_delete=models.CASCADE,
                                       related_name="resources")
    title          = models.CharField(max_length=200)
    description    = models.TextField(max_length=1000, blank=True)
    kind           = models.CharField(max_length=8, choices=Kind.choices,
                                       default=Kind.FILE)

    # file kind
    file           = models.FileField(upload_to="resources/", null=True, blank=True)
    original_name  = models.CharField(max_length=255, blank=True)
    mime_type      = models.CharField(max_length=120, blank=True)
    size_bytes     = models.PositiveBigIntegerField(null=True, blank=True)

    # link kind
    url            = models.URLField(blank=True)

    # organisation (optional, for the library)
    subject        = models.ForeignKey(Subject, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name="resources")
    tags           = models.ManyToManyField("ResourceTag", blank=True,
                                             related_name="resources")

    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)
    deleted_at     = models.DateTimeField(null=True, blank=True)  # soft delete
```

Key points:
- **No `class_event` FK.** A resource is context-free; context comes from attachments (2.2).
- **`owner` drives edit/delete authorization.**
- **Soft delete** via `deleted_at`; a manager excludes soft-deleted rows by default.
- **`Kind`** supports both uploaded files and URL links (the original docstring mentioned links but the model never supported them cleanly).
- `ResourceTag` (`owner`, `name`) gives teachers lightweight organisation. (Folders are an alternative — see open decisions.)

### 2.2 Attachments — explicit join models

Recommended approach is **explicit through-tables**, not a single generic FK, because permissions and queries differ per context and stay far clearer.

```python
class ClassResource(models.Model):          # teacher material shared to a class
    class_event = models.ForeignKey(ClassEvent, on_delete=models.CASCADE,
                                    related_name="resource_links")
    resource    = models.ForeignKey(Resource, on_delete=models.CASCADE,
                                    related_name="class_links")
    added_by    = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ("class_event", "resource")

class AssignmentMaterial(models.Model):      # worksheet attached to an assignment
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE,
                                   related_name="material_links")
    resource   = models.ForeignKey(Resource, on_delete=models.CASCADE,
                                   related_name="assignment_links")
    class Meta:
        unique_together = ("assignment", "resource")
```

Note `on_delete=CASCADE` here deletes only the **link**, never the underlying `Resource`. Deleting a class event detaches its resources; the files survive in the owner's library.

### 2.3 Submissions & feedback (replace the broken attempt model)

Rename/replace `AssignmentAttempt` → `Submission`, and attach files via the same `Resource` library (a student's submission file is just a resource the student owns).

```python
class Submission(models.Model):
    class Status(models.TextChoices):
        DRAFT     = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        GRADED    = "graded", "Graded"
        RETURNED  = "returned", "Returned for revision"

    assignment   = models.ForeignKey(Assignment, on_delete=models.CASCADE,
                                     related_name="submissions")
    student      = models.ForeignKey(Student, on_delete=models.CASCADE,
                                     related_name="submissions")
    answer_text  = models.TextField(blank=True)
    files        = models.ManyToManyField(Resource, blank=True,
                                          related_name="submission_links")
    status       = models.CharField(max_length=12, choices=Status.choices,
                                     default=Status.DRAFT)
    submitted_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        unique_together = ("assignment", "student")

class Feedback(models.Model):
    submission = models.OneToOneField(Submission, on_delete=models.CASCADE,
                                      related_name="feedback")
    teacher    = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    text       = models.TextField(max_length=2000, blank=True)
    score      = models.PositiveSmallIntegerField(null=True, blank=True)
    accepted   = models.BooleanField(default=False)
    files      = models.ManyToManyField(Resource, blank=True,
                                        related_name="feedback_links")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

`student` comes from the **authenticated request user**, never `Student.objects.last()`. Score is computed/validated against `assignment.max_score`.

### 2.4 Visibility rules (single source of truth)

Implement one permission helper, e.g. `Resource.visible_to(user)`, derived from attachments:

| Resource attached as | Visible to |
|----------------------|-----------|
| Class material (`ClassResource`) | The class's teachers + enrolled students |
| Assignment material (`AssignmentMaterial`) | The assignment's teachers + assigned students |
| Submission file | The submitting student + the assignment's teachers |
| Feedback file | The target student + the assignment's teachers |
| Unattached (library only) | Owner only |

Edit/delete of the `Resource` itself is always **owner-only**; detaching from a context requires rights on that context (teacher for class/assignment, student for own submission).

---

## 3. Target design — API

A unified, RESTful surface. All routes authenticated; all writes ownership-checked.

### 3.1 Resource library

```
GET    /api/resources/                 # current user's library; filters: ?subject=&kind=&tag=&q=&page=
POST   /api/resources/                 # upload file OR create link (multipart or json)
GET    /api/resources/{id}/
PATCH  /api/resources/{id}/            # title/description/subject/tags (owner only)
DELETE /api/resources/{id}/            # soft delete (owner only)
GET    /api/resources/{id}/usage/      # where it's attached (classes, assignments, …)
GET    /api/resources/shared/          # read-only: everything shared *with* me
```

### 3.2 Attaching to contexts

```
# Class materials
GET    /api/class-events/{id}/resources/
POST   /api/class-events/{id}/resources/      # body: {resource_id} OR multipart file (upload+attach)
DELETE /api/class-events/{id}/resources/{resource_id}/

# Assignment materials
GET    /api/assignments/{id}/materials/
POST   /api/assignments/{id}/materials/        # {resource_id} or file
DELETE /api/assignments/{id}/materials/{resource_id}/

# Student submissions
GET    /api/assignments/{id}/submissions/                 # teacher: all; student: own
POST   /api/assignments/{id}/submissions/                 # student; answer_text + files[]/resource_ids[]
PATCH  /api/submissions/{id}/                             # update draft (owner student)

# Feedback
GET    /api/submissions/{id}/feedback/
PUT    /api/submissions/{id}/feedback/                    # teacher; text, score, accepted, files[]/resource_ids[]
```

Design rules:
- **One `ResourceSerializer`** for read (nested: id, title, kind, url/file URL, mime, size, owner, created_at). Writes accept either an uploaded file (multipart) or an existing `resource_id`.
- **Consistent trailing slashes** everywhere.
- **POST that uploads also creates the `Resource`** owned by the request user, then attaches — so the "upload new" and "pick from library" paths converge server-side.
- **Server-side validation** of size and MIME type (don't trust the dropzone). Reuse the 50 MB limit and the existing accepted-type list, centralised.
- **Delete by id, with ownership check** — never by filename string match.

---

## 4. Target design — file management UX

### 4.1 Resource Library (the missing global view) — `/resources`

The primary new screen. For **teachers**:
- Searchable, filterable grid/list (filter by subject, kind, tag, date; free-text search on title/description).
- Upload-once / reuse-many: drag-drop or "Add link"; uploaded resources land here and can be attached to any class or assignment without re-uploading.
- Per-resource: thumbnail/type icon, title, subject chip, tags, "used in N places" with a usage popover, and row actions (rename, edit, delete, download).
- Bulk select → delete / tag / change subject.
- Trash view for soft-deleted items with restore (respects the soft-delete model).

For **students** — a read-only "My Resources" / "Shared with me":
- Everything shared with them (class + assignment materials) plus their own submissions, grouped/filterable by subject and class, with download/open.

### 4.2 Reusable `<ResourcePicker>` component

A single component replacing the misused `ClassResources`. Props: `context={type, id}`, `mode` (`teacher`/`student`), `value`, `onChange`.

- Two tabs: **Upload new** (dropzone) and **Choose from library** (searchable list of the user's resources).
- Context-aware: posts to the right endpoint from `context`; no hardcoded titles or copy.
- Used in: class-event drawer, assignment wizard (materials step), student submission form, teacher feedback modal.

### 4.3 Context surfaces (cleaned up)

- **Class-event drawer:** single "Class Resources" heading; list of attached resources as cards with open/download and (teacher) detach; `<ResourcePicker context={class-event}>` for teachers only.
- **Assignment detail:** add a **"Materials"** section (worksheets) that's currently missing from the UI; teacher uses `<ResourcePicker context={assignment}>`. Students see materials read-only.
- **Student submission form:** answer text + `<ResourcePicker context={submission} mode=student>`; correct empty-state copy ("No files attached yet"); fix the broken `formData` upload.
- **Feedback modal:** render submission text as text (strip the literal `**`), list the student's submitted files (download/open, no delete), and give the teacher a `<ResourcePicker context={feedback}>` for marked-up files. Implement the two stub components (`assignment_attempt_files`, `assignment_feedback_files`) here or fold them into the picker.

---

## 5. Implementation plan

### 5.1 Migration strategy

1. Create `apps/resources` with `Resource`, `ResourceTag`, and join models; create `Submission`/`Feedback` (new) alongside the existing models.
2. **Data migration** from `TeachingResource`:
   - For each row, create a `Resource` (`owner` = the relevant teacher for class/assignment material; the student for submission files; the teacher for feedback files), copying `file`, `name`→`title`, `subject`.
   - Recreate context links: `class_event` rows → `ClassResource`; `Assignment.material` → `AssignmentMaterial`; `AssignmentAttempt.submitted_files` → `Submission.files`; `Feedback.submitted_files` → `Feedback.files`.
   - Backfill `original_name`, `mime_type`, `size_bytes` where derivable.
3. Cut the API and frontend over to the new endpoints/components.
4. Keep `TeachingResource` read-only for one release as a safety net, then drop it in a follow-up migration.

Files already serve from R2/CDN (per recent commits), so storage location is unchanged — only the DB schema and relations change.

### 5.2 Bug-fix checklist (must be resolved by this work)

- [ ] Remove hardcoded `student=Student.objects.last()`; derive student from the authenticated user.
- [ ] Fix submission file key mismatch (`files` vs `submitted_files`) so files actually persist.
- [ ] Fix assignment-material key mismatch (wizard sends `files`; serializer reads `material`).
- [ ] `student_assignment_attempt_form.jsx`: fix `formData.append(file, file.filename)`; add missing imports (`Link`, `toast`) and `handleReloadData`; fix empty-state copy.
- [ ] Remove duplicated "Class Resources" heading in the class drawer.
- [ ] Render submission text/headings as text — remove literal `**markdown**` in the feedback modal.
- [ ] Replace filename-string-match delete with id-based, ownership-checked delete.
- [ ] Fix `FeedbackViewSet.get_queryset()` referencing a non-existent `student` field.
- [ ] Remove leftover `print()` debugging in resource views.
- [ ] Implement the two empty stub components (or replace via `<ResourcePicker>`).
- [ ] Centralise + enforce size/MIME validation server-side.
- [ ] Normalise endpoint conventions (trailing slashes, verbs).

### 5.3 Suggested build order

1. Backend: `Resource` + tags + library API + tests.
2. Backend: join models + class/assignment material endpoints + data migration.
3. Backend: `Submission`/`Feedback` rebuild + submission/feedback endpoints (fix the critical student bug here).
4. Frontend: `<ResourcePicker>` + dynamic dropzone; swap into the four contexts.
5. Frontend: Resource Library screen (teacher, then student read-only view).
6. Cleanup: delete `TeachingResource` and dead components; add nav entry for `/resources`.

---

## 6. Open decisions (confirm before building)

1. **Organisation model for the library:** tags (flexible, recommended) vs folders (familiar) vs both. This doc assumes **tags**.
2. **Explicit join tables (recommended) vs a generic content-type attachment.** This doc assumes **explicit joins** for clearer permissions/queries; a generic `GenericForeignKey` is the alternative if you expect many more attachment contexts later.
3. **Rename `AssignmentAttempt` → `Submission`?** Recommended for clarity, but it touches more code. Could keep the name and just fix it in place.
4. **Links as resources** (the `Kind.LINK` path) — build now or defer? Cheap to include given the model supports it.
5. **Student-owned library** — give students a full personal library, or only a read-only "shared with me" + their submissions? This doc assumes read-only for students initially.
6. **Versioning of resubmissions** — keep submission history/versions, or overwrite? Current model is one submission per (assignment, student); confirm whether revisions should be retained.
