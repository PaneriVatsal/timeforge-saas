import { useState, useRef, useEffect } from 'react';
import { Plus, Play, Clock, X } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';
import { useToast } from '../../context/ToastContext';
import gsap from 'gsap';
import './FAB.css';

export default function FAB({ onOpenManual }) {
  const [isOpen, setIsOpen] = useState(false);
  const { is_running, startTimer, active_project_id } = useTimer();
  const { addToast } = useToast();
  
  const fabRef = useRef(null);
  const optionsRef = useRef(null);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(optionsRef.current.children, 
        { scale: 0, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'back.out(1.7)' }
      );
    }
  }, [isOpen]);

  const handleQuickStart = () => {
    if (is_running) {
      addToast('A timer is already running!', 'info');
    } else if (!active_project_id) {
       addToast('Select a project on the Dashboard first', 'info');
    } else {
      startTimer(active_project_id, 'Quick task');
      addToast('Timer started!', 'success');
    }
    setIsOpen(false);
  };

  return (
    <div className="fab-container" ref={fabRef}>
      {isOpen && (
        <div className="fab-options" ref={optionsRef}>
          <button className="fab-option-btn" onClick={onOpenManual} title="Log Manual">
            <span className="fab-option-label">Log Manual</span>
            <div className="fab-option-icon manual-bg">
              <Clock size={20} />
            </div>
          </button>
          <button className="fab-option-btn" onClick={handleQuickStart} title="Quick Start">
            <span className="fab-option-label">Quick Start</span>
            <div className="fab-option-icon start-bg">
              <Play size={20} />
            </div>
          </button>
        </div>
      )}
      
      <button 
        className={`fab-main-btn ${isOpen ? 'fab-active' : ''}`} 
        onClick={toggleOpen}
        id="mobile-fab"
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
