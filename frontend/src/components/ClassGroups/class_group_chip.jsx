import { Chip } from "@mui/material";
import { FaUserFriends } from "react-icons/fa";
import { Link } from "react-router-dom";

const ClassGroupChip = ({ classGroup }) => {
  // <-- Destructure classGroup from the props object
  return (
    <Link to={`/class-groups/${classGroup.id}`}>
      <Chip
        icon={<FaUserFriends style={{ color: "#fff" }} size={14} />}
        label={classGroup.name} // <-- Now classGroup correctly refers to { id: ..., name: ... }
        size="small"
        sx={{
          // ...chipLabelTruncateStyles, // Assuming this is defined elsewhere
          color: "#fff",
          backgroundColor: "#0c2406",
          m: 0.5,
        }}
      />
    </Link>
  );
};

export default ClassGroupChip;
