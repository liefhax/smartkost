import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardProvider } from './context/DashboardContext';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Controls from './pages/Controls';
import Energy from './pages/Energy';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <DashboardProvider>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/controls" element={<Controls />} />
            <Route path="/energy" element={<Energy />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </DashboardLayout>
      </DashboardProvider>
    </ErrorBoundary>
  );
}