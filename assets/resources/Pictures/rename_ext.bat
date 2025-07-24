@echo off

REM 检查参数数量
IF "%~1"=="" (
    echo 用法: %~nx0 ^<目录路径^>
    echo 示例: %~nx0 "C:\Users\User\logs"
    exit /b 1
)


echo 修改完成。
