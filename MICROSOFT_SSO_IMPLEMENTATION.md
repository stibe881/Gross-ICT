# Microsoft SSO Implementation - Dokumentation

## ✅ Implementierungsstatus

**Status:** Vollständig implementiert und bereit zum Testen

**Datum:** 12. Dezember 2024

---

## 📋 Übersicht

Microsoft Single Sign-On (SSO) wurde erfolgreich in die Gross ICT Website integriert. Benutzer können sich jetzt mit ihrem Microsoft-Konto anmelden (Office 365, Azure AD, persönliche Microsoft-Konten).

---

## 🎯 Implementierte Features

### Backend (Server)

✅ **OAuth Service** (`server/microsoftOAuthService.ts`)
- Microsoft OAuth 2.0 Flow Implementation
- Token Exchange (Authorization Code → Access Token)
- Token Refresh Logic
- User Profile Synchronization
- Sichere Token-Speicherung in Datenbank

✅ **tRPC Router** (`server/microsoftOAuthRouter.ts`)
- `getAuthUrl` - Generiert Microsoft Login URL
- `handleCallback` - Verarbeitet OAuth Callback
- `initializeSettings` - Speichert OAuth Credentials
- `getSettingsStatus` - Prüft Konfigurationsstatus
- `toggleActive` - Aktiviert/Deaktiviert Microsoft SSO

✅ **Datenbank Schema** (`drizzle/schema_oauth.ts`)
- `oauthSettings` - OAuth Provider Konfiguration
- `oauthProviders` - User OAuth Verknüpfungen
- Sichere Token-Speicherung mit Ablaufdatum

### Frontend (Client)

✅ **Login Page Integration** (`client/src/pages/Login.tsx`)
- "Mit Microsoft anmelden" Button
- Elegantes Design mit Microsoft-Logo
- Loading States während Weiterleitung

✅ **Callback Handler** (`client/src/pages/MicrosoftCallback.tsx`)
- Verarbeitet OAuth Callback von Microsoft
- Zeigt Loading State während Authentifizierung
- Error Handling mit benutzerfreundlichen Meldungen
- Automatische Weiterleitung nach erfolgreicher Anmeldung

✅ **Microsoft Icon** (`client/src/components/icons/MicrosoftIcon.tsx`)
- Offizielles Microsoft-Logo als SVG
- Responsive und skalierbar

✅ **Routing** (`client/src/App.tsx`)
- Route `/auth/microsoft/callback` für OAuth Callback
- Lazy Loading für optimale Performance

---

## 🔐 Sicherheitsfeatures

### Implementierte Sicherheitsmaßnahmen

1. **CSRF Protection**
   - State-Parameter mit Base64-Encoding
   - Validierung bei Callback

2. **Token Security**
   - Access Tokens verschlüsselt in Datenbank
   - Refresh Tokens für automatische Erneuerung
   - Token Expiry Tracking

3. **User Profile Sync**
   - Automatische Verknüpfung mit existierenden Accounts (via E-Mail)
   - Neue User-Erstellung bei Erstanmeldung
   - Profildaten-Synchronisation (Name, E-Mail)

4. **Scope Limitation**
   - Nur notwendige Permissions: `openid profile email User.Read`
   - Minimales Privilege-Prinzip

---

## 🗄️ Datenbank-Struktur

### Tabelle: `oauthSettings`

Speichert OAuth Provider Konfiguration (Client ID, Secret, etc.)

```sql
CREATE TABLE `oauthSettings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `provider` varchar(64) UNIQUE NOT NULL,
  `clientId` varchar(255) NOT NULL,
  `clientSecret` text NOT NULL,
  `tenantId` varchar(255),
  `redirectUri` varchar(500) NOT NULL,
  `scopes` text NOT NULL,
  `isActive` int DEFAULT 1 NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabelle: `oauthProviders`

Verknüpft Benutzer mit ihren OAuth-Accounts

```sql
CREATE TABLE `oauthProviders` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `provider` varchar(64) NOT NULL,
  `providerUserId` varchar(255) NOT NULL,
  `accessToken` text,
  `refreshToken` text,
  `tokenExpiresAt` timestamp,
  `profileData` text,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## 🔧 Konfiguration

### Azure AD App Registration

**App Name:** SSO Gross ICT Webseiten Anmeldung

**Credentials:** (Stored securely in database, not in code)
- **Application (client) ID:** `[Configured in Azure AD]`
- **Directory (tenant) ID:** `[Configured in Azure AD]`
- **Client Secret:** `[Stored securely in database]`

**Redirect URI:** `https://gross-ict.ch/auth/microsoft/callback`

**API Permissions:**
- `User.Read` (Microsoft Graph, Delegated)
- `email` (Microsoft Graph, Delegated)
- `profile` (Microsoft Graph, Delegated)
- `openid` (Microsoft Graph, Delegated)

