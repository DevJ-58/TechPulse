# Implémentation du Système de Restrictions par Rôle - Version 2

## Changements Effectués

### **1. Utilitaires (auth.utils.js)**
- ✅ `getAdminRole()` — Extrait le rôle depuis JWT ou sessionStorage (`tp_admin_role`)
- ✅ `hasAccess(page)` — Vérifie l'accès selon le mapping mis à jour avec fallback `|| 'presi'`

### **2. Mapping des Rôles Mis à Jour**
```javascript
ROLE_ACCESS = {
  presi: ['dashboard','candidatures','tests','meets','membres','annonces','editeur','parametres'],
  TD:    ['dashboard','membres'],           // Réduit
  RO:    ['dashboard','candidatures'],     // Réduit  
  CI:    ['dashboard','tests','editeur'],   // Réduit
  OS:    ['dashboard','meets','membres'],  // Réduit
}
```

### **3. Fichiers Utilitaires Crées** (`js/admin/utils/`)
- ✅ **role-guard.js** — Protège les pages avec `guardPage(pageId, pageTitle)`:
  - Remplace seulement `.content` (sidebar intacte)
  - Message d'accès refusé avec libellés lisibles par rôle
  - Fallback `role || 'presi'` pour comptes anciens

- ✅ **sidebar-guard.js** — `applySidebarGuard()`:
  - Grise les liens non autorisés (`opacity: 0.35`, `pointerEvents: none`)
  - Cache les badges de count pour éviter la confusion
  - Titre explicatif au survol

### **4. Formulaire d'inscription** 
- ✅ **register.html** — Champ input texte `#role` avec placeholder et aide
- ✅ **register.js** — Validation des rôles acceptés: `['presi','TD','RO','CI','OS']`

### **5. Connexion** ([login.js](js/admin/login.js))
- ✅ Stockage du rôle depuis `data.admin.role` en sessionStorage

### **6. Pages Admin Protégées**
Intégration complète dans chaque fichier JS:

- ✅ **candidatures.js** — `guardPage('candidatures', 'Candidatures')` + `applySidebarGuard()`
- ✅ **tests.js** — `guardPage('tests', 'Tests')` + `applySidebarGuard()`
- ✅ **meets.js** — `guardPage('meets', 'Meets')` + `applySidebarGuard()`
- ✅ **membres.js** — `guardPage('membres', 'Membres')` + `applySidebarGuard()`
- ✅ **annonces.js** — `guardPage('annonces', 'Annonces')` + `applySidebarGuard()`
- ✅ **editeur.js** — `guardPage('editeur', 'Éditeur de tests')` + `applySidebarGuard()`
- ✅ **parametres.js** — `guardPage('parametres', 'Paramètres')` + `applySidebarGuard()`
- ✅ **dashboard.js** — `applySidebarGuard()` uniquement (pas de guardPage)

### **7. Flux de Protection**
```
Connexion → Stockage rôle → Dashboard
         ↓
Accès page admin → guardPage() → ✅ Autorisé || ❌ Remplacement .content
                  → applySidebarGuard() → Grise liens non autorisés
```

### **8. Gestion des Comptes Anciens**
- Fallback automatique vers `'presi'` si rôle absent du JWT
- Compatibilité totale avec comptes créés avant cette mise à jour

### **9. Interface Utilisateur**
- Sidebar toujours visible et intacte
- Contenu remplacé par message d'accès refusé si non autorisé
- Liens grisés mais visibles dans sidebar
- Badges cachés pour éviter confusion
- Design cohérent avec l'admin existant

## Points Clés
- Guards s'exécutent **après** `requireAdmin()` pour éviter interférences
- JWT doit contenir champ `role` (backend à fournir)
- Comptes anciens traités comme `presi` par défaut
- Sidebar reste fonctionnelle pour navigation autorisée

## À Tester
- [] Navigation vers pages non autorisées → écran d'accès refusé
- [] Sidebar avec liens grisés pour rôles restreints
- [] Création admin avec rôle → stockage correct
- [] Login stocke le rôle depuis API
- [] Comptes anciens (sans rôle) → accès complet comme presi