import React, { useState, useEffect } from 'react';
import { PenTool, FileText, Mail, User } from 'lucide-react';
import './LeftPanel.css';

function LeftPanel() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Fetch user data from the database using JWT token
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch('http://localhost:5000/api/users/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.statusText}`);
        }

        const data = await response.json();
        setUserData(data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const myInformationTools = userData ? [
    { 
      id: 1, 
      icon: PenTool, 
      label: 'My Signature',
      value: (typeof userData.signature === 'object' && userData.signature?.signature) 
        ? userData.signature.signature 
        : (userData.signature || 'Signature here'),
      displayValue: '[Signature Image]', // Display placeholder for image
      placeholder: !userData.signature,
      className: 'tool-signature' 
    },
    { 
      id: 2, 
      icon: FileText, 
      label: 'My Initial',
      value: (typeof userData.signature === 'object' && userData.signature?.initials)
        ? userData.signature.initials
        : (userData.initial || 'Initial here'),
      displayValue: '[Initials Image]', // Display placeholder for image
      placeholder: !userData.signature,
      className: 'tool-initial' 
    },
    { 
      id: 3, 
      icon: Mail, 
      label: 'My Email',
      value: userData.email || 'Email here',
      placeholder: !userData.email,
      className: 'tool-email' 
    },
    { 
      id: 4, 
      icon: User, 
      label: 'My Full Name',
      value: (userData.firstName && userData.lastName) ? `${userData.firstName} ${userData.lastName}` : (userData.fullName || 'Name here'),
      placeholder: !(userData.firstName && userData.lastName) && !userData.fullName,
      className: 'tool-fullname' 
    },
  ] : [];

  const recipientTools = [
    { 
      id: 5, 
      icon: PenTool, 
      label: 'Recipient Signature',
      value: 'Signature here',
      placeholder: true,
      className: 'tool-recipient-signature' 
    },
    { 
      id: 6, 
      icon: FileText, 
      label: 'Recipient Initial',
      value: 'Initial here',
      placeholder: true,
      className: 'tool-recipient-initial' 
    },
    { 
      id: 7, 
      icon: Mail, 
      label: 'Recipient Email',
      value: 'Email here',
      placeholder: true,
      className: 'tool-recipient-email' 
    },
    { 
      id: 8, 
      icon: User, 
      label: 'Recipient Full Name',
      value: 'Name here',
      placeholder: true,
      className: 'tool-recipient-fullname' 
    },
  ];

  const handleDragStart = (e, tool) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(tool));
    e.dataTransfer.setData('text/plain', tool.value);
  };

  return (
    <div className="left-panel">
      <div className="panel-header">
        <h3>Tools</h3>
      </div>
      <div className="panel-content">
        {/* My Information Group */}
        <div className="tools-group">
          <div className="tools-group-title">My Information</div>
          <div className="tools-container">
            {myInformationTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={`tool-item ${tool.className}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tool)}
                >
                  <div className="tool-icon">
                    <IconComponent size={24} />
                  </div>
                  <span className="tool-label">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recipients Group */}
        <div className="tools-group">
          <div className="tools-group-title">Recipients</div>
          <div className="tools-container">
            {recipientTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={`tool-item ${tool.className}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, tool)}
                >
                  <div className="tool-icon">
                    <IconComponent size={24} />
                  </div>
                  <span className="tool-label">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;
