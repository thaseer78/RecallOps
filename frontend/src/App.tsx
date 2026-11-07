import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { InvestigatePage } from './pages/InvestigatePage';
import { MemoryExplorerPage } from './pages/MemoryExplorerPage';
import { LearningHistoryPage } from './pages/LearningHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/:id" element={<IncidentDetailPage />} />
        <Route path="/investigate" element={<InvestigatePage />} />
        <Route path="/investigate/:id" element={<InvestigatePage />} />
        <Route path="/memory" element={<MemoryExplorerPage />} />
        <Route path="/history" element={<LearningHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

