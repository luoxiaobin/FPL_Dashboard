import { describe, expect, it } from 'vitest';
import { getReleaseIdentity } from './release';

describe('getReleaseIdentity', () => {
  it('combines the product version with Vercel deployment metadata', () => {
    expect(getReleaseIdentity({
      VERCEL_ENV: 'production',
      VERCEL_GIT_COMMIT_SHA: 'abcdef1234567890',
      VERCEL_GIT_COMMIT_REF: 'master',
      VERCEL_DEPLOYMENT_ID: 'dpl_example',
    })).toEqual({
      version: '0.6.8',
      commitSha: 'abcdef1234567890',
      shortCommitSha: 'abcdef1',
      environment: 'production',
      deploymentId: 'dpl_example',
      branch: 'master',
    });
  });

  it('uses readable local fallbacks', () => {
    expect(getReleaseIdentity({ NODE_ENV: 'development' })).toMatchObject({
      version: '0.6.8',
      commitSha: null,
      shortCommitSha: 'local',
      environment: 'development',
      deploymentId: null,
      branch: null,
    });
  });
});
