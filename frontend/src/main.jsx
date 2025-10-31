import React from "react";
import ReactDOM from "react-dom/client";
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
const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")).render(
  //<React.StrictMode>
  <div className="app-container">
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
  </div>

  //</React.StrictMode>,
);
