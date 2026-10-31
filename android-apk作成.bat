@echo off
chcp 65001 > nul
title こんだてウィークリー - Android APKビルド

echo ===================================================
echo   こんだてウィークリー - Android APK作成スクリプト
echo ===================================================
echo.
echo [1/3] Webアセットをビルド中...
call npm run build
if %errorlevel% neq 0 (
    echo [エラー] Webビルドに失敗しました。
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Androidプロジェクトに反映中...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [エラー] Capacitor同期に失敗しました。
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Android APK（デバッグ版）をコンパイル中...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo ---------------------------------------------------
    echo ※ gradlewでのビルドに失敗した場合、以下のいずれかが原因です:
    echo   1. Java (JDK) が環境変数に設定されていない
    echo   2. Android Studioが未インストール
    echo.
    echo その場合は、Android Studioで開いてビルドしてください:
    echo   npx cap open android
    echo ---------------------------------------------------
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..

echo.
echo ===================================================
echo 【成功】APKファイルの作成が完了しました！
echo.
echo 完成ファイル:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo このファイルをAndroid端末に送る（GoogleドライブやUSB経由など）と、
echo 実機スマホにインストールして試すことができます。
echo ===================================================
pause
