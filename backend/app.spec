# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_dynamic_libs
from PyInstaller.utils.hooks import collect_submodules

binaries = [('./libusb-1.0.dylib', '.')]
hiddenimports = ['configparser', 'six', 'dependency_injector.errors', 'hwilib.devices.trezor', 'hwilib.devices.ledger', 'hwilib.devices.keepkey', 'hwilib.devices.digitalbitbox', 'hwilib.devices.coldcard', 'hwilib.devices.bitbox02', 'hwilib.devices.jade']
binaries += collect_dynamic_libs('bdkpython')
binaries += collect_dynamic_libs('hwi')
hiddenimports += collect_submodules('bdkpython')
hiddenimports += collect_submodules('hwi')


a = Analysis(
    ['src/app.py'],
    pathex=[],
    binaries=binaries,
    datas=[('./venv/lib/python3.10/site-packages/bitcoinlib/config', 'bitcoinlib/config')],
    hiddenimports=hiddenimports,
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
    a.binaries,
    a.datas,
    [],
    name='app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
app = BUNDLE(
    exe,
    name='app.app',
    icon=None,
    bundle_identifier=None,
)
