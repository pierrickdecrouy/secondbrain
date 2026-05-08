import React from 'react';
import { Warning } from '@phosphor-icons/react';

interface ConfirmDeleteModalProps {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
    heading?: string;
    message?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmClassName?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    title,
    onConfirm,
    onCancel,
    heading = 'Supprimer cette fiche ?',
    message,
    confirmLabel = 'Supprimer',
    cancelLabel = 'Annuler',
    confirmClassName = 'btn-danger'
}) => {
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="confirm-modal">
                <div className="confirm-icon">
                    <Warning size={32} />
                </div>
                <h3 className="confirm-title">{heading}</h3>
                <p className="confirm-message">
                    {message ?? <>La fiche "<strong>{title}</strong>" sera définitivement supprimée.</>}
                </p>
                <div className="confirm-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button className={confirmClassName} onClick={onConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
