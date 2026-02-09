import React from 'react';
import Overview from '../sections/Overview';
import Documents from '../sections/Documents';
import Templates from '../sections/Templates';
import Signatures from '../sections/Signatures';
import SharedWithMe from '../sections/SharedWithMe';
import Activity from '../sections/Activity';
import './DashboardContent.css';

const DashboardContent = ({ activeSection, user }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <Overview user={user} />;
      case 'documents':
        return <Documents />;
      case 'templates':
        return <Templates />;
      case 'signatures':
        return <Signatures />;
      case 'shared':
        return <SharedWithMe />;
      case 'activity':
        return <Activity />;
      default:
        return <Overview user={user} />;
    }
  };

  return (
    <main className="dashboard-content">
      {renderContent()}
    </main>
  );
};

export default DashboardContent;
