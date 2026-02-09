import React from 'react';
import { BarChart3, FileText, Clipboard, PenTool, Share2, TrendingUp, HelpCircle, Link } from 'lucide-react';
import './DashboardSidebar.css';

const DashboardSidebar = ({ isOpen, activeSection, onSectionChange, onClose }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'templates', label: 'Templates', icon: Clipboard },
    { id: 'signatures', label: 'My Signatures', icon: PenTool },
    { id: 'shared', label: 'Shared with Me', icon: Share2 },
    { id: 'activity', label: 'Activity', icon: TrendingUp },
  ];

  const resourceItems = [
    { label: 'Help & Support', icon: HelpCircle },
    { label: 'Keyboard Shortcuts', icon: Link },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => {
                  onSectionChange(item.id);
                  onClose();
                }}
              >
                <IconComponent className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-section-title">Resources</div>
          {resourceItems.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <button key={idx} className="sidebar-link">
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
