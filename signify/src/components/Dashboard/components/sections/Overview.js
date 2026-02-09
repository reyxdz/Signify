import React from 'react';
import { FileText, PenTool, Users, CheckCircle, Upload, Layout, Share2 } from 'lucide-react';
import '../Sections.css';

const Overview = ({ user }) => {
  return (
    <div className="section-overview">
      <div className="section-header">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p>Here's what's happening with your documents today</p>
      </div>

      <div className="overview-grid">
        <div className="stat-card">
          <div className="stat-icon"><FileText size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">12</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><PenTool size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">8</div>
            <div className="stat-label">Signatures</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><Users size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">5</div>
            <div className="stat-label">Shared</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><CheckCircle size={32} /></div>
          <div className="stat-content">
            <div className="stat-value">92%</div>
            <div className="stat-label">Completion</div>
          </div>
        </div>
      </div>

      <div className="overview-sections">
        <div className="overview-section">
          <h2>Recent Documents</h2>
          <div className="document-list">
            <div className="document-item">
              <div className="document-info">
                <div className="document-name">Contract_2026.pdf</div>
                <div className="document-meta">Modified 2 days ago</div>
              </div>
              <div className="document-status signed">Signed</div>
            </div>
            <div className="document-item">
              <div className="document-info">
                <div className="document-name">Agreement_Final.docx</div>
                <div className="document-meta">Modified 5 days ago</div>
              </div>
              <div className="document-status pending">Pending</div>
            </div>
            <div className="document-item">
              <div className="document-info">
                <div className="document-name">Invoice_Q1.pdf</div>
                <div className="document-meta">Modified 1 week ago</div>
              </div>
              <div className="document-status signed">Signed</div>
            </div>
          </div>
        </div>

        <div className="overview-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-button primary">
              <Upload size={18} /> Upload Document
            </button>
            <button className="action-button secondary">
              <Layout size={18} /> Use Template
            </button>
            <button className="action-button secondary">
              <Share2 size={18} /> Share Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
