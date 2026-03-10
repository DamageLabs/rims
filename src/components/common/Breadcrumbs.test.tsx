import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('Breadcrumbs', () => {
  it('renders home icon link', () => {
    renderWithRouter(<Breadcrumbs items={[]} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('renders single breadcrumb as active', () => {
    renderWithRouter(<Breadcrumbs items={[{ label: 'Items' }]} />);
    expect(screen.getByText('Items')).toBeInTheDocument();
  });

  it('renders intermediate items as links', () => {
    renderWithRouter(
      <Breadcrumbs items={[{ label: 'Items', path: '/items' }, { label: 'Detail' }]} />
    );
    expect(screen.getByText('Items')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });

  it('renders last item as active (not a link)', () => {
    renderWithRouter(
      <Breadcrumbs items={[{ label: 'Items', path: '/items' }, { label: 'Detail' }]} />
    );
    const detail = screen.getByText('Detail');
    expect(detail.closest('a')).toBeNull();
  });
});
