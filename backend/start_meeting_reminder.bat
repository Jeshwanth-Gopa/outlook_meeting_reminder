@echo off
cd /d %~dp0
call venv\Scripts\activate.bat
python meeting_reminder_wsgi.py