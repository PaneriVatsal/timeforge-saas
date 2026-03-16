import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopHeader from '../TopHeader/TopHeader';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopHeader />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
