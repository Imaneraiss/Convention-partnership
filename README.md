# Convention-Partnership

> **Application web de gestion et de suivi des conventions de partenariat**  
> Université Mohammed V de Rabat — Présidence

![Status](https://img.shields.io/badge/status-production-brightgreen)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-Internal-red)

---

## 📖 Description

**Convention-Partnership** est une application web interne développée pour la **Présidence de l'Université Mohammed V de Rabat**. Elle permet la **centralisation**, l'**archivage** et le **pilotage** des conventions de partenariat signées par l'université avec ses partenaires (institutions, entreprises, universités, ONG...).

L'application automatise l'extraction des données des conventions grâce à l'**OCR** (Tesseract) et à l'**Intelligence Artificielle** (Groq API — LLaMA 3.3), gère les **alertes automatiques** (fin de convention, réunions de comités), et offre des **tableaux de bord statistiques** pour appuyer la prise de décision stratégique.

---

## ✨ Fonctionnalités principales

### 🔐 Authentification
- Connexion sécurisée par email institutionnel + mot de passe
- Changement de mot de passe obligatoire à la première connexion
- Réinitialisation de mot de passe par email (SendGrid)
- Gestion des rôles : **Chargé de partenariat**, **Secrétaire Général**, **Président**, **Administrateur**

### 📄 Gestion des conventions
- Création, modification et suppression
- Numérotation automatique par année (`01/2026`, `02/2026`...)
- **Upload de documents** avec **extraction automatique** (OCR + IA)
- Suivi : identification, dates, signataires, partenaires, articles
- Mots-clés thématiques pour la recherche

### 💰 Suivi budgétaire
- Gestion du budget par convention (montants, devises, modalités)
- Suivi de la réception des fonds
- Upload de justificatifs financiers

### 👥 Gestion des comités
- Comités (Pilotage, Suivi, Technique, Scientifique)
- Gestion des membres UM5 et partenaires
- Historique des réunions et archivage des PV

### 🔔 Système d'alertes
- **Automatiques** (scheduler quotidien 08h00) : fin de convention, réunions
- **Manuelles** créées par les chargés
- Envoi d'emails via **SendGrid**

### 📊 Statistiques
- Tableaux de bord interactifs
- Statistiques à plat et croisées
- Export en **Excel**, **PDF**, **Word**

### 📜 Historique
- Journal complet des actions utilisateurs
- Traçabilité des créations, modifications, suppressions, uploads

### 🌍 Internationalisation
- Interface en **Français** et **Anglais** (i18next)

### 📱 Responsive Design
- Adapté à tous les écrans : ordinateur, tablette, smartphone

---

## 🛠️ Stack technique

### Frontend
- **React 18** — Framework UI
- **Vite** — Build tool
- **React Router** — Navigation
- **i18next** — Internationalisation
- **Tailwind CSS** — Styling
- **lucide-react** — Icônes
- **Axios** — Requêtes HTTP

### Backend
- **FastAPI** — Framework API
- **Python 3.11** — Langage
- **SQLAlchemy** — ORM
- **Alembic** — Migrations
- **Pydantic** — Validation
- **APScheduler** — Tâches planifiées
- **Uvicorn** — Serveur ASGI

### Base de données
- **PostgreSQL 15**

### Services externes
- **Tesseract OCR** — Extraction de texte
- **Groq API (LLaMA 3.3)** — Analyse IA
- **SendGrid** — Envoi d'emails

### Infrastructure
- **Docker** — Conteneurisation
- **Docker Compose** — Orchestration
- **Nginx** — Reverse proxy

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       UTILISATEURS                          │
│              (Réseau interne UM5 uniquement)                │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ HTTPS / HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                        NGINX                                │
│                   (Reverse Proxy)                           │
└───────────────┬─────────────────────────┬───────────────────┘
                │                         │
                │ /api/*                  │ /*
                ▼                         ▼
┌───────────────────────┐      ┌───────────────────────┐
│      BACKEND          │      │      FRONTEND         │
│      FastAPI          │      │      React + Vite     │
│      Python 3.11      │      │                       │
└───────────┬───────────┘      └───────────────────────┘
            │
            │ SQL
            ▼
┌───────────────────────┐
│     PostgreSQL 15     │
└───────────────────────┘
```

---

## 📁 Structure du projet

```
Convention-partnership/
├── backend/                          # API FastAPI
│   ├── app/
│   │   ├── main.py                   # Point d'entrée
│   │   ├── database.py               # Configuration BDD
│   │   ├── auth.py                   # Authentification JWT
│   │   ├── models/                   # Modèles SQLAlchemy
│   │   ├── schemas/                  # Schémas Pydantic
│   │   ├── routers/                  # Endpoints API
│   │   └── services/                 # Logique métier
│   ├── alembic/                      # Migrations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── Dockerfile.prod
│
├── frontend/                         # Application React
│   ├── src/
│   │   ├── pages/                    # Pages
│   │   ├── components/               # Composants
│   │   ├── services/                 # Appels API
│   │   ├── context/                  # Contextes React
│   │   ├── utils/                    # Utilitaires
│   │   └── i18n/                     # Traductions
│   ├── package.json
│   ├── Dockerfile
│   └── Dockerfile.prod
│
├── nginx/                            # Config reverse proxy
│   └── nginx.conf
│
├── uploads/                          # Fichiers uploadés
│
├── docker-compose.yml                # Dev
├── docker-compose.prod.yml           # Production
├── .env.example                      # Template
├── deploy.sh                         # Script de déploiement
├── backup.sh                         # Script de backup
└── README.md
```

---

## 🚀 Installation

### Prérequis

- **Docker** ≥ 24.0
- **Docker Compose** ≥ 2.20
- **Git**
- **Node.js** ≥ 20 (pour dev frontend)
- **Python** ≥ 3.11 (pour dev backend)

### 🅰️ Développement (local)

#### 1. Cloner le projet
```bash
git clone https://github.com/VOTRE_USER/Convention-partnership.git
cd Convention-partnership
```

#### 2. Créer le fichier `.env`
```bash
cp .env.example .env
```

Remplir avec :
```env
POSTGRES_USER=um5
POSTGRES_PASSWORD=um5password
POSTGRES_DB=convention_db
SECRET_KEY=votre_secret_key_ici
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
FROM_EMAIL=alertes.partenariats.um5@gmail.com
```

#### 3. Lancer les containers
```bash
docker compose up -d
```

#### 4. Appliquer les migrations
```bash
docker exec partnership_backend alembic upgrade head
```

#### 5. Créer le premier administrateur
```bash
# Générer le hash
docker exec partnership_backend python -c "from app.auth import hash_password; print(hash_password('AdminPass2025!'))"

# Se connecter à la BDD
docker exec -it partnership_db psql -U um5 -d convention_db
```

Puis en SQL :
```sql
INSERT INTO users (id, nom, email, mot_de_passe, role, is_admin, premiere_connexion)
VALUES (
    gen_random_uuid(),
    'Admin',
    'admin@um5.ac.ma',
    '$2b$12$...',   -- hash généré
    'CHARGE',
    true,
    false
);
```

#### 6. Accéder à l'application
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000
- **Documentation API** : http://localhost:8000/docs

### 🅱️ Production (serveur UM5)

```bash
# 1. Se connecter au serveur
ssh user@IP_SERVEUR

# 2. Cloner le projet
cd /opt/partnership
git clone https://github.com/VOTRE_USER/Convention-partnership.git .

# 3. Créer .env.prod
cp .env.example .env.prod
nano .env.prod

# 4. Lancer en production
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# 5. Migrations
docker exec partnership_backend alembic upgrade head
```

---

## 🔧 Configuration

### Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `POSTGRES_USER` | Utilisateur PostgreSQL | ✅ |
| `POSTGRES_PASSWORD` | Mot de passe PostgreSQL | ✅ |
| `POSTGRES_DB` | Nom de la base de données | ✅ |
| `SECRET_KEY` | Clé secrète JWT | ✅ |
| `GROQ_API_KEY` | Clé API Groq pour l'IA | ✅ |
| `SENDGRID_API_KEY` | Clé API SendGrid | ✅ |
| `FROM_EMAIL` | Email expéditeur | ✅ |

### Générer des secrets forts

```bash
# SECRET_KEY
openssl rand -hex 32

# POSTGRES_PASSWORD
openssl rand -base64 24
```

---

## 👥 Rôles et permissions

| Rôle | Créer conv. | Modifier conv. | Gérer budget | Alertes | Comptes |
|------|:-----------:|:--------------:|:------------:|:-------:|:-------:|
| **Chargé de partenariat** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Secrétaire Général** | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Président** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Administrateur** | ✅ | ✅ | ✅ | ✅ | ✅ |

*Consultation en lecture seule pour tous les rôles.*

---

## 📡 API Endpoints

### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/auth/login` | Connexion |
| `POST` | `/api/auth/change-password` | Changer mot de passe |
| `POST` | `/api/auth/forgot-password` | Demander réinitialisation |
| `POST` | `/api/auth/reset-password` | Réinitialiser mot de passe |
| `GET` | `/api/auth/me` | Utilisateur connecté |

### Conventions
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api/conventions` | Liste des conventions |
| `GET` | `/api/conventions/{id}` | Détail |
| `POST` | `/api/conventions` | Créer |
| `PUT` | `/api/conventions/{id}` | Modifier |
| `DELETE` | `/api/conventions/{id}` | Supprimer |
| `POST` | `/api/conventions/export/excel` | Export Excel |

### Fichiers
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/fichiers/upload` | Upload |
| `POST` | `/api/fichiers/extract` | Extraction OCR + IA |
| `GET` | `/api/fichiers/{id}` | Télécharger |
| `DELETE` | `/api/fichiers/{id}` | Supprimer |

**📚 Documentation interactive** : `http://IP_SERVEUR:8000/docs`

---

## 📊 Scheduler automatique

L'application intègre un **scheduler (APScheduler)** avec deux tâches :

| Heure | Tâche | Description |
|-------|-------|-------------|
| **08h00** | Vérification des expirations | Crée les alertes T-3, T-2, T-1 et envoie les emails |
| **08h05** | Vérification des réunions | Crée les alertes J-7 pour les réunions |

**Test manuel** : `POST /_test_scheduler`

---

## 🌍 Internationalisation

- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **English**

Fichiers :
- `frontend/src/i18n/locales/fr.json`
- `frontend/src/i18n/locales/en.json`

---

## 🔒 Sécurité

- ✅ Authentification JWT
- ✅ Mots de passe hashés (bcrypt)
- ✅ CORS configuré
- ✅ Validation des données (Pydantic)
- ✅ Droits d'accès par rôle
- ✅ Traçabilité complète
- ✅ Tokens de réinitialisation à usage unique (24h)
- 🔒 **Déploiement en réseau interne** (pas d'accès Internet)

---

## 🧪 Tests

### Backend
```bash
docker exec partnership_backend pytest
```

### Frontend
```bash
cd frontend
npm test
```

### Tester le scheduler
```bash
curl -X POST http://localhost:8000/_test_scheduler
```

---

## 🐛 Dépannage

### Les containers ne démarrent pas
```bash
docker compose logs backend
docker compose logs frontend
```

### Erreur de connexion à la base de données
```bash
docker ps | grep postgres
docker exec -it partnership_db psql -U um5 -d convention_db
```

### Le scheduler ne tourne pas
```bash
docker logs partnership_backend | grep SCHEDULER
curl -X POST http://localhost:8000/_test_scheduler
```

### Les emails ne partent pas
- Vérifier `SENDGRID_API_KEY` dans `.env`
- Vérifier le dashboard SendGrid : https://app.sendgrid.com
- Vérifier les spams du destinataire

---

## 📝 Commandes utiles

### Docker
```bash
# Démarrer
docker compose -f docker-compose.prod.yml up -d

# Arrêter
docker compose -f docker-compose.prod.yml down

# Voir les logs
docker logs partnership_backend -f

# Redémarrer un service
docker restart partnership_backend

# Voir les containers
docker ps
```

### Base de données
```bash
# Backup
docker exec partnership_db pg_dump -U um5 convention_db | gzip > backup.sql.gz

# Restaurer
gunzip -c backup.sql.gz | docker exec -i partnership_db psql -U um5 convention_db

# Se connecter
docker exec -it partnership_db psql -U um5 -d convention_db
```

### Migrations
```bash
# Appliquer
docker exec partnership_backend alembic upgrade head

# Créer une nouvelle migration
docker exec partnership_backend alembic revision --autogenerate -m "Description"

# Voir l'état
docker exec partnership_backend alembic current
```

---

## 📦 Déploiement

Voir la section **Installation → Production** ci-dessus.

**Résumé** :

1. Préparer le code sur GitHub
2. Créer les fichiers `.prod`
3. Demander les accès à la DSI de l'UM5
4. Se connecter en SSH au serveur
5. Installer Docker + Git
6. Cloner et lancer l'application



---

<p align="center">
  <strong>Développé avec ❤️ à l'UM5</strong>
</p>