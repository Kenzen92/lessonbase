import { Chip } from "@mui/material";
import { FaUserFriends } from "react-icons/fa";
import { Link } from "react-router-dom";

const ClassGroupChip = ({ classGroup }) => {
  const baseColor = classGroup.color || "#1976D2";

  // Create a lighter version for hover state
  const lightenColor = (color, percent) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  return (
    <Link
      to={`/class-groups/${classGroup.id}`}
      style={{ textDecoration: "none" }}
    >
      <Chip
        icon={<FaUserFriends style={{ color: "#fff" }} size={14} />}
        label={classGroup.name}
        size="small"
        sx={{
          color: "#fff",
          backgroundColor: baseColor,
          border: `1px solid ${lightenColor(baseColor, 20)}`,
          m: 0.5,
          fontWeight: 500,
          fontSize: "0.8125rem",
          transition: "all 0.2s ease-in-out",
          boxShadow: `0 2px 4px ${baseColor}40`,
          "&:hover": {
            backgroundColor: lightenColor(baseColor, 15),
            transform: "translateY(-1px)",
            boxShadow: `0 4px 8px ${baseColor}60`,
            borderColor: lightenColor(baseColor, 30),
          },
          "& .MuiChip-icon": {
            color: "#fff",
            marginLeft: "8px",
          },
        }}
      />
    </Link>
  );
};

export default ClassGroupChip;
