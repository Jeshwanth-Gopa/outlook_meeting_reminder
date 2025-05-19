# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['meeting_reminder_wsgi.py'],
    pathex=[],
    binaries=[],
    datas=[('alarm/config.json', 'alarm'), ('alarm/ringtone.mp3', 'alarm')],
    hiddenimports=[
        'win32com',
        'win32com.client',
        'win32com.client.gencache',
        'win32com.client.dynamic',
        'win32com.client.makepy',
        'win32timezone',
        'pythoncom',
        'pywintypes',
        'apscheduler.schedulers.background',
        'apscheduler.triggers.interval',
        'apscheduler.triggers.date',
        'apscheduler.executors.pool',
        'apscheduler.jobstores.memory',
        'tkinter',
        'pygame',
        'pygame.mixer',
        'flask',
        'flask_cors',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='meeting_reminder_wsgi',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='meeting_reminder_wsgi',
)
