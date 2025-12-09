@echo off
REM Build and Push Docker Images to Docker Hub
REM Make sure Docker Desktop is running before executing

echo ====================================
echo Building and Pushing Docker Images
echo ====================================
echo.

set DOCKER_USERNAME=kenzen92
set BACKEND_IMAGE=%DOCKER_USERNAME%/kennysolutions-backend
set FRONTEND_IMAGE=%DOCKER_USERNAME%/kennysolutions-frontend

echo Docker Username: %DOCKER_USERNAME%
echo Backend Image: %BACKEND_IMAGE%:latest
echo Frontend Image: %FRONTEND_IMAGE%:latest
echo.

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [1/6] Logging into Docker Hub...
docker login
if errorlevel 1 (
    echo ERROR: Docker login failed
    pause
    exit /b 1
)

echo.
echo [2/6] Building backend image...
cd backend
docker build -t %BACKEND_IMAGE%:latest -f Dockerfile .
if errorlevel 1 (
    echo ERROR: Backend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [3/6] Pushing backend image to Docker Hub...
docker push %BACKEND_IMAGE%:latest
if errorlevel 1 (
    echo ERROR: Backend push failed
    pause
    exit /b 1
)

echo.
echo [4/6] Building frontend image...
cd frontend
docker build -t %FRONTEND_IMAGE%:latest -f Dockerfile .
if errorlevel 1 (
    echo ERROR: Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/6] Pushing frontend image to Docker Hub...
docker push %FRONTEND_IMAGE%:latest
if errorlevel 1 (
    echo ERROR: Frontend push failed
    pause
    exit /b 1
)

echo.
echo [6/6] Verifying images...
docker images | findstr lessonbase

echo.
echo ====================================
echo SUCCESS! Images pushed to Docker Hub
echo ====================================
echo.
echo Backend: https://hub.docker.com/r/%DOCKER_USERNAME%/kennysolutions-backend
echo Frontend: https://hub.docker.com/r/%DOCKER_USERNAME%/kennysolutions-frontend
echo.
echo Next steps:
echo 1. Update your .env file on VPS with DOCKER_USERNAME=kenzen92
echo 2. Deploy to VPS using docker-compose.vps.yml
echo.
pause
