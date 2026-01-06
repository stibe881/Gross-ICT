# Simple Deployment Script for Gross ICT Website
# Uses WinSCP or SFTP to deploy files

param(
    [Parameter(Mandatory = $true)]
    [string]$SshHost,
    
    [Parameter(Mandatory = $true)]
    [string]$SshUser,
    
    [Parameter(Mandatory = $true)]
    [string]$SshPassword,
    
    [Parameter(Mandatory = $false)]
    [string]$RemotePath = "/",
    
    [Parameter(Mandatory = $false)]
    [int]$SshPort = 22
)

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Gross ICT Website Deployment" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Get paths
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicPath = Join-Path $scriptPath "dist\public"

# Verify dist/public exists
if (-not (Test-Path $publicPath)) {
    Write-Host "ERROR: dist/public folder not found!" -ForegroundColor Red
    Write-Host "Path checked: $publicPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Found local files in: $publicPath" -ForegroundColor Green
$fileCount = (Get-ChildItem -Path $publicPath -Recurse -File | Measure-Object).Count
Write-Host "✓ Total files to upload: $fileCount" -ForegroundColor Green
Write-Host ""
Write-Host "Connecting to: $SshUser@$SshHost" -ForegroundColor Yellow
Write-Host ""

# Use WinSCP if available, otherwise fall back to pscp
$winscpPath = Get-Command winscp.com -ErrorAction SilentlyContinue

if ($winscpPath) {
    Write-Host "Using WinSCP for deployment..." -ForegroundColor Cyan
    
    # Create WinSCP script
    $tempPath = Join-Path $env:TEMP "gross-ict-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $tempPath -Force | Out-Null
    
    $scriptFile = Join-Path $tempPath "winscp-script.txt"
    
    @"
option batch abort
option confirm off
open sftp://${SshUser}:${SshPassword}@${SshHost}:${SshPort}
cd $RemotePath
lcd "$publicPath"
rm index.html
rmdir assets
rm manifest.webmanifest
rm favicon*.png
rm favicon.ico
rm robots.txt
rm sitemap.xml
rm logo*.png
rm sw.js
rm registerSW.js
rm workbox-*.js
rm wcag-badge-*.png
put -resume *
chmod 644 index.html
chmod 755 assets
exit
"@ | Out-File -FilePath $scriptFile -Encoding ASCII
    
    # Execute WinSCP
    & winscp.com /script="$scriptFile"
    
    Remove-Item -Recurse -Force $tempPath -ErrorAction SilentlyContinue
    
}
else {
    # Try pscp (PuTTY)
    $pscpPath = Get-Command pscp.exe -ErrorAction SilentlyContinue
   
    if (-not $pscpPath) {
        Write-Host "ERROR: Neither WinSCP nor pscp.exe found!" -ForegroundColor Red
        Write-Host "Please install one of:" -ForegroundColor Yellow
        Write-Host "  1. WinSCP: https://winscp.net/" -ForegroundColor Yellow
        Write-Host "  2. PuTTY (includes pscp): https://www.putty.org/" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Or run this command to install WinSCP via winget:" -ForegroundColor Yellow
        Write-Host "  winget install WinSCP.WinSCP" -ForegroundColor White
        exit 1
    }
    
    Write-Host "Using PuTTY pscp for deployment..." -ForegroundColor Cyan
    Write-Host ""
    
    # Create temp directory
    $tempPath = Join-Path $env:TEMP "gross-ict-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $tempPath -Force | Out-Null
    
    # Step 1: Clean old files
    Write-Host "Step 1: Cleaning old files on server..." -ForegroundColor Cyan
    
    $cleanScript = Join-Path $tempPath "clean.sh"
    @"
cd $RemotePath
rm -f index.html
rm -rf assets/
rm -f manifest.webmanifest
rm -f favicon*.png favicon.ico
rm -f robots.txt sitemap.xml
rm -f logo*.png
rm -f sw.js registerSW.js
rm -f workbox-*.js
rm -f wcag-badge-*.png
echo "Cleanup complete"
"@ | Out-File -FilePath $cleanScript -Encoding ASCII -NoNewline
    
    $plinkPath = Get-Command plink.exe -ErrorAction SilentlyContinue
    if ($plinkPath) {
        echo y | & plink.exe -ssh -P $SshPort -l $SshUser -pw "$SshPassword" $SshHost -m "$cleanScript"
    }
    
    Write-Host "✓ Old files cleaned" -ForegroundColor Green
    Write-Host ""
    
    # Step 2: Upload new files
    Write-Host "Step 2: Uploading new files..." -ForegroundColor Cyan
    Write-Host "This may take several minutes..." -ForegroundColor Yellow
    Write-Host ""
    
    # Upload files recursively
    echo y | & pscp.exe -r -P $SshPort -pw "$SshPassword" "$publicPath\*" "${SshUser}@${SshHost}:${RemotePath}/"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Files uploaded successfully!" -ForegroundColor Green
    }
    else {
        Write-Host ""
        Write-Host "WARNING: Upload completed with exit code $LASTEXITCODE" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "Step 3: Setting file permissions..." -ForegroundColor Cyan
    
    $permScript = Join-Path $tempPath "permissions.sh"
    @"
cd $RemotePath
chmod 644 index.html 2>/dev/null
chmod 755 assets 2>/dev/null
find assets -type f -exec chmod 644 {} \; 2>/dev/null
chmod 644 manifest.webmanifest favicon*.png robots.txt sitemap.xml 2>/dev/null
echo "Permissions set"
"@ | Out-File -FilePath $permScript -Encoding ASCII -NoNewline
    
    if ($plinkPath) {
        echo y | & plink.exe -ssh -P $SshPort -l $SshUser -pw "$SshPassword" $SshHost -m "$permScript"
    }
    
    Write-Host "✓ Permissions set" -ForegroundColor Green
    
    # Cleanup
    Remove-Item -Recurse -Force $tempPath -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete! ✓" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear your browser cache (Ctrl+Shift+Delete)" -ForegroundColor White
Write-Host "2. Open https://gross-ict.ch in incognito mode" -ForegroundColor White
Write-Host "3. Verify the website loads correctly" -ForegroundColor White
Write-Host ""
Write-Host "If issues persist:" -ForegroundColor Yellow
Write-Host "- Try hard refresh: Ctrl+Shift+R" -ForegroundColor White
Write-Host "- Check browser console (F12) for errors" -ForegroundColor White
Write-Host ""
