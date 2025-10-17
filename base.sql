-- Script SQL généré à partir du MCD créé sur drawDB

CREATE TABLE IF NOT EXISTS "clients" (
    "id" UUID DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "adresse" TEXT,
    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "transporteurs" (
    "id" UUID DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "contact" TEXT,
    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "produits" (
    "id" UUID DEFAULT gen_random_uuid(),
    "reference" TEXT NOT NULL UNIQUE,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "chargements" (
    "id" UUID DEFAULT gen_random_uuid(),
    "date_creation" TIMESTAMP DEFAULT now(),
    "client_id" UUID,
    "transporteur_id" UUID,
    PRIMARY KEY("id")
);

-- TABLE CORRIGÉE
CREATE TABLE IF NOT EXISTS "chargement_produits" (
    "id" UUID DEFAULT gen_random_uuid(),
    "chargement_id" UUID,
    "produit_id" UUID,
    -- CORRECTION EFFECTUÉE ICI
    "quantite" NUMERIC NOT NULL CHECK("quantite" > 0),
    PRIMARY KEY("id")
);

ALTER TABLE "chargements"
ADD FOREIGN KEY("client_id") REFERENCES "clients"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "chargements"
ADD FOREIGN KEY("transporteur_id") REFERENCES "transporteurs"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "chargement_produits"
ADD FOREIGN KEY("chargement_id") REFERENCES "chargements"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "chargement_produits"
ADD FOREIGN KEY("produit_id") REFERENCES "produits"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;