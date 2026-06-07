import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Chip,
  Button,
  Checkbox,
  Avatar,
  Stack,
} from "@mui/material";

// Small debounce so filtering doesn't run on every keystroke.
function useDebounced(value, delay = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const matchesQuery = (student, q) => {
  if (!q) return true;
  const haystack = [
    student.first_name,
    student.last_name,
    student.username,
    student.email,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
};

/**
 * One shared student picker for every wizard. A single scroll region (the modal
 * body) holds a sticky top bar — search, filter chips, the "N of M shown
 * selected" line with Select-all-shown / Clear-shown, and a rail of selected
 * chips — above a flat, flowing list of rows. Filtering (chips + search) and
 * selection are kept strictly separate: toggling a filter never changes the
 * selection set.
 *
 * Props match the legacy StudentSearch so it is a drop-in replacement:
 *   students          — [{ id, first_name, last_name, username, email, avatar, class_groups }]
 *   classGroups       — [{ id, name }] used as filter chips
 *   selectedStudents  — array of selected student ids
 *   setSelectedStudents(ids)
 */
const StudentPicker = ({
  students = [],
  classGroups = [],
  selectedStudents = [],
  setSelectedStudents,
}) => {
  const [search, setSearch] = useState("");
  const query = useDebounced(search).trim().toLowerCase();
  const [groupFilters, setGroupFilters] = useState([]); // selected group ids

  const toggleGroupFilter = (id) =>
    setGroupFilters((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const selectedSet = useMemo(
    () => new Set(selectedStudents),
    [selectedStudents]
  );
  const byId = useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );

  // The currently visible ("shown") set = search AND group filter.
  const shown = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch = matchesQuery(student, query);
        const matchesGroup =
          groupFilters.length === 0 ||
          (student.class_groups || []).some((g) => groupFilters.includes(g.id));
        return matchesSearch && matchesGroup;
      }),
    [students, query, groupFilters]
  );

  const shownSelectedCount = shown.reduce(
    (n, s) => (selectedSet.has(s.id) ? n + 1 : n),
    0
  );
  const allShownSelected = shown.length > 0 && shownSelectedCount === shown.length;

  const toggleStudent = (id) =>
    setSelectedStudents(
      selectedSet.has(id)
        ? selectedStudents.filter((x) => x !== id)
        : [...selectedStudents, id]
    );

  // Bulk actions operate only on the shown rows; selections outside the current
  // filter are preserved (AC-SP4).
  const selectAllShown = () => {
    const additions = shown
      .map((s) => s.id)
      .filter((id) => !selectedSet.has(id));
    if (additions.length) setSelectedStudents([...selectedStudents, ...additions]);
  };
  const clearShown = () => {
    const shownIds = new Set(shown.map((s) => s.id));
    setSelectedStudents(selectedStudents.filter((id) => !shownIds.has(id)));
  };

  const MAX_RAIL_CHIPS = 12;
  const selectedChips = selectedStudents.slice(0, MAX_RAIL_CHIPS);
  const overflow = selectedStudents.length - selectedChips.length;

  const labelFor = (student) =>
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    student?.username ||
    `#${student?.id}`;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Sticky top bar — search, filters, summary, selected rail. Sticks to the
          top of the modal body's scroll so the user always sees who's selected. */}
      <Box
        sx={(theme) => ({
          position: "sticky",
          // Pin 1px above the top so sub-pixel rounding can't leave a hairline
          // gap where rows peek through; the extra 1px is absorbed by pt below.
          top: "-1px",
          zIndex: 2,
          backgroundColor: theme.palette.surface.modal,
          pt: "calc(8px + 1px)",
          pb: 1.5,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          // Soft shadow so list rows read as scrolling cleanly *under* the bar
          // rather than clipping against its edge.
          boxShadow: "0 6px 8px -6px rgba(0, 0, 0, 0.5)",
        })}
      >
        <TextField
          label="Search by name, username, or email"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          size="small"
        />

        {classGroups.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {classGroups.map((group) => {
              const active = groupFilters.includes(group.id);
              return (
                <Chip
                  key={group.id}
                  label={group.name}
                  clickable
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  onClick={() => toggleGroupFilter(group.id)}
                  sx={{ minHeight: 32 }}
                />
              );
            })}
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body2" sx={{ color: "text.secondary", flex: 1 }}>
            {shownSelectedCount} of {shown.length} shown selected
            {selectedStudents.length > shownSelectedCount &&
              ` · ${selectedStudents.length} total`}
          </Typography>
          <Button
            size="small"
            onClick={selectAllShown}
            disabled={shown.length === 0 || allShownSelected}
          >
            Select all shown
          </Button>
          <Button
            size="small"
            color="inherit"
            onClick={clearShown}
            disabled={shownSelectedCount === 0}
          >
            Clear shown
          </Button>
        </Box>

        {selectedStudents.length > 0 && (
          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {selectedChips.map((id) => (
              <Chip
                key={id}
                size="small"
                label={labelFor(byId.get(id))}
                onDelete={() => toggleStudent(id)}
              />
            ))}
            {overflow > 0 && (
              <Chip size="small" label={`+${overflow} more`} variant="outlined" />
            )}
          </Box>
        )}
      </Box>

      {/* Flat list — flows in the modal body's scroll; no nested scrollbar. */}
      {shown.length > 0 ? (
        <Box role="list">
          {shown.map((student) => {
            const isSelected = selectedSet.has(student.id);
            return (
              <Box
                key={student.id}
                role="listitem"
                onClick={() => toggleStudent(student.id)}
                sx={(theme) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minHeight: 56,
                  px: 1,
                  borderRadius: 1,
                  cursor: "pointer",
                  transition: theme.transitions.create("background-color"),
                  backgroundColor: isSelected
                    ? `${theme.palette.primary.main}1f` // ~12% alpha fill
                    : "transparent",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? `${theme.palette.primary.main}29`
                      : theme.palette.action.hover,
                  },
                })}
              >
                <Checkbox
                  checked={isSelected}
                  tabIndex={-1}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggleStudent(student.id)}
                  inputProps={{ "aria-label": labelFor(student) }}
                />
                <Avatar
                  src={student.avatar}
                  alt={labelFor(student)}
                  sx={{ width: 36, height: 36 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 500 }} noWrap>
                    {labelFor(student)}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary" }}
                    noWrap
                  >
                    {student.username}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{ flexWrap: "wrap", justifyContent: "flex-end", gap: 0.5 }}
                >
                  {(student.class_groups || []).slice(0, 2).map((group) => (
                    <Chip key={group.id} label={group.name} size="small" />
                  ))}
                  {(student.class_groups || []).length > 2 && (
                    <Chip
                      label={`+${student.class_groups.length - 2}`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <Typography variant="subtitle1">No students found</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Try adjusting your search or filters.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StudentPicker;
