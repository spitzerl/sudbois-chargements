DO $$
DECLARE
    client1_id UUID := gen_random_uuid();
    client2_id UUID := gen_random_uuid();
    client3_id UUID := gen_random_uuid();
    client4_id UUID := gen_random_uuid();
    client5_id UUID := gen_random_uuid();
    
    transp1_id UUID := gen_random_uuid();
    transp2_id UUID := gen_random_uuid();
    transp3_id UUID := gen_random_uuid();
    transp4_id UUID := gen_random_uuid();
    
    prod1_id UUID := gen_random_uuid();
    prod2_id UUID := gen_random_uuid();
    prod3_id UUID := gen_random_uuid();
    prod4_id UUID := gen_random_uuid();
    prod5_id UUID := gen_random_uuid();
    prod6_id UUID := gen_random_uuid();
    
    charge1_id UUID := gen_random_uuid();
    charge2_id UUID := gen_random_uuid();
    charge3_id UUID := gen_random_uuid();
BEGIN

    SELECT id INTO client1_id FROM clients WHERE nom = 'Alpha Logistique' LIMIT 1;
    SELECT id INTO client2_id FROM clients WHERE nom = 'Beta Distribution' LIMIT 1;
    SELECT id INTO client3_id FROM clients WHERE nom = 'Gamma Industries' LIMIT 1;
    SELECT id INTO client4_id FROM clients WHERE nom = 'Delta Construction' LIMIT 1;
    SELECT id INTO client5_id FROM clients WHERE nom = 'Epsilon Menuiserie' LIMIT 1;
    IF client1_id IS NULL THEN
        client1_id := gen_random_uuid();
        INSERT INTO clients (id, nom, adresse) VALUES
        (client1_id, 'Alpha Logistique', '12 Rue des Docks, 75010 Paris');
    END IF;
    
    IF client2_id IS NULL THEN
        client2_id := gen_random_uuid();
        INSERT INTO clients (id, nom, adresse) VALUES
        (client2_id, 'Beta Distribution', '45 Avenue de la Gare, 69002 Lyon');
    END IF;
    
    IF client3_id IS NULL THEN
        client3_id := gen_random_uuid();
        INSERT INTO clients (id, nom, adresse) VALUES
        (client3_id, 'Gamma Industries', '8 Boulevard des Forges, 33000 Bordeaux');
    END IF;
    
    IF client4_id IS NULL THEN
        client4_id := gen_random_uuid();
        INSERT INTO clients (id, nom, adresse) VALUES
        (client4_id, 'Delta Construction', '27 Avenue des Chantiers, 44000 Nantes');
    END IF;
    
    IF client5_id IS NULL THEN
        client5_id := gen_random_uuid();
        INSERT INTO clients (id, nom, adresse) VALUES
        (client5_id, 'Epsilon Menuiserie', '3 Chemin des Artisans, 67000 Strasbourg');
    END IF;

    SELECT id INTO transp1_id FROM transporteurs WHERE nom = 'Routiers Express' LIMIT 1;
    SELECT id INTO transp2_id FROM transporteurs WHERE nom = 'Ailes Rapides' LIMIT 1;
    SELECT id INTO transp3_id FROM transporteurs WHERE nom = 'Maritime Transport' LIMIT 1;
    SELECT id INTO transp4_id FROM transporteurs WHERE nom = 'Euro-Logistics' LIMIT 1;
    IF transp1_id IS NULL THEN
        transp1_id := gen_random_uuid();
        INSERT INTO transporteurs (id, nom, contact) VALUES
        (transp1_id, 'Routiers Express', 'Jean Dupont - 0123456789');
    END IF;
    
    IF transp2_id IS NULL THEN
        transp2_id := gen_random_uuid();
        INSERT INTO transporteurs (id, nom, contact) VALUES
        (transp2_id, 'Ailes Rapides', 'Sophie Martin - 0987654321');
    END IF;
    
    IF transp3_id IS NULL THEN
        transp3_id := gen_random_uuid();
        INSERT INTO transporteurs (id, nom, contact) VALUES
        (transp3_id, 'Maritime Transport', 'Pierre Leroy - 0678901234');
    END IF;
    
    IF transp4_id IS NULL THEN
        transp4_id := gen_random_uuid();
        INSERT INTO transporteurs (id, nom, contact) VALUES
        (transp4_id, 'Euro-Logistics', 'Marie Dubois - 0611223344');
    END IF;

    SELECT id INTO prod1_id FROM produits WHERE reference = 'REF-PC-4K' LIMIT 1;
    SELECT id INTO prod2_id FROM produits WHERE reference = 'REF-PL-300' LIMIT 1;
    SELECT id INTO prod3_id FROM produits WHERE reference = 'REF-VIS-INOX' LIMIT 1;
    SELECT id INTO prod4_id FROM produits WHERE reference = 'REF-OSB-12' LIMIT 1;
    SELECT id INTO prod5_id FROM produits WHERE reference = 'REF-LAM-18' LIMIT 1;
    SELECT id INTO prod6_id FROM produits WHERE reference = 'REF-MB-22' LIMIT 1;
    IF prod1_id IS NULL THEN
        prod1_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod1_id, 'REF-PC-4K', 'Panneau Contreplaqué 4 mm', 'Panneau standard pour construction légère');
    END IF;
    
    IF prod2_id IS NULL THEN
        prod2_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod2_id, 'REF-PL-300', 'Palette Europe EPAL', 'Palette normalisée pour stockage et transport');
    END IF;
    
    IF prod3_id IS NULL THEN
        prod3_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod3_id, 'REF-VIS-INOX', 'Boîte de Vis Inox', 'Résistance à la corrosion, usage extérieur');
    END IF;
    
    IF prod4_id IS NULL THEN
        prod4_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod4_id, 'REF-OSB-12', 'Panneau OSB 12 mm', 'Panneau à copeaux orientés pour isolation et construction');
    END IF;
    
    IF prod5_id IS NULL THEN
        prod5_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod5_id, 'REF-LAM-18', 'Panneau Lamellé 18 mm', 'Panneau haute résistance pour usage structurel');
    END IF;
    
    IF prod6_id IS NULL THEN
        prod6_id := gen_random_uuid();
        INSERT INTO produits (id, reference, nom, description) VALUES
        (prod6_id, 'REF-MB-22', 'Madrier Bois 220 x 80 mm', 'Madrier de construction charpente');
    END IF;

    DO $col_check$ 
    BEGIN
        BEGIN
            ALTER TABLE chargements ADD COLUMN IF NOT EXISTS nom TEXT;
            ALTER TABLE chargements ADD COLUMN IF NOT EXISTS date_depart TIMESTAMP;
            ALTER TABLE chargements ADD COLUMN IF NOT EXISTS date_arrivee TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END $col_check$;
    
    SELECT id INTO charge1_id FROM chargements WHERE client_id = client1_id AND transporteur_id = transp1_id AND nom = 'Livraison mensuelle' LIMIT 1;
    SELECT id INTO charge2_id FROM chargements WHERE client_id = client2_id AND transporteur_id = transp2_id AND nom = 'Commande urgente' LIMIT 1;
    SELECT id INTO charge3_id FROM chargements WHERE client_id = client3_id AND transporteur_id = transp1_id AND nom = 'Expédition hebdomadaire' LIMIT 1;
    IF charge1_id IS NULL THEN
        charge1_id := gen_random_uuid();
        BEGIN
            INSERT INTO chargements (id, nom, date_creation, date_depart, date_arrivee, client_id, transporteur_id) VALUES
            (charge1_id, 'Livraison mensuelle', now() - INTERVAL '3 days', now() - INTERVAL '2 days', now(), client1_id, transp1_id);
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO chargements (id, date_creation, client_id, transporteur_id) VALUES
            (charge1_id, now() - INTERVAL '3 days', client1_id, transp1_id);
        END;
    ELSE
        BEGIN
            UPDATE chargements 
            SET nom = 'Livraison mensuelle',
                date_depart = now() - INTERVAL '2 days',
                date_arrivee = now()
            WHERE id = charge1_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    
    -- Chargement 2: En cours (avec date départ mais pas de date arrivée)
    IF charge2_id IS NULL THEN
        charge2_id := gen_random_uuid();
        BEGIN
            INSERT INTO chargements (id, nom, date_creation, date_depart, date_arrivee, client_id, transporteur_id) VALUES
            (charge2_id, 'Commande urgente', now() - INTERVAL '1 day', now() - INTERVAL '8 hours', NULL, client2_id, transp2_id);
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO chargements (id, date_creation, client_id, transporteur_id) VALUES
            (charge2_id, now() - INTERVAL '1 day', client2_id, transp2_id);
        END;
    ELSE
        BEGIN
            UPDATE chargements 
            SET nom = 'Commande urgente',
                date_depart = now() - INTERVAL '8 hours',
                date_arrivee = NULL
            WHERE id = charge2_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;
    
    -- Chargement 3: Non parti (pas de date départ, pas de date arrivée)
    IF charge3_id IS NULL THEN
        charge3_id := gen_random_uuid();
        BEGIN
            INSERT INTO chargements (id, nom, date_creation, date_depart, date_arrivee, client_id, transporteur_id) VALUES
            (charge3_id, 'Expédition hebdomadaire', now() - INTERVAL '12 hours', NULL, NULL, client3_id, transp1_id);
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO chargements (id, date_creation, client_id, transporteur_id) VALUES
            (charge3_id, now() - INTERVAL '12 hours', client3_id, transp1_id);
        END;
    ELSE
        BEGIN
            UPDATE chargements 
            SET nom = 'Expédition hebdomadaire',
                date_depart = NULL,
                date_arrivee = NULL
            WHERE id = charge3_id;
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END IF;

    DELETE FROM chargement_produits WHERE chargement_id = charge1_id;
    DELETE FROM chargement_produits WHERE chargement_id = charge2_id;
    DELETE FROM chargement_produits WHERE chargement_id = charge3_id;
    INSERT INTO chargement_produits (chargement_id, produit_id, quantite) VALUES
    (charge1_id, prod1_id, 150.00),
    (charge1_id, prod2_id, 5.00);

    INSERT INTO chargement_produits (chargement_id, produit_id, quantite) VALUES
    (charge2_id, prod2_id, 2.00),
    (charge2_id, prod3_id, 85.50);
    INSERT INTO chargement_produits (chargement_id, produit_id, quantite) VALUES
    (charge3_id, prod1_id, 75.00),
    (charge3_id, prod3_id, 120.00),
    (charge3_id, prod4_id, 30.00);

END $$;