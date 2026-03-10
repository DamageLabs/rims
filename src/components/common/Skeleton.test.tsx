import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Skeleton, { SkeletonTable, SkeletonCard, SkeletonDetailPage } from './Skeleton';

describe('Skeleton', () => {
  it('renders single skeleton element by default', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(1);
  });

  it('renders multiple elements with count prop', () => {
    const { container } = render(<Skeleton count={3} />);
    expect(container.querySelectorAll('.skeleton')).toHaveLength(3);
  });

  it('applies variant class', () => {
    const { container } = render(<Skeleton variant="circular" />);
    expect(container.querySelector('.skeleton-circular')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="mb-2" />);
    expect(container.querySelector('.mb-2')).toBeInTheDocument();
  });

  it('sets width and height style from number props', () => {
    const { container } = render(<Skeleton width={100} height={20} />);
    const el = container.querySelector('.skeleton') as HTMLElement;
    expect(el.style.width).toBe('100px');
    expect(el.style.height).toBe('20px');
  });

  it('sets width and height style from string props', () => {
    const { container } = render(<Skeleton width="50%" height="1rem" />);
    const el = container.querySelector('.skeleton') as HTMLElement;
    expect(el.style.width).toBe('50%');
    expect(el.style.height).toBe('1rem');
  });
});

describe('SkeletonTable', () => {
  it('renders with default rows and columns', () => {
    render(<SkeletonTable />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom number of rows', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />);
    expect(container.querySelectorAll('.skeleton-table-row')).toHaveLength(3);
  });
});

describe('SkeletonCard', () => {
  it('renders with loading status', () => {
    render(<SkeletonCard />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('SkeletonDetailPage', () => {
  it('renders with loading status', () => {
    render(<SkeletonDetailPage />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading item details');
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
