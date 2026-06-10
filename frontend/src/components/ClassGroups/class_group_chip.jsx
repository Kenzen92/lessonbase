import { Box } from "@mui/material";
import { Link } from "react-router-dom";

import { LumiIcon, brightenForDark, lumi, tint } from "../luminous";

/**
 * Linked class-group pill: the group's own hue as a Luminous tinted chip
 * (matching SubjectChip), with a leading group icon. Clicking navigates to
 * the class group's page.
 */
const ClassGroupChip = ({ classGroup }) => {
  const base = classGroup.color || lumi.color.primary;
  const text = brightenForDark(base);

  return (
    <Link to={`/class-groups/${classGroup.id}`} style={{ textDecoration: "none" }}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.5,
          py: 0.5,
          borderRadius: lumi.radius.pill,
          fontSize: 12,
          fontWeight: 600,
          fontFamily: lumi.font.body,
          backgroundColor: tint(base, 0.22),
          color: text,
          border: `1px solid ${tint(text, 0.35)}`,
          whiteSpace: "nowrap",
          transition: "background-color .2s",
          "&:hover": { backgroundColor: tint(base, 0.35) },
        }}
      >
        <LumiIcon name="group" sx={{ fontSize: 14 }} />
        {classGroup.name}
      </Box>
    </Link>
  );
};

export default ClassGroupChip;
