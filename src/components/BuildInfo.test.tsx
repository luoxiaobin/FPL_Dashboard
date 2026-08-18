import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import BuildInfo from './BuildInfo';

afterEach(cleanup);

describe('BuildInfo', () => {
  it('shows an exact release and deployment identity', () => {
    render(<BuildInfo release={{
      version: '0.6.0',
      commitSha: 'abcdef1234567890',
      shortCommitSha: 'abcdef1',
      environment: 'production',
      branch: 'master',
      deploymentId: 'dpl_example',
    }} />);

    fireEvent.click(screen.getByRole('button', { name: /Release v0.6.0/ }));

    expect(screen.getAllByText('v0.6.0').length).toBeGreaterThan(0);
    expect(screen.getByText('production')).toBeTruthy();
    expect(screen.getByText('abcdef1')).toBeTruthy();
    expect(screen.getByText('dpl_example')).toBeTruthy();
  });
});
