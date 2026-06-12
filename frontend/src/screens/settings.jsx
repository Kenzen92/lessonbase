// Settings — account-level preferences, split out from the Profile page
// (which now only holds personal information). Sections here are shared by
// teachers and students; role-specific settings get their own sections as
// they arrive.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Box, Typography, Switch, CircularProgress } from "@mui/material";

import { AppShell, StripCard, lumi, lumiType } from "../components/luminous";
import { useUser } from "../contexts/user_context";
import { resolveMediaUrl } from "../utils/media";
import { fetchMarketingPreferences, updateMarketingPreferences } from "../utils/agent";

const EMAIL_PREFS = [
  {
    key: "product_updates",
    label: "Product updates",
    description: "New features and improvements to Lessonbase.",
  },
  {
    key: "tips_and_tutorials",
    label: "Tips & tutorials",
    description: "Occasional emails to help you get more out of the platform.",
  },
  {
    key: "promotions",
    label: "Promotions & offers",
    description: "Discounts and special offers from Lessonbase.",
  },
];

function PreferenceRow({ pref, checked, onChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 1.5,
        borderBottom: `1px solid ${lumi.color.outlineVariant}`,
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box>
        <Typography sx={{ ...lumiType.bodyMd, fontWeight: 600, color: lumi.color.onSurface }}>
          {pref.label}
        </Typography>
        <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant }}>
          {pref.description}
        </Typography>
      </Box>
      <Switch
        checked={checked}
        onChange={(e) => onChange(pref.key, e.target.checked)}
        slotProps={{ input: { "aria-label": pref.label } }}
      />
    </Box>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { firstName, profilePicture } = useUser();

  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMarketingPreferences(navigate);
        if (!cancelled) setPrefs(data);
      } catch {
        if (!cancelled) toast.error("Could not load your email preferences.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Save on toggle: flip optimistically, revert if the PATCH fails.
  const handleToggle = async (key, value) => {
    const previous = prefs;
    setPrefs({ ...prefs, [key]: value });
    const result = await updateMarketingPreferences({ [key]: value }, navigate);
    if (result.ok) {
      setPrefs(result.data);
    } else {
      setPrefs(previous);
      toast.error(result.error || "Could not save your preference.");
    }
  };

  return (
    <AppShell
      activeNav="settings"
      user={{ userName: firstName, avatarUrl: resolveMediaUrl(profilePicture) }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        <StripCard accent="primary" hover={false}>
          <Typography component="h1" sx={{ ...lumiType.headlineLg, color: lumi.color.onBackground }}>
            Settings
          </Typography>
          <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, mt: 0.5 }}>
            Manage how Lessonbase works for you.
          </Typography>

          <Typography sx={{ ...lumiType.headlineMd, color: lumi.color.onBackground, mt: 4, mb: 1 }}>
            Email preferences
          </Typography>
          <Typography sx={{ ...lumiType.labelMd, color: lumi.color.onSurfaceVariant, mb: 1 }}>
            Choose which emails you'd like to receive. You're opted out of everything by default.
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress sx={{ color: lumi.color.primary }} />
            </Box>
          ) : prefs ? (
            <Box>
              {EMAIL_PREFS.map((pref) => (
                <PreferenceRow
                  key={pref.key}
                  pref={pref}
                  checked={Boolean(prefs[pref.key])}
                  onChange={handleToggle}
                />
              ))}
            </Box>
          ) : (
            <Typography sx={{ ...lumiType.bodyMd, color: lumi.color.onSurfaceVariant, my: 2 }}>
              Email preferences are unavailable right now. Please try again later.
            </Typography>
          )}
        </StripCard>
      </Box>
    </AppShell>
  );
}

export default Settings;
