import React from 'react';
import {
  Activity,
  FileText,
  PenTool,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import './ActivityFeed.css';

const ActivityFeed = ({ activities, isLoading }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'document_uploaded':
        return <FileText size={16} />;
      case 'document_signed':
        return <CheckCircle size={16} />;
      case 'signature_created':
        return <PenTool size={16} />;
      case 'document_shared':
        return <Share2 size={16} />;
      case 'action_required':
        return <AlertCircle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getActivityTypeClass = (type) => {
    switch (type) {
      case 'document_signed':
        return 'signed';
      case 'action_required':
        return 'alert';
      case 'document_shared':
        return 'shared';
      default:
        return 'default';
    }
  };

  const formatActivityTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="activity-feed loading">
        <div className="activity-skeleton"></div>
        <div className="activity-skeleton"></div>
        <div className="activity-skeleton"></div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="activity-feed empty">
        <Activity size={32} />
        <p>No activity yet</p>
        <small>Your activity will appear here</small>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {activities.map((activity) => (
        <div
          key={activity._id || activity.id}
          className={`activity-item ${getActivityTypeClass(activity.type)}`}
        >
          <div className={`activity-icon ${getActivityTypeClass(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          <div className="activity-content">
            <div className="activity-title">{activity.title || activity.description}</div>
            {activity.details && (
              <div className="activity-details">{activity.details}</div>
            )}
          </div>
          <div className="activity-time">
            <Clock size={13} />
            {formatActivityTime(activity.timestamp || activity.createdAt)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
