from __future__ import annotations

import secrets
import string
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, status

from apps.candidates.schemas import (
	CandidatReponse,
	ChangerStatutCandidatRequete,
	CreerCandidatRequete,
	MettreAJourCandidatRequete,
	StatutCandidatureEnum,
)
from core.firebase import obtenir_client_firestore


COLLECTION_CANDIDATS = "candidates"


class ServiceCandidats:
	def __init__(self) -> None:
		self.db = obtenir_client_firestore()

	@staticmethod
	def _maintenant() -> datetime:
		return datetime.now(UTC)

	@staticmethod
	def _normaliser_email(email: str) -> str:
		return email.strip().lower()

	@staticmethod
	def _generer_id_candidat() -> str:
		alphabet = string.ascii_lowercase + string.digits
		suffixe = "".join(secrets.choice(alphabet) for _ in range(23))
		return f"cand_{suffixe}"

	@staticmethod
	def _normaliser_texte(valeur: str) -> str:
		return " ".join(valeur.strip().split())

	def _convertir_candidat(self, candidat_id: str, data: dict[str, Any]) -> CandidatReponse:
		# Normaliser niveau
		niveau = (data.get("niveau") or "").strip()
		if niveau not in ["L1", "L2", "L3", "M1", "M2"]:
			niveau = "L1"

		# Normaliser niveau_tech
		niveau_tech = (data.get("niveau_tech") or "").strip()
		if niveau_tech == "intermediare":
			niveau_tech = "intermediaire"
		if niveau_tech not in ["debutant", "intermediaire", "avance"]:
			niveau_tech = None

		return CandidatReponse(
			id=candidat_id,
			prenom=data.get("prenom", ""),
			nom=data.get("nom", ""),
			email=data.get("email", ""),
			tel=data.get("tel"),
			filiere=data.get("filiere", ""),
			niveau=niveau,
			pole=data.get("pole", ""),
			niveau_tech=niveau_tech,
			motivation=data.get("motivation", ""),
			projet_cite=data.get("projet_cite"),
			source=data.get("source"),
			statut=data.get("statut", "en_attente"),
			date_candidature=data.get("date_candidature"),
		)

	def _trouver_par_email(self, email: str) -> tuple[str, dict[str, Any]] | None:
		docs = (
			self.db.collection(COLLECTION_CANDIDATS)
			.where("email", "==", self._normaliser_email(email))
			.limit(1)
			.stream()
		)
		doc = next(iter(docs), None)
		if not doc:
			return None
		return doc.id, doc.to_dict()

	def creer(self, payload: CreerCandidatRequete) -> CandidatReponse:
		email = self._normaliser_email(payload.email)
		if self._trouver_par_email(email):
			raise HTTPException(
				status_code=status.HTTP_409_CONFLICT,
				detail="Une candidature existe déjà avec cet email.",
			)

		data = {
			"prenom": self._normaliser_texte(payload.prenom),
			"nom": self._normaliser_texte(payload.nom),
			"email": email,
			"tel": payload.tel,
			"filiere": self._normaliser_texte(payload.filiere),
			"niveau": payload.niveau.value,
			"pole": payload.pole.value,
			"niveau_tech": payload.niveau_tech.value if payload.niveau_tech else None,
			"motivation": payload.motivation.strip(),
			"projet_cite": payload.projet_cite.strip() if payload.projet_cite else None,
			"source": payload.source.value if payload.source else None,
			"statut": StatutCandidatureEnum.en_attente.value,
			"date_candidature": self._maintenant(),
		}

		ref = self.db.collection(COLLECTION_CANDIDATS).document(self._generer_id_candidat())
		ref.set(data)
		return self._convertir_candidat(ref.id, data)

	def lister(self, statut: str | None = None, pole: str | None = None) -> list[CandidatReponse]:
		query = self.db.collection(COLLECTION_CANDIDATS)
		if statut:
			query = query.where("statut", "==", statut)
		if pole:
			query = query.where("pole", "==", pole)

		resultats: list[CandidatReponse] = []
		for doc in query.stream():
			resultats.append(self._convertir_candidat(doc.id, doc.to_dict()))
		return resultats

	def detail(self, candidat_id: str) -> CandidatReponse:
		doc = self.db.collection(COLLECTION_CANDIDATS).document(candidat_id).get()
		if not doc.exists:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidat introuvable.")
		return self._convertir_candidat(doc.id, doc.to_dict())

	def mettre_a_jour(self, candidat_id: str, payload: MettreAJourCandidatRequete) -> CandidatReponse:
		doc_ref = self.db.collection(COLLECTION_CANDIDATS).document(candidat_id)
		doc = doc_ref.get()
		if not doc.exists:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidat introuvable.")

		modifications = payload.dict(exclude_none=True)
		if not modifications:
			return self._convertir_candidat(doc.id, doc.to_dict())

		if "prenom" in modifications:
			modifications["prenom"] = self._normaliser_texte(modifications["prenom"])
		if "nom" in modifications:
			modifications["nom"] = self._normaliser_texte(modifications["nom"])
		if "filiere" in modifications:
			modifications["filiere"] = self._normaliser_texte(modifications["filiere"])
		if "motivation" in modifications:
			modifications["motivation"] = modifications["motivation"].strip()
		if "projet_cite" in modifications and modifications["projet_cite"]:
			modifications["projet_cite"] = modifications["projet_cite"].strip()
		if "niveau" in modifications:
			modifications["niveau"] = modifications["niveau"].value
		if "pole" in modifications:
			modifications["pole"] = modifications["pole"].value
		if "niveau_tech" in modifications and modifications["niveau_tech"]:
			modifications["niveau_tech"] = modifications["niveau_tech"].value
		if "source" in modifications and modifications["source"]:
			modifications["source"] = modifications["source"].value

		doc_ref.update(modifications)
		nouveau_doc = doc_ref.get()
		return self._convertir_candidat(nouveau_doc.id, nouveau_doc.to_dict())

	def changer_statut(self, candidat_id: str, payload: ChangerStatutCandidatRequete) -> CandidatReponse:
		doc_ref = self.db.collection(COLLECTION_CANDIDATS).document(candidat_id)
		doc = doc_ref.get()
		if not doc.exists:
			raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidat introuvable.")

		doc_ref.update({"statut": payload.statut.value})
		data = doc_ref.get().to_dict()
		return self._convertir_candidat(candidat_id, data)
