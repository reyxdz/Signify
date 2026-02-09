import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const OverviewContext = createContext();

export const useOverviewContext = () => {
  const context = useContext(OverviewContext);
  if (!context) {
    throw new Error('useOverviewContext must be used within OverviewProvider');
  }
  return context;
};

export const OverviewProvider = ({ children, userId }) => {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSignatures: 0,
    sharedDocuments: 0,
    completionRate: 0,
  });

  const [recentDocuments, setRecentDocuments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch overview data from backend
  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Fetch all overview data in parallel
      const [statsRes, documentsRes, activityRes] = await Promise.all([
        fetch(`http://localhost:5000/api/overview/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/documents/recent?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/activity?limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!statsRes.ok || !documentsRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch overview data');
      }

      const statsData = await statsRes.json();
      const documentsData = await documentsRes.json();
      const activityData = await activityRes.json();

      setStats(statsData.data || statsData);
      setRecentDocuments(documentsData.data || documentsData);
      setActivity(activityData.data || activityData);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (userId) {
      fetchOverviewData();
    }
  }, [userId, fetchOverviewData]);

  // Refetch data
  const refetchData = useCallback(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  const value = {
    stats,
    recentDocuments,
    activity,
    loading,
    error,
    refetchData,
    setStats,
    setRecentDocuments,
    setActivity,
  };

  return (
    <OverviewContext.Provider value={value}>
      {children}
    </OverviewContext.Provider>
  );
};

export default OverviewContext;
