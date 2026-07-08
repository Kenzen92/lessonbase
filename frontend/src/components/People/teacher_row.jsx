import { SubjectChip } from "../luminous";
import PersonRow from "./person_row";
import { resolveMediaUrl } from "../../utils/media";

/**
 * Teacher directory row for the student's Teachers page — `PersonRow` with
 * the teacher's subjects as chips. Chat / details wiring is owned by the
 * screen so it can reuse the shared chats list.
 */
export default function TeacherRow({ teacher, onChat, onDetails }) {
  const name =
    `${teacher.first_name || ""} ${teacher.last_name || ""}`.trim() || teacher.username;

  return (
    <PersonRow
      avatarUrl={resolveMediaUrl(teacher.profile_picture)}
      name={name}
      subtitle={teacher.email || "No email available"}
      chatTestId={`teacher-chat-button-${teacher.id}`}
      middle={(teacher.subjects || []).map((subject) => (
        <SubjectChip key={subject.id} label={subject.name} accent="primary" />
      ))}
      onDetails={onDetails}
      onChat={onChat}
    />
  );
}
