import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddDataPage } from './AddDataPage';

const navigateMock = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

vi.mock('./editor/TipTapEditor', () => ({
    TipTapEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
        <textarea aria-label="details" value={value} onChange={(e) => onChange(e.target.value)} />
    ),
}));

vi.mock('./BatchImportModal', () => ({
    BatchImportContent: () => <div>Import</div>,
}));

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ darkMode: false }),
}));

vi.mock('../store/useToastStore', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

describe('AddDataPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('prevents double submit while save is in progress', async () => {
        let resolver: (() => void) | null = null;
        const onSave = vi.fn(() => new Promise<void>((resolve) => { resolver = resolve; }));

        render(<AddDataPage existingCards={[]} onSave={onSave as any} onImport={vi.fn()} />);

        const titleInput = screen.getByPlaceholderText('Titre du concept...');
        fireEvent.change(titleInput, { target: { value: 'Card title' } });

        const saveButton = screen.getByRole('button', { name: /enregistrer/i });
        fireEvent.click(saveButton);
        fireEvent.click(saveButton);

        expect(onSave).toHaveBeenCalledTimes(1);

        resolver?.();
        await waitFor(() => expect(toastSuccess).toHaveBeenCalled());
    });
});
