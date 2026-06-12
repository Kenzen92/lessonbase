import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import LuminousDashboard from "../components/Dashboard/luminous/luminous_dashboard";
import {
  toMetrics,
  toUpcomingClasses,
  toRecentAssignments,
  toWeeklyMarking,
} from "../components/Dashboard/luminous/transform";

import ClassEventWizard from "../components/ClassEvents/class_event_wizard.jsx";
import ClassEventDetailsDrawer from "../components/ClassEvents/class_event_details_drawer.jsx";

import { useUser } from "../contexts/user_context.jsx";
import { useStatistics } from "../contexts/statistics_context.jsx";
import { useAssignments } from "../contexts/assignments_context.jsx";
import { useSubjects } from "../contexts/subjects_context.jsx";
import { useStudents } from "../contexts/students_context.jsx";
import { useClassGroups } from "../contexts/class_groups_context.jsx";
import { useAuth } from "../contexts/auth_context.jsx";

import { cancelClassEvent, fetchClassEventsPaged, fetchClassEvent, fetchStorageUsage } from "../utils/agent.js";
import { resolveMediaUrl } from "../utils/media.js";
import { getToken, clearAuth } from "../utils/tokenStorage";

const PAGE_SIZE = 15;

const BASE_URL = import.meta.env.VITE_REACT_APP_API_URL;

/**
 * Router + data wiring for the Luminous dashboard. Reads the shared contexts,
 * transforms them into the dashboard's presentational props, and owns the
 * class-event wizard + details drawer so the UI is fully interactive. The
 * LuminousDashboard component itself stays purely presentational.
 */
export default function DashboardLuminous() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const queryClient = useQueryClient();
  const { auth } = useAuth();
  const { profilePicture, firstName } = useUser();
  const { statistics } = useStatistics();
  const { assignments, isLoading: assignmentsLoading } = useAssignments();
  const { data: subjects } = useSubjects();
  const { data: students } = useStudents();
  const { data: classGroups } = useClassGroups();

  const [classRange, setClassRange] = useState("upcoming");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentClassEvent, setCurrentClassEvent] = useState(null);
  const [storage, setStorage] = useState(null);

  // Storage usage feeds the Resources metric card's detail line.
  useEffect(() => {
    if (!auth?.token) return;
    let cancelled = false;
    (async () => {
      try {
        const usage = await fetchStorageUsage(navigate);
        if (!cancelled) setStorage(usage);
      } catch {
        // Non-critical: the card simply omits the usage line.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [auth?.token, navigate]);

  // ── Class events: range-scoped, server-paginated (15 per page) ──────────
  const {
    data: pagedClasses,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: eventsLoading,
  } = useInfiniteQuery({
    queryKey: ["classEvents", "paged", classRange],
    queryFn: ({ pageParam = 0 }) =>
      fetchClassEventsPaged({ range: classRange, limit: PAGE_SIZE, offset: pageParam }, navigate),
    initialPageParam: 0,
    enabled: !!auth?.token,
    staleTime: 1000 * 60 * 5,
    // Advance the offset by the number of rows seen so far; stop when the
    // envelope reports no `next` page.
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.next
        ? allPages.reduce((seen, page) => seen + (page?.results?.length || 0), 0)
        : undefined,
  });

  // ── Derived presentational props ────────────────────────────────────────
  const metrics = useMemo(() => toMetrics(statistics, storage), [statistics, storage]);
  const upcomingClasses = useMemo(() => {
    const events = (pagedClasses?.pages || []).flatMap((page) => page?.results || []);
    return toUpcomingClasses(events);
  }, [pagedClasses]);
  const recentAssignments = useMemo(() => toRecentAssignments(assignments), [assignments]);
  const weeklyMarking = useMemo(() => toWeeklyMarking(assignments), [assignments]);

  const activeNav = (() => {
    const p = location.pathname;
    if (p.startsWith("/students")) return "students";
    if (p.startsWith("/class-groups")) return "classes";
    if (p.startsWith("/assignments")) return "assignments";
    if (p.startsWith("/resources")) return "resources";
    if (p.startsWith("/profile")) return "settings";
    return "dashboard";
  })();

  // ── Class event handlers (mirror the original dashboard) ────────────────
  // Also refresh the drawer's event so in-drawer mutations (e.g. attaching a
  // resource) are reflected immediately, not only after reopening.
  const handleReloadData = async () => {
    queryClient.invalidateQueries({ queryKey: ["classEvents"] });
    if (currentClassEvent?.id) {
      const fresh = await fetchClassEvent(currentClassEvent.id, navigate);
      if (fresh) setCurrentClassEvent(fresh);
    }
  };

  const handleOpenDetails = (event) => {
    const raw = event?.raw || event;
    setCurrentClassEvent(raw);
    setDrawerOpen(true);
    navigate(`/dashboard/${raw.id}`);
  };

  const handleCloseDetails = () => {
    setCurrentClassEvent(null);
    setDrawerOpen(false);
    navigate("/dashboard");
  };

  const handleCreateNew = () => {
    setCurrentClassEvent(null);
    setWizardOpen(true);
  };

  // Start/join a class: the card only offers this for events inside the
  // startable window, so here we just follow the access token into the
  // interactive classroom.
  const handleStartClass = (event) => {
    const token = event?.accessToken || event?.raw?.access_token;
    if (token) navigate(`/interactive-classroom/${token}`);
  };

  const handleCancelClassEvent = async () => {
    if (!currentClassEvent) return;
    await cancelClassEvent(currentClassEvent.id);
    handleCloseDetails();
    handleReloadData();
  };

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

  // Deep-link: open the drawer when the URL carries a class-event id. The list
  // is paginated, so resolve the event directly rather than scanning a partial
  // list.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const found = await fetchClassEvent(parseInt(id, 10), navigate);
      if (!cancelled && found) {
        setCurrentClassEvent(found);
        setDrawerOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  return (
    <>
      <LuminousDashboard
        activeNav={activeNav}
        user={{
          name: "Lessonbase",
          userName: firstName,
          avatarUrl: resolveMediaUrl(profilePicture),
        }}
        metrics={metrics}
        upcomingClasses={upcomingClasses}
        recentAssignments={recentAssignments}
        weeklyMarking={weeklyMarking}
        classRange={classRange}
        classesLoading={eventsLoading}
        classesHasMore={Boolean(hasNextPage)}
        classesLoadingMore={isFetchingNextPage}
        assignmentsLoading={assignmentsLoading}
        onRangeChange={setClassRange}
        onLoadMoreClasses={fetchNextPage}
        onNavigate={(item) => navigate(item.path)}
        onMetricClick={(metric) => metric.path && navigate(metric.path)}
        onCreateNew={handleCreateNew}
        onLogout={handleLogout}
        onClassDetails={handleOpenDetails}
        onClassStart={handleStartClass}
        onAssignmentClick={(row) => navigate(`/assignments/${row.id}`)}
        onViewAllAssignments={() => navigate("/assignments")}
      />

      <ClassEventDetailsDrawer
        open={drawerOpen}
        onClose={handleCloseDetails}
        currentClassEvent={currentClassEvent}
        handleReloadData={handleReloadData}
        handleOpenStudentSearch={() => setWizardOpen(true)}
        handleCancelClassEvent={handleCancelClassEvent}
      />

      <ClassEventWizard
        key={currentClassEvent?.id ?? "new"}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSaved={handleReloadData}
        classData={currentClassEvent}
        subjects={subjects}
        students={students}
        classGroups={classGroups}
      />
    </>
  );
}
