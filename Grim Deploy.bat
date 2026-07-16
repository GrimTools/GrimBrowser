@echo off
chcp 65001 >nul
title Grim Deploy Console
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0grim-deploy.ps1"
pause
