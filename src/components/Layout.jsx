import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import './Layout.css';

// Layout wraps every authenticated page.
// <Outlet /> is where React Router renders the current page (e.g. Home, Explore).
export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />

      {/* Main content area — sits between the two sidebars */}
      <main className="main-content">
        <Outlet />
      </main>

      <RightPanel />
    </div>
  );
}
