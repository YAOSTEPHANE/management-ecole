# API NFC pour Appareils Externes

Cette API permet aux appareils NFC externes (lecteurs NFC USB, terminaux NFC, etc.) d'enregistrer automatiquement la présence des élèves et des professeurs.

## Configuration

### Variable d'environnement

Ajoutez dans votre fichier `.env` :

```env
NFC_API_KEY=votre-cle-secrete-ici
```

Par défaut, si la clé n'est pas définie, la clé de développement `nfc-device-key-2024` sera utilisée.

## Authentification

Toutes les requêtes doivent inclure la clé API NFC dans l'un des formats suivants :

1. **Header HTTP** (recommandé) :
   ```
   X-NFC-API-Key: votre-cle-secrete-ici
   ```

2. **Body JSON** :
   ```json
   {
     "apiKey": "votre-cle-secrete-ici",
     "nfcId": "..."
   }
   ```

3. **Query Parameter** :
   ```
   GET /api/nfc/info/123?apiKey=votre-cle-secrete-ici
   ```

## Endpoints

### 1. Enregistrer un scan NFC

**POST** `/api/nfc/scan`

Enregistre automatiquement la présence d'un étudiant ou d'un professeur.

#### Body (JSON)

```json
{
  "nfcId": "string (requis)",
  "date": "ISO8601 (optionnel, défaut: maintenant)",
  "courseId": "string (requis pour les étudiants)",
  "autoStatus": "PRESENT | LATE (optionnel, défaut: PRESENT)"
}
```

#### Exemple de requête

```bash
curl -X POST http://localhost:5000/api/nfc/scan \
  -H "Content-Type: application/json" \
  -H "X-NFC-API-Key: votre-cle-secrete-ici" \
  -d '{
    "nfcId": "ABC123",
    "courseId": "course-id-123",
    "date": "2024-01-15T08:00:00Z",
    "autoStatus": "PRESENT"
  }'
```

#### Réponse (Étudiant)

```json
{
  "success": true,
  "message": "Présence de Jean Dupont enregistrée avec succès",
  "type": "STUDENT",
  "data": {
    "absence": {
      "id": "absence-id",
      "status": "PRESENT",
      "date": "2024-01-15T08:00:00.000Z"
    },
    "student": {
      "id": "student-id",
      "name": "Jean Dupont",
      "studentId": "STU001",
      "class": "6ème A"
    },
    "course": {
      "id": "course-id",
      "name": "Mathématiques",
      "code": "MATH-001"
    }
  }
}
```

#### Réponse (Professeur)

```json
{
  "success": true,
  "message": "Présence de Marie Martin enregistrée avec succès",
  "type": "TEACHER",
  "data": {
    "attendance": {
      "teacherId": "teacher-id",
      "teacherName": "Marie Martin",
      "date": "2024-01-15T08:00:00.000Z",
      "status": "PRESENT",
      "recordedAt": "2024-01-15T08:00:01.000Z"
    },
    "teacher": {
      "id": "teacher-id",
      "name": "Marie Martin",
      "employeeId": "EMP001",
      "specialization": "Mathématiques"
    }
  }
}
```

#### Réponse (Erreur)

```json
{
  "success": false,
  "error": "Aucun utilisateur trouvé avec cet ID NFC",
  "nfcId": "ABC123",
  "message": "Vérifiez que la carte NFC est correctement enregistrée dans le système"
}
```

### 2. Obtenir les informations d'un utilisateur

**GET** `/api/nfc/info/:nfcId`

Récupère les informations d'un utilisateur sans enregistrer la présence.

#### Exemple de requête

```bash
curl -X GET http://localhost:5000/api/nfc/info/ABC123 \
  -H "X-NFC-API-Key: votre-cle-secrete-ici"
```

#### Réponse (Étudiant)

```json
{
  "type": "STUDENT",
  "data": {
    "id": "student-id",
    "name": "Jean Dupont",
    "studentId": "STU001",
    "email": "jean.dupont@example.com",
    "avatar": "url-avatar",
    "class": {
      "id": "class-id",
      "name": "6ème A",
      "level": "6ème"
    }
  }
}
```

