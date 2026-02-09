import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import Logo from '../../../../assets/images/signify_logo.png';
import './DashboardHeader.css';

const DashboardHeader = ({ user, onLogout, onMenuClick }) => {
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onLogout();
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="menu-toggle" onClick={onMenuClick}>
          <Menu size={24} />
        </button>
        
        <div className="header-logo">
          <img src={Logo} alt="Signify" className="logo-img" />
          <span className="logo-text">Signify</span>
        </div>
      </div>

      <div className="header-right">
        <div className="user-menu-wrapper">
          <button 
            className="user-menu-button"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-avatar">
              {user?.firstName?.charAt(0).toUpperCase()}
              {user?.lastName?.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user?.firstName} {user?.lastName}</span>
            <ChevronDown size={20} />
          </button>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-item user-info">
                <div className="user-info-name">{user?.firstName} {user?.lastName}</div>
                <div className="user-info-email">{user?.email}</div>
              </div>
              <hr />
              <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                Profile
              </button>
              <button className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                Settings
              </button>
              <hr />
              <button className="dropdown-item logout" onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
