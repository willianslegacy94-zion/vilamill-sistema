Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
npx prisma generate
Start-Sleep -Seconds 1
npx next dev
