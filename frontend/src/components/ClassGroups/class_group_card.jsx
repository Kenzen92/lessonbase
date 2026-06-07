import { Box, Typography, Button } from "@mui/material";

import {
  lumi,
  lumiType,
  tint,
  LumiIcon,
  SubjectChip,
  StripCard,
  AvatarStack,
  KebabMenu,
} from "../luminous";

/**
 * Luminous class-group card: a StripCard with the group's colour as the top
 * strip, subject chips, a member AvatarStack, and a Details action. Keeps the
 * legacy `data` / `onClick` props so the screen wiring is unchanged; an
 * optional `menuItems` array drives the overflow kebab.
 */
const ClassGroupCard = ({ data, onClick, menuItems = [] }) => {
  const accentHex = data.color || data.subjects?.[0]?.color || lumi.color.primary;

  return (
    <StripCard accentHex={accentHex} onClick={onClick} sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, height: "100%" }}>
        {/* Title + overflow menu */}
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
          <Typography
            component="h3"
            noWrap
            sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, minWidth: 0 }}
          >
            {data.name}
          </Typography>
          <Box sx={{ mt: -0.5, mr: -1 }}>
            <KebabMenu items={menuItems} ariaLabel={`Actions for ${data.name}`} />
          </Box>
        </Box>

        {/* Subjects */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {(data.subjects || []).map((subject) => (
            <SubjectChip key={subject.name} label={subject.name} color={subject.color} />
          ))}
        </Box>

        {/* Footer: members + details */}
        <Box
          sx={{
            mt: "auto",
            pt: 2,
            borderTop: `1px solid ${tint(lumi.color.outlineVariant, 0.5)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <AvatarStack people={data.students || []} max={4} />
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
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
    </StripCard>
  );
};

export default ClassGroupCard;
