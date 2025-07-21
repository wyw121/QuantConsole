# Extract MinGW script

$zipFile = "$env:TEMP\mingw.7z"
$extractPath = "$env:USERPROFILE\mingw64"

Write-Host "Extracting MinGW-w64..." -ForegroundColor Green

try {
    if (!(Test-Path $extractPath)) {
        New-Item -ItemType Directory -Path $extractPath -Force
    }

    if (Get-Command tar -ErrorAction SilentlyContinue) {
        Write-Host "Using tar command..." -ForegroundColor Yellow
        tar -xf $zipFile -C $extractPath --strip-components=1
    } else {
        Write-Host "Please manually extract the 7z file" -ForegroundColor Yellow
        Write-Host "File location: $zipFile" -ForegroundColor Cyan
        Write-Host "Extract to: $extractPath" -ForegroundColor Cyan
        return
    }

    $binPath = "$extractPath\bin"
    if (Test-Path "$binPath\gcc.exe") {
        Write-Host "Extraction successful!" -ForegroundColor Green

        $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
        if ($currentPath -notlike "*$binPath*") {
            [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$binPath", "User")
            Write-Host "Added MinGW to user PATH" -ForegroundColor Green
        }

        Write-Host "Testing GCC compiler..." -ForegroundColor Yellow
        & "$binPath\gcc.exe" --version

    } else {
        Write-Host "Extraction failed" -ForegroundColor Red
    }

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
