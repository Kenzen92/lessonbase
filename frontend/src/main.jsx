import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./contexts/auth_context.jsx";
import { UserProvider } from "./contexts/user_context.jsx";
import { ClassEventsProvider } from "./contexts/class_event_context.jsx";
import { SubjectsProvider } from "./contexts/subjects_context.jsx";
import { StudentsProvider } from "./contexts/students_context.jsx";
import { ClassGroupsProvider } from "./contexts/class_groups_context.jsx";
import { StatisticsProvider } from "./contexts/statistics_context.jsx";
import { AssignmentsProvider } from "./contexts/assignments_context.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Initialize Sentry BEFORE React renders to catch all errors
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' or 'production'
  enabled: import.meta.env.VITE_SENTRY_ENABLED !== 'false', // Can be controlled via env var
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

ReactDOM.createRoot(document.getElementById("root")).render(
  //<React.StrictMode>
  <div className="app-container">
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserProvider>
            <ClassEventsProvider>
              <SubjectsProvider>
                <StudentsProvider>
                  <ClassGroupsProvider>
                    <StatisticsProvider>
                      <AssignmentsProvider>
                        <App />
                      </AssignmentsProvider>
                    </StatisticsProvider>
                  </ClassGroupsProvider>
                </StudentsProvider>
              </SubjectsProvider>
            </ClassEventsProvider>
          </UserProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </div>

  //</React.StrictMode>,
);
