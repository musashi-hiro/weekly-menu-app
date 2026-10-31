@echo off
chcp 65001 > nul
title こんだてウィークリー - 本番プレビュー版

echo ===================================================
echo   こんだてウィークリー (本番プレビュー版)
echo ===================================================
echo.
echo 最新のコードをビルドしています...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [エラー] ビルドに失敗しました。
    pause
    exit /b %errorlevel%
)

echo.
echo 本番プレビューサーバーを起動中...
echo 画面下に表示されるアドレスでアクセスできます。
echo.

REM 2秒後に自動でブラウザを開くバックグラウンド処理
start "" cmd /c "timeout /t 2 /nobreak > nul & start http://localhost:4173"

npm run preview
pause
