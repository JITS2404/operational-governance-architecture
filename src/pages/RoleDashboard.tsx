import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import HelpDeskDashboard from './HelpDeskDashboard';
import TechnicianDashboard from './TechnicianDashboard';
import FinanceDashboard from './FinanceDashboard';
import EstimationManager from './EstimationManager';
import Dashboard from './Dashboard';

export default function RoleDashboard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Route users to appropriate dashboard based on role
  switch (user.role) {
    case 'PLATFORM_ADMIN':
      return <Dashboard />;
    
    case 'HEAD':
      return <Dashboard />;
    
    case 'MAINTENANCE_TEAM':
      return <EstimationManager />;
    
    case 'TECHNICIAN':
      return <TechnicianDashboard />;
    
    case 'FINANCE_TEAM':
      return <FinanceDashboard />;
    
    case 'REPORTER':
      return <Dashboard />;
    
    default:
      return <Dashboard />;
  }
}