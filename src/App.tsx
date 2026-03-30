import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import SubmitTicket from "./pages/SubmitTicket";
import MyTickets from "./pages/MyTickets";
import TicketManagement from "./pages/TicketManagement";
import TicketDetail from "./pages/TicketDetail";
import Categories from "./pages/Categories";
import Locations from "./pages/Locations";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import WorkProgressTracker from "./pages/WorkProgressTracker";
import RoleDashboard from "./pages/RoleDashboard";
import MaintenanceQuotations from "./pages/MaintenanceQuotations";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceQuotations from "./pages/FinanceQuotations";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<RoleDashboard />} />
        <Route path="tickets/new" element={<SubmitTicket />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="tickets" element={<TicketManagement />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="categories" element={<Categories />} />
        <Route path="locations" element={<Locations />} />
        <Route path="admin/users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="work-progress" element={<WorkProgressTracker />} />
        <Route path="maintenance-quotations" element={<MaintenanceQuotations />} />
        <Route path="finance-quotations" element={<FinanceQuotations />} />
        <Route path="profile" element={<Profile />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
