import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastComponent from './Toast';
import type { Toast } from './Toast';

const makeToast = (overrides: Partial<Toast> = {}): Toast => ({
  id: 'test-1',
  message: 'Hello world',
  type: 'info',
  ...overrides,
});

describe('ToastComponent', () => {
  it('should render the message', () => {
    render(<ToastComponent toast={makeToast()} onClose={vi.fn()} />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<ToastComponent toast={makeToast({ id: 'abc' })} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledWith('abc');
  });

  it('should have role="alert" for accessibility', () => {
    render(<ToastComponent toast={makeToast()} onClose={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render success icon for success type', () => {
    render(<ToastComponent toast={makeToast({ type: 'success' })} onClose={vi.fn()} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('should render error icon for error type', () => {
    render(<ToastComponent toast={makeToast({ type: 'error' })} onClose={vi.fn()} />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('should render warning icon for warning type', () => {
    render(<ToastComponent toast={makeToast({ type: 'warning' })} onClose={vi.fn()} />);
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('should call onClose automatically after the duration', async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<ToastComponent toast={makeToast({ id: 'timed', duration: 1000 })} onClose={onClose} />);
    vi.advanceTimersByTime(1000);
    expect(onClose).toHaveBeenCalledWith('timed');
    vi.useRealTimers();
  });
});
