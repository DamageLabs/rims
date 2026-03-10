import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EmptyState from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<MemoryRouter><EmptyState title="No items found" /></MemoryRouter>);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<MemoryRouter><EmptyState title="Empty" description="Add some items" /></MemoryRouter>);
    expect(screen.getByText('Add some items')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    const { container } = render(<MemoryRouter><EmptyState title="Empty" /></MemoryRouter>);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('renders link action when actionPath provided', () => {
    render(
      <MemoryRouter>
        <EmptyState title="Empty" actionLabel="Add Item" actionPath="/items/new" />
      </MemoryRouter>
    );
    const link = screen.getByText('Add Item');
    expect(link.closest('a')).toHaveAttribute('href', '/items/new');
  });

  it('renders button action when onAction provided', () => {
    const onAction = vi.fn();
    render(
      <MemoryRouter>
        <EmptyState title="Empty" actionLabel="Retry" onAction={onAction} />
      </MemoryRouter>
    );
    screen.getByText('Retry').click();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('does not render action when no label provided', () => {
    render(<MemoryRouter><EmptyState title="Empty" /></MemoryRouter>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
