import React from 'react';
import { Check, Upload, Share2, PenTool, Eye, Download } from 'lucide-react';
import '../Sections.css';

const Activity = () => {
  const getActivityIcon = (icon) => {
    const iconMap = {
      '✓': Check,
      '⬆️': Upload,
      '👥': Share2,
      '✍️': PenTool,
      '👁️': Eye,
      '⬇️': Download,
    };
    return iconMap[icon];
  };

  const activities = [
    { id: 1, action: 'Document signed', document: 'Contract_2026.pdf', time: '2 hours ago', icon: Check },
    { id: 2, action: 'Document uploaded', document: 'Invoice_Q1.pdf', time: '1 day ago', icon: Upload },
    { id: 3, action: 'Document shared', document: 'Proposal_NewClient.pdf', to: 'john@example.com', time: '3 days ago', icon: Share2 },
    { id: 4, action: 'Signature added', signature: 'John Smith (Formal)', time: '5 days ago', icon: PenTool },
    { id: 5, action: 'Document viewed', document: 'Report_Monthly.xlsx', by: 'sarah@example.com', time: '1 week ago', icon: Eye },
    { id: 6, action: 'Document downloaded', document: 'Agreement_Final.docx', time: '2 weeks ago', icon: Download },
  ];

  return (
    <div className="section-activity">
      <div className="section-header">
        <h1>Activity</h1>
        <p>Track all your actions and interactions</p>
      </div>

      <div className="activity-timeline">
        {activities.map(activity => {
          const IconComponent = activity.icon;
          return (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                <IconComponent size={20} />
              </div>
              <div className="activity-content">
                <div className="activity-action">
                  {activity.action}
                  {activity.document && <span className="highlight"> {activity.document}</span>}
                  {activity.to && <span> to <span className="highlight">{activity.to}</span></span>}
                  {activity.by && <span> by <span className="highlight">{activity.by}</span></span>}
                  {activity.signature && <span> <span className="highlight">{activity.signature}</span></span>}
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Activity;
