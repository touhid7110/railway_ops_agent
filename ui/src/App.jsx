import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BookingSearch from './components/BookingSearch';
import AgentLogs from './components/AgentLogs';
import MissionHistory from './components/MissionHistory';
import Settings from './components/Settings';

const PAGES = {
  dashboard: Dashboard,
  booking:   BookingSearch,
  logs:      AgentLogs,
  history:   MissionHistory,
  settings:  Settings,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [activeJobId, setActiveJobId] = useState(null);
  const Page = PAGES[page] || Dashboard;

  const sharedProps = {
    onNavigate: setPage,
    activeJobId,
    setActiveJobId,
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--background)', overflow: 'hidden' }}>
      <Sidebar active={page} onNavigate={setPage} />
      <main
        style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--surface)' }}
      >
        <Page {...sharedProps} />
      </main>
    </div>
  );
}
