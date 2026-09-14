@echo off
setlocal

set "PROJECT_DIR=%~dp0.."
set "NODE_HOME=C:\MeuOrsamento\tools\nodejs"
set "NVM_HOME=C:\MeuOrsamento\tools\nvm"
set "PATH=%NODE_HOME%;%NVM_HOME%;%PATH%"

echo Gerando build preview Android via EAS...
echo.
cd /d "%PROJECT_DIR%"
call npx eas-cli build --platform android --profile preview

endlocal
