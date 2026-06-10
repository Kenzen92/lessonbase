import ResourceFileList from "./resource_file_list";

/**
 * Read-only list of files a student submitted with their assignment attempt.
 * Used in the teacher grading modal to display what was submitted.
 */
const AssignmentAttemptFiles = ({ files = [] }) => (
  <ResourceFileList files={files} emptyMessage="No files submitted." accent="primary" />
);

export default AssignmentAttemptFiles;
