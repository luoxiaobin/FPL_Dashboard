import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import GwModeIndicator from './GwModeIndicator';

afterEach(() => cleanup());

describe('GwModeIndicator', () => {
  it('renders LIVE text when mode is live', () => {
    render(<GwModeIndicator mode="live" onOverride={() => {}} />);
    expect(screen.getByText(/live/i)).toBeTruthy();
  });

  it('renders PLANNING text when mode is planning', () => {
    render(<GwModeIndicator mode="planning" onOverride={() => {}} />);
    expect(screen.getByText(/planning/i)).toBeTruthy();
  });

  it('calls onOverride with "planning" when live badge is clicked', () => {
    const spy = vi.fn();
    render(<GwModeIndicator mode="live" onOverride={spy} />);
    fireEvent.click(screen.getByRole('button', { name: /live/i }));
    expect(spy).toHaveBeenCalledWith('planning');
  });

  it('calls onOverride with "live" when planning badge is clicked', () => {
    const spy = vi.fn();
    render(<GwModeIndicator mode="planning" onOverride={spy} />);
    fireEvent.click(screen.getByRole('button', { name: /planning/i }));
    expect(spy).toHaveBeenCalledWith('live');
  });

  it('has an accessible aria-label describing current mode', () => {
    render(<GwModeIndicator mode="live" onOverride={() => {}} />);
    const btn = screen.getByRole('button', { name: /live/i });
    expect(btn.getAttribute('aria-label')).toMatch(/live/i);
  });
});
