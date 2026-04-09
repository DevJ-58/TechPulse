// ?? SOURCE DE VÉRITÉ UNIQUE — ne jamais écrire l'URL ailleurs
// Remplace BASE_URL quand l'URL change

const API_CONFIG = {
  BASE_URL: "https://techpulse-backend.vercel.app",
  TIMEOUT: 60000, // ms (set to 0 to disable)

  ENDPOINTS: {

    // --- ADMINS ------------------------------------------
    ADMIN_INSCRIPTION:   "/api/v1/admins/inscription",   // POST  — créer un compte admin
    ADMIN_CONNEXION:     "/api/v1/admins/connexion",     // POST  — login ? retourne token_acces + token_rafraichissement
    ADMIN_RAFRAICHIR:    "/api/v1/admins/rafraichir",    // POST  — renouveler les jetons
    ADMIN_ME:            "/api/v1/admins/me",            // GET   — profil admin connecté (Bearer)
    ADMIN_DECONNEXION:   "/api/v1/admins/deconnexion",   // POST  — logout, révoque le refresh token

    // --- CANDIDATS ---------------------------------------
    CANDIDATES:          "/api/v1/candidates/",          // POST (public) · GET (admin, ?statut= &pole=)
    CANDIDATE_BY_ID:     "/api/v1/candidates/:candidat_id",         // GET · PATCH
    CANDIDATE_STATUT:    "/api/v1/candidates/:candidat_id/statut",  // PATCH — changer le statut uniquement

    // --- TESTS — TOKENS ----------------------------------
    TEST_TOKENS:         "/api/v1/tests/tokens",         // POST (admin) — créer un token de test
    TEST_TOKEN_DELETE:   "/api/v1/tests/tokens/:token_id", // DELETE (admin)

    // --- TESTS — SESSIONS --------------------------------
    SESSION_DEMARRER:    "/api/v1/tests/sessions/demarrer",              // POST (public) — démarrer via token_uuid
    SESSIONS:            "/api/v1/tests/sessions",                       // GET  (admin)  — ?candidat_id= &pole=
    SESSION_BY_ID:       "/api/v1/tests/sessions/:session_id",           // GET  (admin)
    SESSION_ANSWERS:     "/api/v1/tests/sessions/:session_id/answers",   // POST (public) · GET (admin)
    SESSION_FINALISER:   "/api/v1/tests/sessions/{session_id}/finaliser", // POST (public) — soumettre le test

    // --- QUESTIONS ---------------------------------------
    QUESTIONS:           "/api/v1/questions/",           // POST (admin) · GET (admin, ?pole= &partie= &actif=)
    QUESTION_BY_ID:      "/api/v1/questions/:question_id",         // GET · PATCH
    QUESTION_CHOICES:    "/api/v1/questions/:question_id/choices", // POST (admin) — ajouter un choix

    // --- MEETS -------------------------------------------
    MEETS:               "/api/v1/meets/",               // POST (admin) · GET (admin, ?pole= &statut=)
    MEET_BY_ID:          "/api/v1/meets/:meet_id",       // GET · PATCH

    // --- MEMBRES -----------------------------------------
    MEMBERS:             "/api/v1/members/",             // POST (admin) · GET (admin, ?pole= &actif=)
    MEMBER_BY_ID:        "/api/v1/members/:membre_id",          // GET · PATCH
    MEMBER_WHATSAPP:     "/api/v1/members/:membre_id/whatsapp", // PATCH — marquer WA envoyé

    // --- EMAILS ------------------------------------------
    EMAIL_TEST_LINK:     "/api/v1/email/send-test-link",  // POST (admin) — envoyer lien de test
    EMAIL_REFUSAL:       "/api/v1/email/send-refusal",    // POST (admin) — envoyer mail de refus

    // --- SETTINGS ----------------------------------------
    SETTINGS_GLOBAL:     "/api/v1/settings/global",     // GET · PATCH
    SETTINGS_POLES:      "/api/v1/settings/poles",      // GET · PUT (créer/remplacer un pôle)
    SETTINGS_POLE_BY_ID: "/api/v1/settings/poles/:pole_id", // GET · PATCH
  }
};

export default API_CONFIG;


