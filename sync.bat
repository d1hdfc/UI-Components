@echo off
echo ===========================================
echo   Figma Syncing & Auto GitHub Push Starts
echo ===========================================

echo [1/3] Fetching latest tokens and generating updates from Figma...
npm run sync-tokens

echo [2/3] Staging and Committing changes (including deletions)...
git add -A
git commit -m "auto-sync: update design tokens and remove deleted components"

echo [3/3] Pushing updates to GitHub...
git push origin main

echo ===========================================
echo   Sync Completed Successfully!
echo ===========================================
pause