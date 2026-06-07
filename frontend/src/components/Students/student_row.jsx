import { useMemo } from "react";
import { Box, Typography, Avatar, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { lumi, lumiType, tint, LumiIcon } from "../luminous";
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
 * Luminous student row — a full-width list item (avatar, name, email, class-
 * group chips, status, Chat + Details). Drop-in replacement for the legacy
 * `StudentInfoCard`: same handler props so the screen wiring is unchanged.
 */
export default function StudentRow({
  student,
  setCurrentStudent,
  setDrawerOpen,
  setChatOpen,
  setChatId,
  chats = [],
}) {
  const active = student.status === "active";
  const chatId = useMemo(() => {
    const chat = chats.find((c) => c.participants.includes(student.id));
    return chat ? chat.id : null;
  }, [chats, student.id]);

  const openDetails = () => {
    setCurrentStudent(student);
    setDrawerOpen(true);
  };

  return (
    <Box
      onClick={openDetails}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        px: 2.5,
        py: 2,
        cursor: "pointer",
        borderRadius: lumi.radius.card,
        backgroundColor: lumi.color.surfaceContainer,
        border: `1px solid ${lumi.color.hairline}`,
        transition: "background-color .15s ease, border-color .15s ease",
        "&:hover": { backgroundColor: lumi.color.surfaceContainerHigh, borderColor: tint(lumi.color.primary, 0.4) },
      }}
    >
      {/* Identity */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 2, minWidth: 0 }}>
        <Avatar
          src={resolveMediaUrl(student.profile_picture) || undefined}
          alt={student.first_name}
          sx={{ width: 44, height: 44, bgcolor: lumi.color.surfaceVariant, color: lumi.color.onSurface }}
        >
          {student.first_name ? student.first_name[0].toUpperCase() : "?"}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...lumiType.bodyMd, fontWeight: 700, color: lumi.color.onSurface }} noWrap>
            {student.first_name} {student.last_name}
          </Typography>
          <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant }} noWrap>
            {student.email || "No email available"}
          </Typography>
        </Box>
      </Box>

      {/* Class groups */}
      <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.75, flexWrap: "wrap", justifyContent: "flex-end", flex: 2 }}>
        {(student.class_groups || []).map((group) => (
          <GroupChip key={group.id} group={group} />
        ))}
      </Box>

      {/* Status + actions */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1.5 }}>
        <StatusBadge active={active} />

        <Button
          data-testid={`student-chat-button-${student.id}`}
          startIcon={<LumiIcon name="chat" sx={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.stopPropagation();
            setCurrentStudent(student);
            if (chatId) {
              setChatId(chatId);
              setChatOpen(true);
              return;
            }
            setDrawerOpen(true);
          }}
          sx={{
            ...lumiType.buttonText,
            px: 1.5,
            height: 36,
            borderRadius: lumi.radius.md,
            backgroundColor: lumi.color.primaryContainer,
            color: lumi.color.onSurface,
            "&:hover": { backgroundColor: lumi.color.primaryContainer, filter: "brightness(0.9)" },
          }}
        >
          Chat
        </Button>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            openDetails();
          }}
          endIcon={<LumiIcon name="chevron_right" sx={{ fontSize: 18 }} />}
          sx={{
            ...lumiType.buttonText,
            color: lumi.color.primary,
            minWidth: 0,
            px: 1,
            "&:hover": { backgroundColor: tint(lumi.color.primary, 0.08) },
          }}
        >
          Details
        </Button>
      </Box>
    </Box>
  );
}
