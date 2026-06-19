@echo off
rem Bypasses execution policy and forwards arguments to the powershell script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0ai-meridian-pipeline.ps1" %*
