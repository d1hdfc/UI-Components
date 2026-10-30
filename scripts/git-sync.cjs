'use strict';

const { execSync } = require('node:child_process');

function runGit(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (error) {
    return null;
  }
}

function getCurrentBranch() {
  const branch = runGit('git branch --show-current');
  if (branch) return branch;

  // Fallback check
  const status = runGit('git status');
  if (status && status.includes('On branch master')) return 'master';
  if (status && status.includes('On branch main')) return 'main';

  return 'main';
}

function hasGitChanges() {
  const status = runGit('git status --porcelain');
  return Boolean(status && status.trim().length > 0);
}

function commitAndPush(message = 'auto-sync: update components from Figma') {
  console.log('[GitSync] Checking git status...');

  if (!hasGitChanges()) {
    console.log('[GitSync] Working tree clean. Nothing to commit.');
    return { success: true, committed: false, message: 'Nothing to commit' };
  }

  try {
    console.log('[GitSync] Staging changes...');
    execSync('git add -A', { stdio: 'inherit' });

    const fullMessage = `${message} [${new Date().toISOString()}]`;
    console.log(`[GitSync] Committing: "${fullMessage}"...`);
    execSync(`git commit -m "${fullMessage}"`, { stdio: 'inherit' });

    const branch = getCurrentBranch();
    console.log(`[GitSync] Pushing to origin ${branch}...`);

    try {
      execSync(`git push origin ${branch}`, { stdio: 'inherit' });
      console.log(`[GitSync] Successfully pushed to origin ${branch}`);
    } catch (pushErr) {
      console.warn(`[GitSync] Push to origin ${branch} failed, trying master branch...`);
      try {
        execSync('git push origin master', { stdio: 'inherit' });
        console.log('[GitSync] Successfully pushed to origin master');
      } catch (masterErr) {
        console.error('[GitSync] Git push encountered an error:', pushErr.message);
        return { success: false, committed: true, error: pushErr.message };
      }
    }

    return { success: true, committed: true, message: fullMessage };
  } catch (error) {
    console.error('[GitSync] Git operation failed:', error.message);
    return { success: false, committed: false, error: error.message };
  }
}

module.exports = {
  getCurrentBranch,
  hasGitChanges,
  commitAndPush
};
