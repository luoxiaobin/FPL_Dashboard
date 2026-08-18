import pkg from '../../package.json';

export interface ReleaseIdentity {
  version: string;
  commitSha: string | null;
  shortCommitSha: string;
  environment: string;
  deploymentId: string | null;
  branch: string | null;
}

export function getReleaseIdentity(
  env: Record<string, string | undefined> = process.env,
): ReleaseIdentity {
  const commitSha = env.VERCEL_GIT_COMMIT_SHA || null;

  return {
    version: pkg.version,
    commitSha,
    shortCommitSha: commitSha?.slice(0, 7) ?? 'local',
    environment: env.VERCEL_ENV ?? env.NODE_ENV ?? 'development',
    deploymentId: env.VERCEL_DEPLOYMENT_ID || null,
    branch: env.VERCEL_GIT_COMMIT_REF || null,
  };
}
