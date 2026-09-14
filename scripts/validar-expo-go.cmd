@echo off
setlocal

set "PROJECT_DIR=%~dp0.."
set "NODE_HOME=C:\MeuOrsamento\tools\nodejs"
set "NVM_HOME=C:\MeuOrsamento\tools\nvm"
set "PATH=%NODE_HOME%;%NVM_HOME%;%PATH%"

echo Iniciando validacao no Expo Go com tunnel...
echo.
cd /d "%PROJECT_DIR%"
call npx expo start --clear --tunnel

endlocal
