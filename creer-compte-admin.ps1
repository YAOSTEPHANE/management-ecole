# Script PowerShell pour créer un compte administrateur
# Usage: .\creer-compte-admin.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création d'un compte ADMINISTRATEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le serveur est accessible
Write-Host "1. Vérification du serveur..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -ErrorAction Stop
    Write-Host "   ✅ Serveur accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Le serveur n'est pas accessible sur http://localhost:5000" -ForegroundColor Red
    Write-Host "   💡 Assurez-vous que le serveur backend est démarré:" -ForegroundColor Yellow
    Write-Host "      cd server" -ForegroundColor Gray
    Write-Host "      npm run dev" -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Demander les informations
$email = Read-Host "2. Entrez l'email (ex: admin@school.com)"
$password = Read-Host "3. Entrez le mot de passe (min 6 caractères)" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if ($passwordPlain.Length -lt 6) {
    Write-Host "   ❌ Le mot de passe doit contenir au moins 6 caractères" -ForegroundColor Red
    exit 1
}

$firstName = Read-Host "4. Entrez le prénom (ex: Admin)"
$lastName = Read-Host "5. Entrez le nom (ex: User)"

Write-Host ""
Write-Host "Création du compte en cours..." -ForegroundColor Yellow

# Créer le compte
$body = @{
    email = $email
    password = $passwordPlain
    firstName = $firstName
    lastName = $lastName
    role = "ADMIN"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ Compte créé avec succès !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Email: $email" -ForegroundColor Cyan
    Write-Host "🔑 Mot de passe: $passwordPlain" -ForegroundColor Cyan
    Write-Host "👤 Nom: $firstName $lastName" -ForegroundColor Cyan
    Write-Host "🎭 Rôle: ADMIN" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "💡 Vous pouvez maintenant vous connecter avec ces identifiants" -ForegroundColor Yellow
    Write-Host ""
} catch {
    $errorMessage = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorMessage = $errorDetails.error
    }
    
    Write-Host ""
    Write-Host "❌ Erreur lors de la création du compte:" -ForegroundColor Red
    Write-Host "   $errorMessage" -ForegroundColor Red
    Write-Host ""
    
    if ($errorMessage -like "*déjà utilisé*" -or $errorMessage -like "*already*") {
        Write-Host "💡 Ce compte existe déjà. Essayez de vous connecter avec:" -ForegroundColor Yellow
        Write-Host "   Email: $email" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "   Ou utilisez le script pour vérifier les comptes existants." -ForegroundColor Yellow
    }
}






