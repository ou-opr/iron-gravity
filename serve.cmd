@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [提示] 未检测到 node，直接打开 index.html（功能完全可用，双击即可）
  start "" "index.html"
  exit /b
)
echo 正在启动「铁引力」本地服务...
start "" "http://localhost:8642/"
node tools\serve.mjs 8642
