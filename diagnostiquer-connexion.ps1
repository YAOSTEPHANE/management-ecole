# Script de diagnostic pour les problèmes de connexion
# Ce script vérifie les causes possibles d'une erreur 401

Write-Host "🔍 Diagnostic des problèmes de connexion" -ForegroundColor Cyan
Write-Host ""

# Vérifier si le serveur est démarré
Write-Host "1. Vérification du serveur backend..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Serveur backend accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Serveur backend non accessible sur http://localhost:5000" -ForegroundColor Red
    Write-Host "   💡 Assurez-vous que le serveur est démarré : cd server; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Demander l'email à tester
Write-Host ""
$email = Read-Host "2. Entrez l'email que vous utilisez pour vous connecter"

if ([string]::IsNullOrWhiteSpace($email)) {
    Write-Host "   ❌ Email vide" -ForegroundColor Red
    exit 1
}

# Tester la connexion
Write-Host ""
Write-Host "3. Test de connexion avec l'email: $email" -ForegroundColor Yellow
Write-Host "   (Le mot de passe sera demandé)" -ForegroundColor Gray

$password = Read-Host "   Entrez le mot de passe" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

try {
    $body = @{
        email = $email
        password = $plainPassword
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "   ✅ Connexion réussie !" -ForegroundColor Green
    Write-Host "   👤 Utilisateur: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Cyan
    Write-Host "   🎭 Rôle: $($response.user.role)" -ForegroundColor Cyan
    Write-Host "   🔑 Token reçu: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    
    Write-Host "   ❌ Erreur de connexion (Code: $statusCode)" -ForegroundColor Red
    
    if ($statusCode -eq 401) {
        Write-Host ""
        Write-Host "   🔍 Causes possibles d'une erreur 401 :" -ForegroundColor Yellow
        Write-Host "   1. Email incorrect" -ForegroundColor White
        Write-Host "   2. Mot de passe incorrect" -ForegroundColor White
        Write-Host "   3. Compte désactivé (isActive = false)" -ForegroundColor White
        Write-Host ""
        Write-Host "   💡 Solutions :" -ForegroundColor Cyan
        Write-Host "   - Vérifiez que l'email est correct" -ForegroundColor White
        Write-Host "   - Vérifiez que le mot de passe est correct" -ForegroundColor White
        Write-Host "   - Si vous avez utilisé le seed, le mot de passe par défaut est: password123" -ForegroundColor White
        Write-Host "   - Vérifiez que le compte existe dans la base de données" -ForegroundColor White
        Write-Host ""
        Write-Host "   📝 Pour vérifier les comptes existants, exécutez:" -ForegroundColor Yellow
        Write-Host "   .\verifier-comptes.ps1" -ForegroundColor White
    } elseif ($statusCode -eq 400) {
        Write-Host "   ❌ Requête invalide. Vérifiez le format de l'email." -ForegroundColor Red
    } else {
        Write-Host "   ❌ Erreur serveur: $($errorResponse.error)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Diagnostic terminé" -ForegroundColor Green
