import { useMemo } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { lumi, lumiType, tint, LumiIcon } from "../luminous";
import PersonRow from "../People/person_row";
import { resolveMediaUrl } from "../../utils/media";

// Small group chip tinted by the class-group's own colour, linking to the
// group. Mirrors the design's pill chips while staying on Luminous tokens.
function GroupChip({ group }) {
  const navigate = useNavigate();
  const color = group.color || lumi.color.primary;
  return (
    <Box
      component="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/class-groups/${group.id}`);
      }}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1.25,
        py: 0.5,
        border: "none",
        cursor: "pointer",
        borderRadius: lumi.radius.pill,
        backgroundColor: tint(color, 0.15),
        color,
        ...lumiType.labelMd,
        whiteSpace: "nowrap",
        "&:hover": { backgroundColor: tint(color, 0.25) },
      }}
    >
      <LumiIcon name="group" sx={{ fontSize: 14 }} />
      {group.name}
    </Box>
  );
}

function StatusBadge({ active }) {
  const color = active ? lumi.color.tertiary : lumi.color.onSurfaceVariant;
  return (
    <Box
      component="span"
      sx={{
        px: 1.25,
        py: 0.5,
        borderRadius: lumi.radius.pill,
        ...lumiType.labelMd,
        textTransform: "uppercase",
        backgroundColor: active ? tint(lumi.color.tertiary, 0.15) : tint(lumi.color.outline, 0.15),
        color,
        whiteSpace: "nowrap",
      }}
    >
      {active ? "Active" : "Inactive"}
    </Box>
  );
}

/**
 * Student directory row for the teacher's Students page — `PersonRow` with
 * class-group chips and an active/inactive badge. Same handler props as the
 * legacy `StudentInfoCard`, so the screen wiring is unchanged.
 */
export default function StudentRow({
  student,
  setCurrentStudent,
  setDrawerOpen,
  setChatOpen,
  setChatId,
  chats = [],
}) {
  const chatId = useMemo(() => {
    const chat = chats.find((c) => c.participants.includes(student.id));
    return chat ? chat.id : null;
  }, [chats, student.id]);

  const openDetails = () => {
    setCurrentStudent(student);
    setDrawerOpen(true);
  };

  return (
    <PersonRow
      avatarUrl={resolveMediaUrl(student.profile_picture)}
      name={`${student.first_name || ""} ${student.last_name || ""}`.trim() || student.username}
      subtitle={student.email || "No email available"}
      chatTestId={`student-chat-button-${student.id}`}
      middle={(student.class_groups || []).map((group) => (
        <GroupChip key={group.id} group={group} />
      ))}
      status={<StatusBadge active={student.status === "active"} />}
      onDetails={openDetails}
      onChat={() => {
        setCurrentStudent(student);
        if (chatId) {
          setChatId(chatId);
          setChatOpen(true);
          return;
        }
        // No chat yet — the details drawer owns chat creation.
        setDrawerOpen(true);
      }}
    />
  );
}
