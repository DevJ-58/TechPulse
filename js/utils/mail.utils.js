const MAIL_FROM = 'test588559@gmail.com';

/**
 * Ouvre le client mail avec un mail pré-rempli
 */
export function ouvrirMail({ to, subject, body }) {
  const params = new URLSearchParams();
  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;
}

/**
 * Mail envoi lien de test
 */
export function mailLienTest({ prenom, nom, email, lien, pole }) {
  const poleLabel = pole === 'dev' ? 'Développement'
    : pole === 'secu' ? 'Sécurité'
    : pole === 'iot' ? 'Électronique IoT' : pole;
  
  ouvrirMail({
    to: email,
    subject: 'TechPulse — Ton lien de test hack-select',
    body: `Bonjour ${prenom} ${nom},

Nous avons examiné ta candidature au pôle ${poleLabel} de TechPulse et nous sommes heureux de t'inviter à passer la prochaine étape : le test hack-select.

Ton lien de test (usage unique) :
${lien}

⚠️ Ce lien est personnel et ne peut être utilisé qu'une seule fois.
⚠️ Ne quitte pas la page pendant le test — cela annulerait ta session.
⚠️ Prévois 15 à 20 minutes sans interruption.

Le test comporte 3 parties :
- Partie A : Questions à choix multiple (20s par question)
- Partie B : Exercices pratiques (20s par question)  
- Partie C : Mises en situation (temps libre)

Bonne chance !

L'équipe TechPulse
UIYA Yamoussoukro
${MAIL_FROM}`
  });
}

/**
 * Mail de refus
 */
export function mailRefus({ prenom, nom, email, pole }) {
  const poleLabel = pole === 'dev' ? 'Développement'
    : pole === 'secu' ? 'Sécurité'
    : pole === 'iot' ? 'Électronique IoT' : pole;

  ouvrirMail({
    to: email,
    subject: 'TechPulse — Résultat de ta candidature',
    body: `Bonjour ${prenom} ${nom},

Nous avons bien reçu et examiné ta candidature au pôle ${poleLabel} de TechPulse.

Après étude de ton dossier et de tes résultats, nous ne sommes malheureusement pas en mesure de donner suite à ta candidature pour cette session.

Cette décision ne remet pas en question tes compétences. Nous t'encourageons à continuer à te former et à recandidater lors de la prochaine session.

Merci pour l'intérêt que tu portes à TechPulse.

Cordialement,
L'équipe TechPulse
UIYA Yamoussoukro
${MAIL_FROM}`
  });
}

/**
 * Mail confirmation meet
 */
export function mailMeet({ prenom, nom, email, date, lieu, duree }) {
  const dateFormatee = date 
    ? new Date(date).toLocaleString('fr-FR', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '—';

  ouvrirMail({
    to: email,
    subject: 'TechPulse — Ton entretien est planifié',
    body: `Bonjour ${prenom} ${nom},

Félicitations ! Tu as été sélectionné(e) pour passer l'étape finale du processus de sélection TechPulse : le meet présentiel.

📅 Date : ${dateFormatee}
📍 Lieu : ${lieu || 'UIYA Yamoussoukro'}
⏱ Durée : ${duree || 30} minutes

Cet entretien est une discussion avec l'équipe fondatrice. Sois toi-même, prépare-toi à parler de tes projets et de ta motivation.

Merci de confirmer ta présence en répondant à ce mail.

À bientôt,
L'équipe TechPulse
UIYA Yamoussoukro
${MAIL_FROM}`
  });
}

/**
 * Mail bienvenue membre
 */
export function mailBienvenue({ prenom, nom, email, pole }) {
  const poleLabel = pole === 'dev' ? 'Développement'
    : pole === 'secu' ? 'Sécurité'
    : pole === 'iot' ? 'Électronique IoT' : pole;

  ouvrirMail({
    to: email,
    subject: 'TechPulse — Bienvenue dans le club ! 🎉',
    body: `Bonjour ${prenom} ${nom},

C'est officiel — tu es maintenant membre de TechPulse, pôle ${poleLabel} !

Tu rejoins une équipe de passionnés déterminés à construire, sécuriser et innover. Bienvenue dans l'aventure.

Les prochaines étapes te seront communiquées très prochainement via notre groupe WhatsApp et nos canaux de communication internes.

Encore félicitations pour ce parcours remarquable.

L'équipe TechPulse
UIYA Yamoussoukro
${MAIL_FROM}`
  });
}
