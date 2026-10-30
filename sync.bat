@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo   HDFC UI Components — Two-Way Real-Time Auto-Sync System
echo =========================================================

REM Check command line arguments
if "%1"=="--server" goto run_server
if "%1"=="--watch" goto run_server
if "%1"=="-w" goto run_server
if "%1"=="--figma-to-code" goto figma_to_code
if "%1"=="--code-to-figma" goto code_to_figma
if "%1"=="--generate-all" goto generate_all
if "%1"=="--webhook-list" goto webhook_list
if "%1"=="--webhook-create" goto webhook_create
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

echo Mode: One-time Bi-directional Auto-Sync ^& GitHub Push
echo.

echo [1/4] Syncing design tokens from Figma REST API...
call npm run sync-tokens
if %errorlevel% neq 0 (
    echo [WARNING] Token sync encountered warnings. Proceeding with component sync...
)

echo.
echo [2/4] Executing Two-Way Component Auto-Sync (React, Flutter, HTML/CSS)...
node scripts/cli-sync.cjs --all
if %errorlevel% neq 0 (
    echo [ERROR] Component auto-sync failed.
    goto sync_failed
)

echo.
echo [3/4] Updating Figma Component Catalog preview assets...
call npm run figma:components:sync

echo.
echo [4/4] Staging, Committing, and Pushing changes to GitHub...
call git add -A
git diff-index --quiet HEAD --
if %errorlevel% equ 0 (
    echo [Git] No uncommitted changes detected. Working tree clean.
) else (
    for /f "tokens=*" %%g in ('git branch --show-current') do set "GIT_BRANCH=%%g"
    if "!GIT_BRANCH!"=="" set "GIT_BRANCH=main"
    
    echo [Git] Committing changes on branch !GIT_BRANCH!...
    git commit -m "auto-sync: bi-directional Figma <-> Code sync (React, Flutter, HTML/CSS)"
    
    echo [Git] Pushing to origin !GIT_BRANCH!...
    git push origin !GIT_BRANCH!
    if !errorlevel! neq 0 (
        echo [Git] Push to origin !GIT_BRANCH! failed, attempting push to origin master...
        git push origin master
    )
)

echo.
echo =========================================================
echo   Two-Way Auto-Sync Completed Successfully!
echo =========================================================
echo Tip: To keep two-way sync running in real-time, execute:
echo      sync.bat --server
echo.
pause
exit /b 0

:run_server
echo.
echo [Server] Starting Two-Way Real-Time Auto-Sync Daemon Server...
echo [Server] - Figma Webhook listener on http://localhost:3055/api/webhook
echo [Server] - WebSocket Bridge on ws://localhost:3055
echo [Server] - Code file watcher on src/components/
echo [Server] - Background Figma REST API poller active
echo.
node scripts/figma-sync-server.cjs
exit /b 0

:figma_to_code
echo.
echo [Sync] Running Figma to Code sync...
node scripts/cli-sync.cjs --figma-to-code --commit
exit /b 0

:code_to_figma
echo.
echo [Sync] Running Code to Figma sync...
node scripts/cli-sync.cjs --code-to-figma
exit /b 0

:generate_all
echo.
echo [CodeGen] Generating React, Flutter, and HTML/CSS for all components...
node scripts/cli-sync.cjs --generate-existing
exit /b 0

:webhook_list
node scripts/webhook-manager.cjs list
exit /b 0

:webhook_create
if "%2"=="" (
    echo [ERROR] Webhook endpoint URL required.
    echo Usage: sync.bat --webhook-create https://your-domain.com/api/webhook [passcode]
    exit /b 1
)
node scripts/webhook-manager.cjs create %2 %3
exit /b 0

:show_help
echo Usage: sync.bat [option]
echo.
echo Options:
echo   (no args)             Run full bi-directional sync and push to GitHub
echo   --server, --watch     Start the real-time background sync server (Webhooks + WebSocket)
echo   --figma-to-code       Sync added/updated/deleted components from Figma to Code
echo   --code-to-figma       Sync local code changes back to Figma canvas / dev resources
echo   --generate-all        Generate Flutter and HTML/CSS for all existing components
echo   --webhook-list        List registered Figma webhooks
echo   --webhook-create ^<url^> Register a new Figma webhook endpoint
echo   --help, -h            Show this help dialog
exit /b 0

:sync_failed
echo.
echo =========================================================
echo   Auto-Sync Failed! Please check the logs above.
echo =========================================================
pause
exit /b 1
