-- 1. Nettoyage des anciennes donnees de demo
DELETE FROM actualites_promotions;
DELETE FROM candidature_historique;
DELETE FROM candidatures;
DELETE FROM offres;
DELETE FROM organismes WHERE nom LIKE 'Entreprise Demo%';
DELETE FROM profils_candidats WHERE utilisateurId IN (SELECT id FROM utilisateurs WHERE email LIKE '%@demo.mg' AND email NOT IN ('candidat.info@demo.mg', 'candidat.gestion@demo.mg', 'candidat.droit@demo.mg'));
DELETE FROM utilisateurs WHERE email LIKE '%@demo.mg' AND email NOT IN ('candidat.info@demo.mg', 'candidat.gestion@demo.mg', 'candidat.droit@demo.mg', 'recruteur.ministere@demo.mg', 'recruteur.entreprise@demo.mg', 'recruteur.ong@demo.mg');

-- 2. Insertion des diplomes de demonstration
DO $$
DECLARE
    v_filiere_id INT;
    v_user_id INT;
    v_i INT;
BEGIN
    FOR v_i IN 1..50 LOOP
        -- Recuperer une filiere au hasard
        SELECT id INTO v_filiere_id FROM filieres ORDER BY random() LIMIT 1;
        
        -- Creer l'utilisateur
        INSERT INTO utilisateurs (nom, email, "motDePasseHash", role, "creeLe")
        VALUES ('Diplome Demo ' || v_i, 'diplome' || v_i || '@demo.mg', '$2b$10$abcdefghijklmnopqrstuv', 'CANDIDAT', NOW() - (random() * 365 || ' days')::interval)
        RETURNING id INTO v_user_id;
        
        -- Creer le profil
        INSERT INTO profils_candidats ("utilisateurId", "niveauEtudes", "filiereId", etablissement, diplomes, competences, "situationPro", verifie, "majLe")
        VALUES (
            v_user_id, 
            'Licence 3', 
            v_filiere_id, 
            'INSI', 
            ARRAY['Licence'], 
            ARRAY['Communication', 'Informatique'], 
            CASE (v_i % 5) 
                WHEN 0 THEN 'EN_RECHERCHE' 
                WHEN 1 THEN 'EN_CDI' 
                WHEN 2 THEN 'EN_CDD' 
                WHEN 3 THEN 'EN_STAGE' 
                ELSE 'INCONNU' 
            END,
            (v_i % 4 = 0),
            NOW()
        );
    END LOOP;
END $$;

-- 3. Insertion des actualites (pour que le dashboard soit vivant)
DO $$
DECLARE
    v_promo_id INT;
BEGIN
    FOR v_promo_id IN SELECT id FROM promotions LOOP
        INSERT INTO actualites_promotions ("promotionId", titre, contenu, type, "creeLe")
        VALUES 
            (v_promo_id, 'Ceremonie de sortie', 'La ceremonie aura lieu le mois prochain.', 'EVENEMENT', NOW()),
            (v_promo_id, 'Nouvelle formation', 'Une formation en developpement web est disponible.', 'FORMATION', NOW()),
            (v_promo_id, 'Offres d emploi', 'De nouvelles offres correspondent a votre profil.', 'INFO', NOW());
    END LOOP;
END $$;