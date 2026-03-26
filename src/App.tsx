import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WalletProvider, useWallet } from "@/context/WalletContext";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Phase1TestPanel from "./components/dev/Phase1TestPanel";
import { useIPFS } from "./hooks/useIPFS";
import AppLayout from "./components/layout/AppLayout";

// App components and routes
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import ActiveExam from "./pages/student/ActiveExam";
import SubmissionHistory from "./pages/student/SubmissionHistory";
import ZKProofs from "./pages/student/ZKProofs";

import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorCourses from "./pages/instructor/InstructorCourses";
import ExamManagement from "./pages/instructor/ExamManagement";
import InstructorSubmissions from "./pages/instructor/InstructorSubmissions";
import IPFSManager from "./pages/instructor/IPFSManager";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import AuditLogs from "./pages/admin/AuditLogs";
import SystemSettings from "./pages/admin/SystemSettings";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Initialize IPFS
function IPFSInit() {
  const { ipfsReady, ipfsError } = useIPFS();
  if (ipfsError) console.warn("[App] IPFS unavailable:", ipfsError);
  return null;
}

// Role-based redirect guard
function RoleGuard({ allowedRoles, children }) {
  const { isConnected, role, isCorrectNetwork } = useWallet();

  if (!isConnected || !isCorrectNetwork) {
    return <Navigate to="/" replace />;
  }

  if (role === null) return null;

  if (!allowedRoles.includes(role)) {
    if (role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (role === "TEACHER") return <Navigate to="/instructor/dashboard" replace />;
    if (role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <IPFSInit />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/register/:linkId" element={<Register />} />
            <Route path="/dev/phase1" element={<Phase1TestPanel />} />

            <Route element={<AppLayout />}>
              {/* Student Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <RoleGuard allowedRoles={["STUDENT", "TEACHER", "ADMIN", "SUB_ADMIN"]}>
                    <StudentDashboard />
                  </RoleGuard>
                }
              />
              <Route path="/student/courses" element={<RoleGuard allowedRoles={["STUDENT"]}><StudentCourses /></RoleGuard>} />
              <Route path="/student/exam/:examId" element={<RoleGuard allowedRoles={["STUDENT"]}><ActiveExam /></RoleGuard>} />
              <Route path="/student/submissions" element={<RoleGuard allowedRoles={["STUDENT"]}><SubmissionHistory /></RoleGuard>} />
              <Route path="/student/proofs" element={<RoleGuard allowedRoles={["STUDENT"]}><ZKProofs /></RoleGuard>} />

              {/* Instructor/Teacher Routes */}
              <Route path="/instructor/dashboard" element={<RoleGuard allowedRoles={["TEACHER", "ADMIN"]}><InstructorDashboard /></RoleGuard>} />
              <Route path="/instructor/courses" element={<RoleGuard allowedRoles={["TEACHER", "ADMIN"]}><InstructorCourses /></RoleGuard>} />
              <Route path="/instructor/exam/:examId" element={<RoleGuard allowedRoles={["TEACHER", "ADMIN"]}><ExamManagement /></RoleGuard>} />
              <Route path="/instructor/submissions/:examId" element={<RoleGuard allowedRoles={["TEACHER", "ADMIN"]}><InstructorSubmissions /></RoleGuard>} />
              <Route path="/instructor/ipfs" element={<RoleGuard allowedRoles={["TEACHER", "ADMIN"]}><IPFSManager /></RoleGuard>} />

              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<RoleGuard allowedRoles={["ADMIN", "SUB_ADMIN"]}><AdminDashboard /></RoleGuard>} />
              <Route path="/admin/users" element={<RoleGuard allowedRoles={["ADMIN", "SUB_ADMIN"]}><ManageUsers /></RoleGuard>} />
              <Route path="/admin/audit" element={<RoleGuard allowedRoles={["ADMIN", "SUB_ADMIN"]}><AuditLogs /></RoleGuard>} />
              <Route path="/admin/settings" element={<RoleGuard allowedRoles={["ADMIN"]}><SystemSettings /></RoleGuard>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

export default App;
