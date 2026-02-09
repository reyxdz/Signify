import React from 'react';
import { FileText, PenTool, Users, CheckCircle } from 'lucide-react';
import './StatCard.css';

const StatCard = ({ icon: Icon, value, label, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            {trend.icon} {trend.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