**Supported Account Types:**
- Konten in einem beliebigen Organisationsverzeichnis (mandantenfähig)
- Persönliche Microsoft-Konten (z.B. Skype, Xbox)

---

## 🚀 Deployment-Schritte

### 1. Azure Redirect URI aktualisieren

⚠️ **WICHTIG:** Die Redirect URI in Azure muss aktualisiert werden!

1. Gehe zu https://portal.azure.com
2. **Azure Active Directory** → **App registrations**
3. Klicke auf **"SSO Gross ICT Webseiten Anmeldung"**
4. Klicke auf **"Authentication"** im linken Menü
5. Unter **"Web" → "Redirect URIs"** ändere:
   - **Alt:** `https://gross-ict.ch/api/auth/microsoft/callback`
   - **Neu:** `https://gross-ict.ch/auth/microsoft/callback`
6. Klicke auf **"Save"**

### 2. Datenbank-Migration

Die OAuth-Tabellen wurden bereits erstellt via:
```bash
pnpm tsx init-microsoft-oauth.mjs
```

### 3. Credentials in Datenbank

Die Microsoft OAuth Credentials wurden bereits gespeichert in der `oauthSettings` Tabelle.

### 4. Code Deployment

Alle Änderungen sind im Code enthalten:
- Backend: `server/microsoftOAuthService.ts`, `server/microsoftOAuthRouter.ts`
- Frontend: `client/src/pages/Login.tsx`, `client/src/pages/MicrosoftCallback.tsx`
- Schema: `drizzle/schema_oauth.ts`

---

## 🧪 Testing

### Manueller Test-Flow

1. **Logout** (falls eingeloggt)
2. Gehe zu `https://gross-ict.ch/login`
3. Klicke auf **"Mit Microsoft anmelden"**
4. Werde zu Microsoft weitergeleitet
5. Melde dich mit deinem Microsoft-Konto an
6. Erlaube die Berechtigungen (beim ersten Mal)
7. Werde zurück zu `https://gross-ict.ch/auth/microsoft/callback` weitergeleitet
8. Automatische Weiterleitung zum Dashboard
9. **Erfolgreich eingeloggt!** ✅

### Test-Szenarien

**Szenario 1: Neuer Benutzer**
- User existiert noch nicht in der Datenbank
- Neuer User wird erstellt mit Microsoft-Profildaten
- OAuth-Verknüpfung wird gespeichert
- User wird zum Dashboard weitergeleitet

**Szenario 2: Existierender Benutzer (gleiche E-Mail)**
- User existiert bereits mit gleicher E-Mail
- Microsoft-Account wird mit existierendem User verknüpft
- OAuth-Verknüpfung wird gespeichert
- User wird zum Dashboard weitergeleitet

**Szenario 3: Wiederholte Anmeldung**
- User hat sich bereits einmal mit Microsoft angemeldet
- OAuth-Tokens werden aktualisiert
- User wird zum Dashboard weitergeleitet

**Szenario 4: Fehlerbehandlung**
- User bricht Microsoft-Login ab → Weiterleitung zu `/login` mit Fehlermeldung
- Ungültige Credentials → Fehlermeldung wird angezeigt
- Netzwerkfehler → Benutzerfreundliche Fehlermeldung

---

## 🔍 Troubleshooting

### Problem 1: "Redirect URI mismatch"

**Fehler:** `AADSTS50011: The redirect URI specified in the request does not match`

**Lösung:**
1. Überprüfe die Redirect URI in Azure Portal
2. Stelle sicher, dass sie **exakt** so lautet: `https://gross-ict.ch/auth/microsoft/callback`
3. Achte auf `https://` (nicht `http://`)
4. Kein `/` am Ende

### Problem 2: "Invalid client secret"

**Fehler:** `AADSTS7000215: Invalid client secret provided`

**Lösung:**
1. Client Secret ist abgelaufen oder falsch
2. Erstelle neues Client Secret in Azure Portal
3. Update in Datenbank via:
   ```sql
   UPDATE oauthSettings 
   SET clientSecret = 'NEUES_SECRET' 
   WHERE provider = 'microsoft';
   ```

### Problem 3: "Insufficient privileges"

**Fehler:** `AADSTS65001: The user or administrator has not consented`

**Lösung:**
1. Gehe zu Azure Portal → App registrations → API permissions
2. Klicke auf **"Grant admin consent for [Your Organization]"**
3. Bestätige mit "Yes"

### Problem 4: Login funktioniert, aber keine Weiterleitung

**Lösung:**
1. Überprüfe Browser Console auf JavaScript-Fehler
2. Stelle sicher, dass `/auth/microsoft/callback` Route existiert
3. Überprüfe, dass `MicrosoftCallback` Component korrekt importiert ist

---

## 📊 Monitoring

### Logs überprüfen

