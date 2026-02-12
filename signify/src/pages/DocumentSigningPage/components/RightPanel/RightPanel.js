import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Search, X, Loader, Plus } from 'lucide-react';
import './RightPanel.css';

function RightPanel({ selectedToolId, droppedTools, onDeleteTool, onUpdateToolStyle, documentId }) {
  const selectedTool = droppedTools.find(t => t.id === selectedToolId);
  const isTextField = selectedTool && selectedTool.tool.label && 
    (selectedTool.tool.label === 'My Email' || selectedTool.tool.label === 'My Full Name');
  
  const isRecipientField = selectedTool && selectedTool.tool.label && 
    (selectedTool.tool.label === 'Recipient Signature' || selectedTool.tool.label === 'Recipient Initial' || 
     selectedTool.tool.label === 'Recipient Email' || selectedTool.tool.label === 'Recipient Full Name');

  // Multi-recipient state
  const [assignedRecipients, setAssignedRecipients] = useState(selectedTool?.assignedRecipients || []);
  const [searchResults, setSearchResults] = useState([]);
  const [showRecipientSearch, setShowRecipientSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (selectedToolId) {
      console.log('RightPanel received selectedToolId:', selectedToolId);
    }
  }, [selectedToolId]);

  // Update assigned recipients when tool changes
  useEffect(() => {
    if (selectedTool && isRecipientField) {
      setAssignedRecipients(selectedTool.assignedRecipients || []);
    }
  }, [selectedTool, isRecipientField]);

  // Incremental email search with debouncing
  useEffect(() => {
    if (!isRecipientField) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/emails/search?q=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Filter out already assigned recipients
          const filteredResults = (data.data || []).filter(
            result => !assignedRecipients.some(r => r.recipientEmail === result.email)
          );
          setSearchResults(filteredResults);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching emails:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isRecipientField, assignedRecipients]);

  /**
   * Add a recipient to the field
   */
  const handleAddRecipient = (emailResult) => {
    const newRecipient = {
      recipientId: emailResult.userId,
      recipientEmail: emailResult.email,
      recipientName: emailResult.name || null,
      status: 'pending',
      signatureData: null,
      signedAt: null,
    };

    const updatedRecipients = [...assignedRecipients, newRecipient];
    setAssignedRecipients(updatedRecipients);
    setSearchQuery('');
    setSearchResults([]);

    // Update tool in parent
    if (selectedTool) {
      onUpdateToolStyle(selectedToolId, { assignedRecipients: updatedRecipients });
    }
  };

  /**
   * Remove a recipient from the field
   */
  const handleRemoveRecipient = (recipientEmail) => {
    const updatedRecipients = assignedRecipients.filter(r => r.recipientEmail !== recipientEmail);
    setAssignedRecipients(updatedRecipients);

    if (selectedTool) {
      onUpdateToolStyle(selectedToolId, { assignedRecipients: updatedRecipients });
    }
  };

  /**
   * Clear all recipients
   */
  const handleClearAllRecipients = () => {
    setAssignedRecipients([]);
    if (selectedTool) {
      onUpdateToolStyle(selectedToolId, { assignedRecipients: [] });
    }
  };

  const handleFontFamilyChange = (e) => {
    onUpdateToolStyle(selectedToolId, { fontFamily: e.target.value });
  };

  const handleFontSizeChange = (e) => {
    const size = parseInt(e.target.value) || 14;
    onUpdateToolStyle(selectedToolId, { fontSize: size });
  };

  const handleFontColorChange = (e) => {
    onUpdateToolStyle(selectedToolId, { fontColor: e.target.value });
  };

  const handleFontStyleToggle = (style) => {
    const currentStyles = selectedTool.fontStyles || {};
    const newStyles = {
      ...currentStyles,
      [style]: !currentStyles[style]
    };
    onUpdateToolStyle(selectedToolId, { fontStyles: newStyles });
  };

  return (
    <div className="right-panel">
      <div className="panel-header">
        <h3>Properties</h3>
      </div>
      <div className="panel-content">
        {selectedTool ? (
          <div className="tool-properties">
            {/* Multi-Recipient Assignment Section */}
            {isRecipientField && (
              <div className="recipient-assignment-section">
                <div className="section-divider">
                  <span>Assign Recipients</span>
                  {assignedRecipients.length > 0 && (
                    <span className="recipient-count">{assignedRecipients.length}</span>
                  )}
                </div>

                {/* Assigned Recipients List */}
                {assignedRecipients.length > 0 && (
                  <div className="assigned-recipients-list">
                    {assignedRecipients.map((recipient, index) => (
                      <div key={recipient.recipientEmail} className="assigned-recipient-tag">
                        <div className="recipient-tag-content">
                          <div className="recipient-email-tag">{recipient.recipientEmail}</div>
                          {recipient.recipientName && (
                            <div className="recipient-name-tag">{recipient.recipientName}</div>
                          )}
                          {recipient.status !== 'pending' && (
                            <span className={`recipient-status-badge ${recipient.status}`}>
                              {recipient.status}
                            </span>
                          )}
                        </div>
                        <button
                          className="remove-recipient-tag-btn"
                          onClick={() => handleRemoveRecipient(recipient.recipientEmail)}
                          title="Remove recipient"
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search Section */}
                <div className="recipient-selector">
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Add more recipients..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowRecipientSearch(true)}
                      className="search-input"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        className="clear-search-btn"
                        onClick={() => setSearchQuery('')}
                        title="Clear search"
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {showRecipientSearch && (
                    <div className="recipient-dropdown">
                      {isSearching && (
                        <div className="searching-message">
                          <Loader size={14} className="spinner" />
                          Searching...
                        </div>
                      )}

                      {!isSearching && searchQuery.trim().length > 0 && (
                        <>
                          <div className="results-header">
                            {searchResults.length === 0 ? (
                              <span className="results-count">No matches found</span>
                            ) : (
                              <span className="results-count">
                                {searchResults.length} email{searchResults.length !== 1 ? 's' : ''} available
                              </span>
                            )}
                          </div>

                          {searchResults.length > 0 && (
                            <div className="recipient-list">
                              {searchResults.map((emailResult) => (
                                <button
                                  key={emailResult.userId}
                                  className="recipient-item"
                                  onClick={() => handleAddRecipient(emailResult)}
                                  type="button"
                                >
                                  <Plus size={14} className="add-icon" />
                                  <div className="recipient-result-content">
                                    <div className="recipient-item-email">{emailResult.email}</div>
                                    {emailResult.name && (
                                      <div className="recipient-item-name">{emailResult.name}</div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {!isSearching && searchQuery.trim().length === 0 && (
                        <div className="search-placeholder">
                          Start typing an email to add recipients...
                        </div>
                      )}

                      <div className="dropdown-footer">
                        <button
                          className="close-search-btn"
                          onClick={() => {
                            setShowRecipientSearch(false);
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          type="button"
                        >
                          Done
                        </button>
                        {assignedRecipients.length > 1 && (
                          <button
                            className="clear-all-btn"
                            onClick={handleClearAllRecipients}
                            title="Clear all recipients"
                            type="button"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {assignedRecipients.length === 0 && !showRecipientSearch && (
                  <div className="empty-recipients-state">
                    <p>No recipients assigned yet</p>
                    <small>Click the search field to add one or more recipients</small>
                  </div>
                )}
              </div>
            )}

            {isTextField && (
              <div className="text-field-styles">
                <div className="section-divider">Text Styling</div>
                
                <div className="property-item">
                  <label htmlFor="fontFamily">Font Family</label>
                  <select 
                    id="fontFamily"
                    value={selectedTool.fontFamily || 'Arial'}
                    onChange={handleFontFamilyChange}
                    className="style-select"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                  </select>
                </div>

                <div className="property-item">
                  <label htmlFor="fontSize">Font Size (px)</label>
                  <input 
                    id="fontSize"
                    type="number" 
                    min="8" 
                    max="72" 
                    value={selectedTool.fontSize || 14}
                    onChange={handleFontSizeChange}
                    className="style-input"
                  />
                </div>

                <div className="property-item">
                  <label htmlFor="fontColor">Font Color</label>
                  <input 
                    id="fontColor"
                    type="color" 
                    value={selectedTool.fontColor || '#000000'}
                    onChange={handleFontColorChange}
                    className="style-input color-input"
                  />
                </div>

                <div className="property-item">
                  <label>Font Design</label>
                  <div className="font-design-buttons">
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.bold ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('bold')}
                      title="Bold"
                    >
                      <strong>B</strong>
                    </button>
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.italic ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('italic')}
                      title="Italic"
                    >
                      <em>I</em>
                    </button>
                    <button 
                      className={`design-btn ${selectedTool.fontStyles?.underline ? 'active' : ''}`}
                      onClick={() => handleFontStyleToggle('underline')}
                      title="Underline"
                    >
                      <u>U</u>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              className="delete-btn"
              onClick={() => {
                console.log('Delete button clicked for tool:', selectedToolId);
                onDeleteTool(selectedToolId);
              }}
              title="Delete this field"
            >
              <Trash2 size={18} />
              Delete Field
            </button>
          </div>
        ) : (
          <p className="no-selection">Select a field to view properties</p>
        )}
      </div>
    </div>
  );
}

export default RightPanel;
