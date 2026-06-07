import { Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";

import { lumi } from "./tokens";
import SideNav, { SIDEBAR_WIDTH } from "./side_nav";
import TopBar from "./TopBar";
import { activeNavFromPath } from "./nav";
import { getToken, clearAuth } from "../../utils/tokenStorage";

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

/**
 * Page scaffold for every Luminous content page: fixed `SideNav` + a `TopBar`
 * over a scrollable, sidebar-offset `<main>` (max-width 1280, matching the
 * dashboard). Owns the two behaviours that are identical on every page —
 * router navigation and logout — so screens only supply their content.
 *
 * Props:
 *   activeNav?  override the nav item to highlight (defaults to the route)
 *   user        { userName, avatarUrl, role? } for the TopBar + sidebar avatar
 *   search?     { placeholder, value, onChange, onSubmit } for the TopBar
 *   onCreateNew the sidebar "Create New" CTA + mobile "+" handler
 *   children    the page body (typically a <PageHeader/> + content)
 */
export default function AppShell({ activeNav, user = {}, search = {}, onCreateNew, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = activeNav || activeNavFromPath(location.pathname);

  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/logout/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${getToken()}`,
          "Content-Type": "application/json",
        },
      });
    } catch {
      // Network failure shouldn't trap the user in a logged-in state.
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: lumi.color.background,
        color: lumi.color.onBackground,
        fontFamily: lumi.font.body,
      }}
    >
      <SideNav
        activeId={active}
        avatarUrl={user.avatarUrl}
        onNavigate={(item) => navigate(item.path)}
        onCreateNew={onCreateNew}
        onLogout={handleLogout}
      />

      <Box
        component="div"
        sx={{
          flex: 1,
          width: "100%",
          maxWidth: 1280,
          mx: "auto",
          ml: { md: `${SIDEBAR_WIDTH}px` },
          pt: { xs: "64px", md: 0 },
          p: { xs: 2, md: 3, lg: 5 },
        }}
      >
        <TopBar
          searchPlaceholder={search.placeholder}
          searchValue={search.value}
          onSearchChange={search.onChange}
          onSearchSubmit={search.onSubmit}
          user={user}
        />

        <Box component="main">{children}</Box>
      </Box>
    </Box>
  );
}

export { SIDEBAR_WIDTH };
