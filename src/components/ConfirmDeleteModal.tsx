import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
    title: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ title, onConfirm, onCancel }) => {
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="confirm-modal">
                <div className="confirm-icon">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="confirm-title">Supprimer cette fiche ?</h3>
                <p className="confirm-message">
                    La fiche "<strong>{title}</strong>" sera définitivement supprimée.
                </p>
                <div className="confirm-actions">
                    <button className="btn-secondary" onClick={onCancel}>
                        Annuler
                    </button>
                    <button className="btn-danger" onClick={onConfirm}>
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
};
