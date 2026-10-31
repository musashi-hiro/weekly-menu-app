@echo off
chcp 65001 > nul
title こんだてウィークリー - アプリ起動中

echo ===================================================
echo   こんだてウィークリー (Weekly Menu Planner)
echo   アプリを起動しています...
echo ===================================================
echo.
echo [1] 開発サーバーを起動中...
echo [2] 自動的にブラウザが開きます（http://localhost:5173）
echo.
echo ---------------------------------------------------
echo 【スマホから試す場合】
echo パソコンと同じWi-Fi（無線LAN）にスマホを繋いで、
echo 画面下に表示される「Network: http://192.168.x.x:5173」
echo のアドレスをスマホのブラウザ（Safari/Chrome）に入力してください。
echo ---------------------------------------------------
echo.
echo ※ アプリを終了するときは、このウィンドウを閉じるか、
echo   キーボードで [Ctrl] + [C] を押してください。
echo ===================================================
echo.

REM 2秒後に自動でブラウザを開くバックグラウンド処理
start "" cmd /c "timeout /t 2 /nobreak > nul & start http://localhost:5173"

REM Viteサーバーを外部ホスト許可で起動
npm run dev:host
pause