#### Réponse (Professeur)

```json
{
  "type": "TEACHER",
  "data": {
    "id": "teacher-id",
    "name": "Marie Martin",
    "employeeId": "EMP001",
    "email": "marie.martin@example.com",
    "avatar": "url-avatar",
    "specialization": "Mathématiques",
    "classes": [
      {
        "id": "class-id",
        "name": "6ème A",
        "level": "6ème"
      }
    ]
  }
}
```

### 3. Lister les cours disponibles

**GET** `/api/nfc/courses?date=YYYY-MM-DD`

Récupère la liste des cours pour une date donnée.

#### Exemple de requête

```bash
curl -X GET "http://localhost:5000/api/nfc/courses?date=2024-01-15" \
  -H "X-NFC-API-Key: votre-cle-secrete-ici"
```

#### Réponse

```json
{
  "date": "2024-01-15",
  "dayOfWeek": 1,
  "courses": [
    {
      "id": "course-id",
      "name": "Mathématiques",
      "code": "MATH-001",
      "class": {
        "id": "class-id",
        "name": "6ème A",
        "level": "6ème"
      },
      "startTime": "08:00",
      "endTime": "09:30",
      "room": "Salle 101"
    }
  ]
}
```

## Codes de statut HTTP

- `200` : Succès
- `400` : Requête invalide (données manquantes ou incorrectes)
- `401` : Clé API invalide ou manquante
- `404` : Utilisateur ou ressource non trouvé
- `500` : Erreur serveur

## Exemples d'intégration

### Python

```python
import requests

API_URL = "http://localhost:5000/api/nfc"
API_KEY = "votre-cle-secrete-ici"

def scan_nfc(nfc_id, course_id=None, date=None):
    headers = {
        "Content-Type": "application/json",
        "X-NFC-API-Key": API_KEY
    }
    
    data = {
        "nfcId": nfc_id,
        "autoStatus": "PRESENT"
    }
    
    if course_id:
        data["courseId"] = course_id
    
    if date:
        data["date"] = date
    
    response = requests.post(f"{API_URL}/scan", json=data, headers=headers)
    return response.json()

# Exemple d'utilisation
result = scan_nfc("ABC123", course_id="course-id-123")
print(result)
```

### Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:5000/api/nfc';
const API_KEY = 'votre-cle-secrete-ici';

async function scanNFC(nfcId, courseId = null, date = null) {
  try {
    const response = await axios.post(
      `${API_URL}/scan`,
      {
        nfcId,
        courseId,
        date,
        autoStatus: 'PRESENT'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-NFC-API-Key': API_KEY
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
    throw error;
  }
}

// Exemple d'utilisation
scanNFC('ABC123', 'course-id-123')
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### Arduino/ESP32

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "VOTRE_WIFI";
const char* password = "VOTRE_MOT_DE_PASSE";
const char* apiUrl = "http://votre-serveur:5000/api/nfc/scan";
const char* apiKey = "votre-cle-secrete-ici";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connecté!");
}

void scanNFC(String nfcId, String courseId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(apiUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-NFC-API-Key", apiKey);
    
    String jsonData = "{\"nfcId\":\"" + nfcId + "\",\"courseId\":\"" + courseId + "\",\"autoStatus\":\"PRESENT\"}";
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Réponse: " + response);
    } else {
      Serial.println("Erreur: " + String(httpResponseCode));
    }
    
    http.end();
  }
}

void loop() {
  // Votre code de lecture NFC ici
  // Quand une carte est détectée:
  // scanNFC("ID_CARTE_NFC", "ID_COURS");
  delay(1000);
}
```

## Notes importantes

1. **Sécurité** : Changez la clé API par défaut en production
2. **CourseId** : Obligatoire pour les étudiants, optionnel pour les professeurs
3. **Date** : Si non fournie, la date/heure actuelle sera utilisée
4. **Statut automatique** : Par défaut "PRESENT", peut être "LATE" pour les retards
5. **Mise à jour** : Si une présence existe déjà pour la date, elle sera mise à jour

## Support

Pour toute question ou problème, contactez l'administrateur du système.

