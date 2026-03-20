import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import TopHeader from '../TopHeader/TopHeader';
import BottomNav from '../BottomNav/BottomNav';
import FAB from '../FAB/FAB';
import ManualLogModal from '../ManualLogModal/ManualLogModal';
import { useTimer } from '../../context/TimerContext';
import './AppLayout.css';

export default function AppLayout() {
  const { setShowManualModal } = useTimer();

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <TopHeader />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <FAB onOpenManual={() => setShowManualModal(true)} />
      <ManualLogModal />
    </div>
  );
}
