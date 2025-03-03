import React from 'react';

const DeleteModal = ({ deleteConfirm, handleDelete, cancelDelete }) => {
  if (!deleteConfirm) return null;
  
  return (
    <div className="delete-modal-backdrop">
      <div className="delete-modal">
        <h3>Confirm Deletion</h3>
        <p>Are you sure you want to delete "{deleteConfirm.quiz_name}"?</p>
        <p>This action cannot be undone.</p>
        <div className="delete-modal-actions">
          <button 
            onClick={() => handleDelete(deleteConfirm)} 
            className="confirm-delete-btn"
          >
            Yes, Delete
          </button>
          <button 
            onClick={cancelDelete} 
            className="cancel-delete-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
