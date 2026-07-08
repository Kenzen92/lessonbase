import { Box } from "@mui/material";

import { lumi } from "./tokens";
import SideNav, { SIDEBAR_WIDTH } from "./side_nav";
import WelcomeHeader from "./welcome_header";
import MetricsGrid from "./metrics_grid";
import UpcomingClasses from "./upcoming_classes";
import RecentAssignments from "./recent_assignments";
import WeeklyMarkingCard from "./weekly_marking_card";

import {
  sampleMetrics,
  sampleUpcomingClasses,
  sampleRecentAssignments,
  sampleWeeklyMarking,
} from "./sample_data";

/**
 * Luminous EdTech — Teacher Dashboard.
 *
 * A faithful port of the Stitch design to React + MUI, reading every colour and
 * type value from the `lumi` token module. Fully presentational and prop-driven
 * so it can be wired to real data (contexts / react-query) without touching the
 * layout. The Quick Actions panel from the original design is intentionally
 * omitted, leaving Weekly Marking as the right-hand rail.
 *
 * Handler props (all optional) are forwarded to the relevant sections so the UI
 * is ready for state management:
 *   onNavigate, onCreateNew, onLogout, onProfile, onClassDetails,
 *   onViewAllAssignments, onRangeChange.
 */
export default function LuminousDashboard({
  activeNav = "dashboard",
  user = {},
  metrics = sampleMetrics,
  upcomingClasses = sampleUpcomingClasses,
  recentAssignments = sampleRecentAssignments,
  weeklyMarking = sampleWeeklyMarking,
  classRange = "upcoming",
  classesLoading = false,
  classesHasMore = false,
  classesLoadingMore = false,
  assignmentsLoading = false,
  onNavigate,
  onCreateNew,
  onLogout,
  onProfile,
  onClassDetails,
  onClassStart,
  onAssignmentClick,
  onViewAllAssignments,
  onRangeChange,
  onLoadMoreClasses,
  onMetricClick,
}) {
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
        activeId={activeNav}
        avatarUrl={user.avatarUrl}
        onNavigate={onNavigate}
        onCreateNew={onCreateNew}
        onLogout={onLogout}
        onProfile={onProfile}
      />

      <Box
        component="main"
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
        <WelcomeHeader
          brandName={user.name || "Lessonbase"}
          avatarUrl={user.avatarUrl}
          userName={user.userName}
          onProfile={onProfile}
        />

        <MetricsGrid metrics={metrics} onMetricClick={onMetricClick} />

        <UpcomingClasses
          classes={upcomingClasses}
          range={classRange}
          loading={classesLoading}
          hasMore={classesHasMore}
          loadingMore={classesLoadingMore}
          onRangeChange={onRangeChange}
          onLoadMore={onLoadMoreClasses}
          onDetails={onClassDetails}
          onStart={onClassStart}
        />

        {/* Bottom grid: assignments table (2 cols) + weekly marking rail (1 col).
            Quick Actions removed per spec. */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            gap: 3,
          }}
        >
          <RecentAssignments
            assignments={recentAssignments}
            loading={assignmentsLoading}
            onViewAll={onViewAllAssignments}
            onRowClick={onAssignmentClick}
          />
          <WeeklyMarkingCard
            progress={weeklyMarking.progress}
            remaining={weeklyMarking.remaining}
            {...(weeklyMarking.title ? { title: weeklyMarking.title } : {})}
            {...(weeklyMarking.remainingText ? { remainingText: weeklyMarking.remainingText } : {})}
          />
        </Box>
      </Box>
    </Box>
  );
}
