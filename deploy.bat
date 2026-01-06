@echo off
REM Deployment Script for Gross ICT Website
REM Uses pscp/plink to deploy files to Hetzner

setlocal

set SSH_HOST=www662.your-server.de
set SSH_USER=jqviwy
set SSH_PASS=p1{EeZ=.CpV4
set SSH_PORT=22
set REMOTE_PATH=/
set LOCAL_PATH=dist\public

echo ================================================
echo   Gross ICT Website Deployment
echo ================================================
echo.

REM Check if dist\public exists
if not exist "%LOCAL_PATH%\" (
    echo ERROR: %LOCAL_PATH% not found!
    pause
    exit /b 1
)

echo [*] Found local files in: %LOCAL_PATH%
echo [*] Connecting to: %SSH_USER%@%SSH_HOST%
echo.

REM Step 1: Clean old files on server
echo [Step 1/3] Cleaning old files on server...
echo.

echo cd %REMOTE_PATH% > %TEMP%\clean.sh
echo rm -f index.html >> %TEMP%\clean.sh
echo rm -rf assets/ >> %TEMP%\clean.sh
echo rm -f manifest.webmanifest >> %TEMP%\clean.sh
echo rm -f favicon*.png favicon.ico >> %TEMP%\clean.sh
echo rm -f robots.txt sitemap.xml >> %TEMP%\clean.sh
echo rm -f logo*.png >> %TEMP%\clean.sh
echo rm -f sw.js registerSW.js >> %TEMP%\clean.sh
echo rm -f workbox-*.js >> %TEMP%\clean.sh
echo rm -f wcag-badge-*.png >> %TEMP%\clean.sh
echo echo "Cleanup complete" >> %TEMP%\clean.sh

echo y | plink.exe -ssh -P %SSH_PORT% -l %SSH_USER% -pw "%SSH_PASS%" %SSH_HOST% -m %TEMP%\clean.sh

if %errorlevel% neq 0 (
    echo WARNING: Some files could not be cleaned
)
echo.

REM Step 2: Upload new files
echo [Step 2/3] Uploading new files...
echo This may take several minutes...
echo.

echo y | pscp.exe -r -P %SSH_PORT% -pw "%SSH_PASS%" "%LOCAL_PATH%\*" %SSH_USER%@%SSH_HOST%:%REMOTE_PATH%/

if %errorlevel% neq 0 (
    echo ERROR: Upload failed!
    pause
    exit /b 1
)

echo.
echo [+] Files uploaded successfully!
echo.

REM Step 3: Set permissions
echo [Step 3/3] Setting file permissions...
echo.

echo cd %REMOTE_PATH% > %TEMP%\perms.sh
echo chmod 644 index.html 2^>^/dev^/null >> %TEMP%\perms.sh
echo chmod 755 assets 2^>^/dev^/null >> %TEMP%\perms.sh
echo find assets -type f -exec chmod 644 {} \; 2^>^/dev^/null >> %TEMP%\perms.sh
echo chmod 644 manifest.webmanifest favicon*.png robots.txt sitemap.xml 2^>^/dev^/null >> %TEMP%\perms.sh
echo echo "Permissions set" >> %TEMP%\perms.sh

echo y | plink.exe -ssh -P %SSH_PORT% -l %SSH_USER% -pw "%SSH_PASS%" %SSH_HOST% -m %TEMP%\perms.sh

echo.
echo [+] Permissions set!
echo.

echo ================================================
echo   Deployment Complete!
echo ================================================
echo.
echo Next steps:
echo 1. Clear your browser cache (Ctrl+Shift+Delete)
echo 2. Open https://gross-ict.ch in incognito mode
echo 3. Verify the website loads correctly
echo.
echo If issues persist:
echo - Try hard refresh: Ctrl+Shift+R
echo - Check browser console (F12) for errors
echo.

del %TEMP%\clean.sh 2>nul
del %TEMP%\perms.sh 2>nul

pause
