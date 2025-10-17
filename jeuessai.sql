-- Jeu d'essai généré par Gemini 2.5 Flash à partir du script SQL

DO $$
DECLARE
    client1_id UUID := gen_random_uuid();
    client2_id UUID := gen_random_uuid();
    transp1_id UUID := gen_random_uuid();
    transp2_id UUID := gen_random_uuid();
    prod1_id UUID := gen_random_uuid();
    prod2_id UUID := gen_random_uuid();
    prod3_id UUID := gen_random_uuid();
    charge1_id UUID := gen_random_uuid();
    charge2_id UUID := gen_random_uuid();
BEGIN

    INSERT INTO clients (id, nom, adresse) VALUES
    (client1_id, 'Alpha Logistique', '12 Rue des Docks, 75010 Paris'),
    (client2_id, 'Beta Distribution', '45 Avenue de la Gare, 69002 Lyon');

    INSERT INTO transporteurs (id, nom, contact) VALUES
    (transp1_id, 'Routiers Express', 'Jean Dupont - 0123456789'),
    (transp2_id, 'Ailes Rapides', 'Sophie Martin - 0987654321');

    INSERT INTO produits (id, reference, nom, description) VALUES
    (prod1_id, 'REF-PC-4K', 'Panneau Contreplaqué 4mm', 'Panneau standard pour construction légère'),
    (prod2_id, 'REF-PL-300', 'Palette Europe EPAL', 'Palette normalisée pour stockage et transport'),
    (prod3_id, 'REF-VIS-INOX', 'Boîte de Vis Inox 5x50', 'Résistance à la corrosion, usage extérieur');

    INSERT INTO chargements (id, date_creation, client_id, transporteur_id) VALUES
    (charge1_id, now() - INTERVAL '3 days', client1_id, transp1_id);

    INSERT INTO chargements (id, date_creation, client_id, transporteur_id) VALUES
    (charge2_id, now() - INTERVAL '1 day', client2_id, transp2_id);

    INSERT INTO chargement_produits (chargement_id, produit_id, quantite) VALUES
    (charge1_id, prod1_id, 150.00),
    (charge1_id, prod2_id, 5.00);

    INSERT INTO chargement_produits (chargement_id, produit_id, quantite) VALUES
    (charge2_id, prod2_id, 2.00),
    (charge2_id, prod3_id, 85.50);

END $$;