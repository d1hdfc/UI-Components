'use strict';

const { execSync } = require('node:child_process');

function runGit(cmd, cwd = process.cwd()) {
  try {
    return execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function getCurrentBranch(cwd = process.cwd()) {
  const branch = runGit('git branch --show-current', cwd);
  if (branch) return branch;

  const status = runGit('git status', cwd);
  if (status && status.includes('On branch master')) return 'master';
  if (status && status.includes('On branch main')) return 'main';

  return 'main';
}

function ensureRemoteOrigin(repoUrl, cwd = process.cwd()) {
  if (!repoUrl) return;
  const currentOrigin = runGit('git remote get-url origin', cwd);
  if (!currentOrigin) {
    runGit(`git remote add origin ${repoUrl}`, cwd);
  } else if (currentOrigin.trim() !== repoUrl.trim()) {
    runGit(`git remote set-url origin ${repoUrl}`, cwd);
    console.log(`[GitSync] Updated remote origin -> ${repoUrl}`);
  }
}

function hasGitChanges(cwd = process.cwd()) {
  const status = runGit('git status --porcelain', cwd);
  return Boolean(status && status.trim().length > 0);
}

function hasUnpushedCommits(branch, cwd = process.cwd()) {
  const unpushed = runGit(`git log origin/${branch}..HEAD --oneline`, cwd);
  if (unpushed === null) {
    // Remote branch may not exist yet on a brand new repo
    return true;
  }
  return Boolean(unpushed && unpushed.trim().length > 0);
}

function commitAndPush(message = 'auto-sync: update components from Figma', options = {}) {
  const cwd = options.cwd || process.cwd();
  const repoUrl = options.repoUrl || null;

  console.log(`[GitSync] Checking git status in ${cwd}...`);

  if (repoUrl) {
    ensureRemoteOrigin(repoUrl, cwd);
  }

  const branch = getCurrentBranch(cwd);
  const dirty = hasGitChanges(cwd);

  if (!dirty && !options.forcePush && !hasUnpushedCommits(branch, cwd)) {
    const remoteUrl = runGit('git remote get-url origin', cwd) || repoUrl || 'origin';
    console.log('[GitSync] Working tree clean and up to date with origin.');
    return {
      success: true,
      committed: false,
      pushed: false,
      branch,
      repoUrl: remoteUrl,
      message: 'Working tree clean — already up to date on GitHub'
    };
  }

  try {
    let committed = false;
    let fullMessage = message;

    if (dirty) {
      console.log('[GitSync] Staging all changes (git add -A)...');
      execSync('git add -A', { cwd, stdio: 'inherit' });
      runGit('git rm --cached --ignore-unmatch .env', cwd);

      if (hasGitChanges(cwd)) {
        fullMessage = `${message} [${new Date().toISOString()}]`;
        console.log(`[GitSync] Committing: "${fullMessage}"...`);
        execSync(`git commit -m "${fullMessage.replace(/"/g, '\\"')}"`, { cwd, stdio: 'inherit' });
        committed = true;
      }
    }

    const remoteUrl = runGit('git remote get-url origin', cwd) || repoUrl || 'origin';
    console.log(`[GitSync] Pushing to ${remoteUrl} (${branch})...`);

    try {
      execSync(`git push -u origin ${branch}`, { cwd, stdio: 'inherit' });
      console.log(`[GitSync] ✅ Successfully pushed to origin/${branch}`);
      return {
        success: true,
        committed,
        pushed: true,
        branch,
        repoUrl: remoteUrl,
        message: committed ? fullMessage : `Pushed latest commits to ${branch}`
      };
    } catch (pushErr) {
      console.warn(`[GitSync] Push to origin ${branch} failed, trying force-with-lease / master fallback...`);
      try {
        execSync(`git push -u origin ${branch} --force`, { cwd, stdio: 'inherit' });
        console.log(`[GitSync] ✅ Successfully pushed to origin/${branch}`);
        return {
          success: true,
          committed,
          pushed: true,
          branch,
          repoUrl: remoteUrl,
          message: committed ? fullMessage : `Pushed latest commits to ${branch}`
        };
      } catch (retryErr) {
        console.error('[GitSync] Git push encountered an error:', retryErr.message);
        return {
          success: false,
          committed,
          pushed: false,
          branch,
          repoUrl: remoteUrl,
          error: retryErr.message
        };
      }
    }
  } catch (error) {
    console.error('[GitSync] Git operation failed:', error.message);
    return {
      success: false,
      committed: false,
      pushed: false,
      branch,
      error: error.message
    };
  }
}

module.exports = {
  getCurrentBranch,
  ensureRemoteOrigin,
  hasGitChanges,
  commitAndPush
};
