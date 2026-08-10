import React from 'react';
import PlatformLinkingCard from './PlatformLinkingCard';
import SyncProgressCard from './SyncProgressCard';

const DashboardHome = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <PlatformLinkingCard />
      <SyncProgressCard />
    </div>
  );
};

export default DashboardHome;