**Backend-Logs:**
```bash
# Server-Logs anzeigen
cd /home/ubuntu/gross_ict
pnpm logs
```

**Wichtige Log-Meldungen:**
- `[Microsoft OAuth] Settings initialized successfully` - Credentials gespeichert
- `[Microsoft OAuth] Token exchange failed` - Problem beim Token-Austausch
- `[Microsoft OAuth] Failed to get user profile` - Problem beim Abrufen des Profils

### Azure AD Sign-in Logs

1. Gehe zu https://portal.azure.com
2. **Azure Active Directory** → **Sign-in logs**
3. Filtere nach deiner App "SSO Gross ICT Webseiten Anmeldung"
4. Überprüfe erfolgreiche und fehlgeschlagene Anmeldungen

---

## 🔄 User Flow Diagramm

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User klickt "Mit Microsoft anmelden" auf /login             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend ruft trpc.microsoftOAuth.getAuthUrl auf            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend generiert Microsoft OAuth URL mit state             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. User wird zu login.microsoftonline.com weitergeleitet       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. User meldet sich mit Microsoft-Konto an                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Microsoft leitet zu /auth/microsoft/callback mit code       │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend ruft trpc.microsoftOAuth.handleCallback auf        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Backend tauscht code gegen access_token                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. Backend holt User-Profil von Microsoft Graph API            │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. Backend erstellt/verknüpft User in Datenbank               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. Frontend leitet zu /dashboard weiter                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Code-Referenz

### Backend API Endpoints

**1. Get Auth URL**
```typescript
trpc.microsoftOAuth.getAuthUrl.useMutation({
  returnUrl: "/dashboard"
})
// Returns: { authUrl: "https://login.microsoftonline.com/...", state: "..." }
```

**2. Handle Callback**
```typescript
trpc.microsoftOAuth.handleCallback.useMutation({
  code: "authorization_code",
  state: "base64_encoded_state"
})
// Returns: { success: true, userId: 123, returnUrl: "/dashboard", user: {...} }
```

**3. Get Settings Status**
```typescript
trpc.microsoftOAuth.getSettingsStatus.useQuery()
// Returns: { configured: true, active: true, redirectUri: "..." }
```

### Frontend Components

**Login Button Usage**
```tsx
import { trpc } from "@/lib/trpc";

const microsoftAuthMutation = trpc.microsoftOAuth.getAuthUrl.useMutation({
  onSuccess: (data) => {
    window.location.href = data.authUrl;
  }
});

<Button onClick={() => microsoftAuthMutation.mutate({ returnUrl: "/" })}>
  Mit Microsoft anmelden
</Button>
```

---

## 🎨 UI/UX Design

### Login Page

- **Microsoft Button:** Weiß mit Microsoft-Logo
- **Position:** Unter dem normalen Login-Formular
- **Separator:** "Oder" Trennlinie zwischen Login-Methoden
- **Loading State:** Spinner während Weiterleitung

### Callback Page

- **Loading State:** Großer Spinner mit "Bitte warten..." Text
- **Error State:** Rote Fehlermeldung mit automatischer Weiterleitung
- **Success:** Automatische Weiterleitung ohne zusätzliche UI

---

## 🔮 Zukünftige Erweiterungen

### Mögliche Features

1. **Weitere OAuth Provider**
   - Google SSO
   - GitHub SSO
   - LinkedIn SSO

2. **Admin Dashboard**
   - OAuth Provider Management UI
   - Aktivieren/Deaktivieren von Providern
   - Statistiken über Login-Methoden

3. **User Profile**
   - Verknüpfte Accounts anzeigen
   - Accounts verknüpfen/entfernen
   - Primäre Login-Methode festlegen

4. **Advanced Features**
   - Multi-Factor Authentication (MFA)
   - Conditional Access Policies
   - Role Mapping von Azure AD Groups

---

## 📞 Support

Bei Problemen oder Fragen:

1. **Überprüfe die Logs** (Backend und Azure AD)
2. **Teste mit verschiedenen Microsoft-Konten**
3. **Überprüfe die Azure-Konfiguration**
4. **Kontaktiere den Entwickler** mit Screenshots und Error-Logs

---

## ✅ Checkliste für Go-Live

- [x] Azure AD App Registration erstellt
- [x] OAuth Credentials in Datenbank gespeichert
- [x] Backend OAuth Flow implementiert
- [x] Frontend Login Button implementiert
- [x] Callback Handler implementiert
- [x] Datenbank-Tabellen erstellt
- [ ] Azure Redirect URI aktualisiert (`/api/auth/...` → `/auth/...`)
- [ ] Manueller Test durchgeführt
- [ ] Verschiedene User-Szenarien getestet
- [ ] Error Handling getestet
- [ ] Dokumentation gelesen und verstanden

---

**Implementiert von:** Manus AI  
**Datum:** 12. Dezember 2024  
**Version:** 1.0.0
