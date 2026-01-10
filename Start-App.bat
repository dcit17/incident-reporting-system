@echo off
echo Starting Intervention Site in Docker...
echo Making sure Docker Desktop is running...

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker is NOT running. Please start Docker Desktop and try again.
    pause
    exit /b
)

echo Building and Starting Containers...
docker-compose up --build -d

if %errorlevel% neq 0 (
    echo Failed to start containers. Check the output above.
    pause
    exit /b
)

echo.
echo Application started successfully!
echo Frontend: http://localhost
echo.
echo You can manage the app (Stop/Restart) from your Docker Desktop Dashboard.
echo.
pause
