import React from 'react';
import OverviewPage from './Overview/OverviewPage';
import '../Sections.css';

// Re-export the new OverviewPage component for backward compatibility
const Overview = ({ user }) => <OverviewPage user={user} />;

export default Overview;
