# Script PowerShell pour vérifier les comptes existants
# Usage: .\verifier-comptes.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Vérification des comptes existants" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le serveur est accessible
Write-Host "Vérification du serveur..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -ErrorAction Stop
    Write-Host "✅ Serveur accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Le serveur n'est pas accessible sur http://localhost:5000" -ForegroundColor Red
    Write-Host "💡 Assurez-vous que le serveur backend est démarré" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Test des comptes par défaut du seed..." -ForegroundColor Yellow
Write-Host ""

# Liste des comptes par défaut du seed
$comptes = @(
    @{ email = "admin@school.com"; password = "password123"; role = "ADMIN" },
    @{ email = "teacher1@school.com"; password = "password123"; role = "TEACHER" },
    @{ email = "student1@school.com"; password = "password123"; role = "STUDENT" },
    @{ email = "parent1@school.com"; password = "password123"; role = "PARENT" }
)

$comptesValides = @()

foreach ($compte in $comptes) {
    Write-Host "Test: $($compte.email)..." -NoNewline -ForegroundColor Gray
    
    $body = @{
        email = $compte.email
        password = $compte.password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop

        Write-Host " ✅ VALIDE" -ForegroundColor Green
        $comptesValides += $compte
    } catch {
        Write-Host " ❌ INVALIDE" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Résumé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($comptesValides.Count -eq 0) {
    Write-Host "❌ Aucun compte valide trouvé" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Options:" -ForegroundColor Yellow
    Write-Host "   1. Exécutez le seed pour créer des comptes de test:" -ForegroundColor Yellow
    Write-Host "      cd server" -ForegroundColor Gray
    Write-Host "      npm run prisma:seed" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Créez un nouveau compte avec:" -ForegroundColor Yellow
    Write-Host "      .\creer-compte-admin.ps1" -ForegroundColor Gray
} else {
    Write-Host "✅ $($comptesValides.Count) compte(s) valide(s) trouvé(s):" -ForegroundColor Green
    Write-Host ""
    foreach ($compte in $comptesValides) {
        Write-Host "   📧 $($compte.email)" -ForegroundColor Cyan
        Write-Host "      🔑 Mot de passe: $($compte.password)" -ForegroundColor Gray
        Write-Host "      🎭 Rôle: $($compte.role)" -ForegroundColor Gray
        Write-Host ""
    }
    Write-Host "💡 Vous pouvez utiliser ces identifiants pour vous connecter" -ForegroundColor Yellow
}






