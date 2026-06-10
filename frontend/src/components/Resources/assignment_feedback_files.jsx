import ResourceFileList from "./resource_file_list";

/**
 * Read-only list of files attached by the teacher to their feedback.
 * Used in the student view of a returned assignment.
 */
const AssignmentFeedbackFiles = ({ files = [] }) => (
  <ResourceFileList files={files} emptyMessage="No feedback files attached." accent="tertiary" />
);

export default AssignmentFeedbackFiles;
