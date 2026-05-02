# Script PowerShell pour créer des frais de scolarité de test
# Ce script compile et exécute le script TypeScript pour créer des frais de test

Write-Host "🚀 Création des frais de scolarité de test..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "server")) {
    Write-Host "❌ Erreur: Le dossier 'server' n'existe pas." -ForegroundColor Red
    Write-Host "   Veuillez exécuter ce script depuis la racine du projet." -ForegroundColor Yellow
    exit 1
}

# Aller dans le dossier server
Set-Location server

# Vérifier que node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
}

# Vérifier que tsx est installé
$tsxInstalled = npm list tsx 2>$null
if (-not $tsxInstalled) {
    Write-Host "📦 Installation de tsx..." -ForegroundColor Yellow
    npm install --save-dev tsx
}

# Compiler et exécuter le script
Write-Host "🔨 Compilation et exécution du script..." -ForegroundColor Cyan
Write-Host ""

npx tsx src/scripts/createTestTuitionFees.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Script exécuté avec succès !" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Les frais de scolarité de test ont été créés." -ForegroundColor Cyan
    Write-Host "   Vous pouvez maintenant les voir dans l'application." -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'exécution du script" -ForegroundColor Red
}

# Retourner au répertoire racine
Set-Location ..



