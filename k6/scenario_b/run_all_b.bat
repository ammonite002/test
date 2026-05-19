@echo off
REM ============================================
REM Scenario B - 5-stage automated load test
REM   매 set: API/Chat EC2 restart + Clear DB + k6
REM ============================================

SET PEM_PATH=C:\Users\User\Downloads\nearby-key.pem
SET EC2_HOST_API=ubuntu@13.209.144.78
SET EC2_HOST_CHAT=ubuntu@3.35.49.125
SET COMPOSE_DIR=back
SET CLEAR_SQL_LOCAL=/home/ubuntu/clear_posts.sql

if not exist "%PEM_PATH%" (
    echo [ERROR] PEM file not found: %PEM_PATH%
    pause
    exit /b 1
)

if not exist results_b mkdir results_b

echo Start: %DATE% %TIME% > results_b\_run_log.txt

for /L %%i in (0,1,9) do (
    call :run_one %%i smoke   scenario_b_smoke.js
    call :run_one %%i load    scenario_b_load.js
    call :run_one %%i stress  scenario_b_stress.js
    call :run_one %%i break   scenario_b_break.js
)

echo End: %DATE% %TIME% >> results_b\_run_log.txt
pause
exit /b 0


:run_one
echo.
echo  Run %1 / 10  -  %2  (%DATE% %TIME%)
echo Run %1 %2 start: %DATE% %TIME% >> results_b\_run_log.txt

echo [1/5] Restarting API EC2 containers...
ssh -i "%PEM_PATH%" -o StrictHostKeyChecking=no %EC2_HOST_API% "cd %COMPOSE_DIR% && docker-compose restart"
if errorlevel 1 echo [WARN] API SSH restart failed.

echo [2/5] Restarting Chat EC2 container...
ssh -i "%PEM_PATH%" -o StrictHostKeyChecking=no %EC2_HOST_CHAT% "cd %COMPOSE_DIR% && docker-compose -f docker-compose.chat.yml restart"
if errorlevel 1 echo [WARN] Chat SSH restart failed.

echo [3/5] Waiting 60s for server stabilization...
timeout /t 60 /nobreak > nul

echo [4/5] Clearing DB (posts^>500, messages^>5000)...
ssh -i "%PEM_PATH%" -o StrictHostKeyChecking=no %EC2_HOST_API% "docker cp %CLEAR_SQL_LOCAL% nearby-mysql:/tmp/clear_posts.sql && docker exec nearby-mysql mysql -uroot -pnearby --default-character-set=utf8mb4 placesns -e \"SOURCE /tmp/clear_posts.sql;\""
if errorlevel 1 echo [WARN] DB clear failed.

echo [5/5] Running k6: %3
k6 run --summary-export=results_b\run%1_%2.json %3 > results_b\run%1_%2.html

echo Run %1 %2 done: %DATE% %TIME% >> results_b\_run_log.txt
exit /b 0
