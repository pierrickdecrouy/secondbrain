import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardItem } from './CardItem';
import { Card } from '../types';

vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({ 
        theme: 'light',
        getCategoryIcon: vi.fn(() => 'test-icon'),
        getCategoryColor: vi.fn(() => 'test-color')
    })
}));

describe('CardItem', () => {
    const mockCard: Card = {
        id: '1',
        title: 'Test <script>alert("XSS")</script> <strong>Title</strong>',
        subtitle: 'Test Subtitle',
        content: 'Test Content with **markdown**',
        type: 'concept',
        nodeType: 'card',
        parentId: null,
        tags: [],
        createdAt: 0,
        updatedAt: 0,
    };

    it('renders card title (sanitized) and subtitle', () => {
        render(<CardItem card={mockCard} onClick={() => {}} />);
        
        // title should have the strong tag, but the script tag should be removed
        const titleElement = screen.getByRole('heading', { level: 3 });
        expect(titleElement.innerHTML).toContain('Test ');
        expect(titleElement.innerHTML).toContain('<strong>Title</strong>');
        expect(titleElement.innerHTML).not.toContain('<script>');
        
        expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
        expect(screen.getByText('Test Content with markdown')).toBeInTheDocument();
    });

    it('calls onClick when the card is clicked', () => {
        const onClickMock = vi.fn();
        const { container } = render(<CardItem card={mockCard} onClick={onClickMock} />);
        
        const cardDiv = container.firstChild as HTMLElement;
        fireEvent.click(cardDiv);
        
        expect(onClickMock).toHaveBeenCalledWith(mockCard);
        expect(onClickMock).toHaveBeenCalledTimes(1);
    });

    it('renders edit button and calls onEdit when clicked', () => {
        const onEditMock = vi.fn();
        const onClickMock = vi.fn();
        
        render(<CardItem card={mockCard} onClick={onClickMock} onEdit={onEditMock} />);
        
        const editButton = screen.getByTitle('Modifier');
        fireEvent.click(editButton);
        
        expect(onEditMock).toHaveBeenCalledWith(mockCard);
        // The click should stop propagation, so onClick shouldn't be called
        expect(onClickMock).not.toHaveBeenCalled();
    });

    it('renders delete button and calls onDelete when clicked', () => {
        const onDeleteMock = vi.fn();
        const onClickMock = vi.fn();
        
        render(<CardItem card={mockCard} onClick={onClickMock} onDelete={onDeleteMock} />);
        
        const deleteButton = screen.getByTitle('Supprimer');
        fireEvent.click(deleteButton);
        
        expect(onDeleteMock).toHaveBeenCalledWith(mockCard);
        expect(onClickMock).not.toHaveBeenCalled();
    });
});
