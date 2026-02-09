import { useState, useCallback } from 'react';

/**
 * Custom hook for managing document editor modal state and operations
 * Provides a clean interface for opening, closing, and managing document edits
 */
const useDocumentEditor = (onDataRefresh) => {
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const openEditor = useCallback((document) => {
    setSelectedDocument(document);
    setShowEditorModal(true);
  }, []);

  const closeEditor = useCallback(() => {
    setShowEditorModal(false);
    setSelectedDocument(null);
  }, []);

  const saveDocument = useCallback(async (updatedDoc) => {
    setIsLoading(true);
    try {
      // Trigger data refresh callback if provided
      if (onDataRefresh) {
        await onDataRefresh();
      }
      closeEditor();
    } catch (error) {
      console.error('Error refreshing data after save:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onDataRefresh, closeEditor]);

  return {
    showEditorModal,
    selectedDocument,
    isLoading,
    openEditor,
    closeEditor,
    saveDocument,
  };
};

export default useDocumentEditor;
