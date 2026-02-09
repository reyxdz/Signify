import React, { useState, useEffect } from 'react';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardSidebar from './components/DashboardSidebar/DashboardSidebar';
import DashboardContent from './components/DashboardContent/DashboardContent';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    // Responsive sidebar toggle
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="dashboard-container">
      <DashboardHeader 
        user={user}
        onLogout={onLogout}
        onMenuClick={toggleSidebar}
      />
      
      <div className="dashboard-main">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onClose={() => setIsSidebarOpen(false)}
        />
        
        <DashboardContent
          activeSection={activeSection}
          user={user}
        />
      </div>
    </div>
  );
};

export default Dashboard;
