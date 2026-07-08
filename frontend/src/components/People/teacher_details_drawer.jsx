import { useMemo } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { createChat } from "../../utils/agent";
import ClassGroupChip from "../ClassGroups/class_group_chip";
import { resolveMediaUrl } from "../../utils/media";
import {
  LumiDrawer,
  PrimaryActionButton,
  DrawerSection,
  DrawerInfoRow,
  DrawerEmptyText,
  SubjectChip,
  lumi,
  tint,
} from "../luminous";

/**
 * Read-only teacher profile for the student's Teachers directory: contact
 * details, subjects, and the class groups the student shares with them. The
 * headline action is opening (or creating) a chat.
 */
export default function TeacherDetailsDrawer({
  teacher,
  open,
  onClose,
  chats,
  chatsLoaded,
  onOpenChat,
  sharedGroups = [],
}) {
  const navigate = useNavigate();

  const existingChatId = useMemo(() => {
    if (!teacher) return null;
    const chat = (chats || []).find((c) => c.participants.includes(teacher.id));
    return chat ? chat.id : null;
  }, [teacher, chats]);

  const handleChatAction = async () => {
    try {
      if (existingChatId) {
        onOpenChat(existingChatId);
        return;
      }
      if (!teacher?.id) throw new Error("Teacher details not available to create chat.");
      const data = await createChat(teacher.id, navigate);
      if (!data?.id) throw new Error("Failed to create chat");
      onOpenChat(data.id);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const chatLabel = existingChatId ? "Open Chat" : chatsLoaded ? "Create Chat" : "Loading Chat...";
  const name = teacher
    ? `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.username
    : undefined;

  return (
    <LumiDrawer
      open={open}
      onClose={onClose}
      title={name}
      subtitle={teacher?.email || undefined}
      leading={
        teacher ? (
          <Avatar
            src={resolveMediaUrl(teacher.profile_picture) || undefined}
            alt={name}
            sx={{ width: 44, height: 44, border: `2px solid ${tint(lumi.color.primary, 0.4)}`, bgcolor: lumi.color.surfaceVariant }}
          >
            {name ? name[0].toUpperCase() : "?"}
          </Avatar>
        ) : undefined
      }
      footer={
        teacher ? (
          <PrimaryActionButton
            data-testid="teacher-drawer-chat-action"
            icon="chat"
            label={chatLabel}
            disabled={!existingChatId && !chatsLoaded}
            onClick={handleChatAction}
            sx={{ flex: 1 }}
          />
        ) : null
      }
    >
      {teacher ? (
        <>
          <DrawerSection icon="person" title="Contact">
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <DrawerInfoRow label="Email">{teacher.email || "—"}</DrawerInfoRow>
            </Box>
          </DrawerSection>

          <DrawerSection icon="school" title="Subjects">
            {teacher.subjects?.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {teacher.subjects.map((subject) => (
                  <SubjectChip key={subject.id} label={subject.name} accent="primary" />
                ))}
              </Box>
            ) : (
              <DrawerEmptyText>No subjects listed</DrawerEmptyText>
            )}
          </DrawerSection>

          <DrawerSection icon="group" title="Your Classes Together">
            {sharedGroups.length > 0 ? (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {sharedGroups.map((group) => (
                  <ClassGroupChip key={group.id} classGroup={group} />
                ))}
              </Box>
            ) : (
              <DrawerEmptyText>No shared class groups</DrawerEmptyText>
            )}
          </DrawerSection>
        </>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Typography sx={{ color: lumi.color.onSurfaceVariant, textAlign: "center" }}>
            No teacher selected
          </Typography>
        </Box>
      )}
    </LumiDrawer>
  );
}
