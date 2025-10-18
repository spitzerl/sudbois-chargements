import { supabase } from '@/lib/supabaseClient'; 

export type Client = { id: string; nom: string };
export type Transporteur = { id: string; nom: string };
export type Produit = { 
  id: string; 
  nom: string; 
  description?: string;
};

export type ProduitChargement = {
  id: string;
  chargement_id?: string;
  produit_id: string;
  quantite: number;
  produits?: { id: string; nom: string }[] | { id: string; nom: string };
};

export type Chargement = {
  id: string;
  nom?: string;
  date_creation: string;
  date_depart?: string | null;
  date_arrivee?: string | null;
  client_id: string;
  transporteur_id: string;
  clients: { nom: string }[] | { nom: string } | null;
  transporteurs: { nom: string }[] | { nom: string } | null;
  produits?: ProduitChargement[];
  status?: 'non_parti' | 'en_cours' | 'livre';
};


export async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('id, nom').order('nom');
  if (error) throw error;
  return data as Client[];
}

export async function fetchTransporteurs() {
  const { data, error } = await supabase.from('transporteurs').select('id, nom').order('nom');
  if (error) throw error;
  return data as Transporteur[];
}

export async function fetchProduits() {
  const { data, error } = await supabase.from('produits').select('id, nom, description').order('nom');
  if (error) throw error;
  return data as Produit[];
}

export async function fetchChargements() {
  // Récupérer d'abord les chargements de base
  const { data: chargementsData, error: chargementsError } = await supabase
    .from('chargements')
    .select(`
      id,
      nom,
      date_creation,
      date_depart,
      date_arrivee,
      client_id,
      transporteur_id
    `)
    .order('date_creation', { ascending: false });
  
  if (chargementsError) throw chargementsError;
  
  // Enrichir les données avec les informations complémentaires
  const enrichedChargements = await Promise.all(chargementsData.map(async (charge) => {
    // Récupérer le client
    const { data: clientData } = await supabase
      .from('clients')
      .select('nom')
      .eq('id', charge.client_id)
      .single();
    
    // Récupérer le transporteur
    const { data: transporteurData } = await supabase
      .from('transporteurs')
      .select('nom')
      .eq('id', charge.transporteur_id)
      .single();
    
    // Récupérer les produits associés et leurs informations en une seule requête
    const { data: chargementProduitsData } = await supabase
      .from('chargement_produits')
      .select('id, produit_id, quantite')
      .eq('chargement_id', charge.id);
    
    // Définir un type explicite pour les produits enrichis
    let produitsEnriched: ProduitChargement[] = [];
    
    if (chargementProduitsData && chargementProduitsData.length > 0) {
      console.log(`Traitement de ${chargementProduitsData.length} produits pour le chargement ${charge.id}`);
      
      // Pour chaque produit associé, récupérer les détails du produit
      produitsEnriched = await Promise.all(chargementProduitsData.map(async (produit) => {
        console.log(`Récupération du produit ${produit.produit_id} pour le chargement ${charge.id}`);
        const { data: produitInfo } = await supabase
          .from('produits')
          .select('id, nom')
          .eq('id', produit.produit_id)
          .single();
        
        console.log(`Infos produit ${produit.produit_id}:`, produitInfo);
        
        return {
          id: produit.id,
          chargement_id: charge.id,
          produit_id: produit.produit_id,
          quantite: produit.quantite,
          produits: produitInfo // Stockez directement l'objet produit pour simplifier
        } as ProduitChargement;
      }));
    }
    
    return {
      ...charge,
      clients: clientData,
      transporteurs: transporteurData,
      produits: produitsEnriched
    };
  }));
  
  // Calculer le statut de chaque chargement
  const chargementsWithStatus = enrichedChargements.map(charge => {
    let status: 'non_parti' | 'en_cours' | 'livre' = 'non_parti';
    
    if (charge.date_arrivee) {
      status = 'livre';
    } else if (charge.date_depart) {
      status = 'en_cours';
    }
    
    const result = {
      ...charge,
      status
    };
    
    // Déboguer les produits de chaque chargement
    console.log(`Chargement ${result.id} a ${result.produits?.length || 0} produits:`, 
                result.produits?.map(p => ({ 
                  id: p.id,
                  produit_id: p.produit_id,
                  quantite: p.quantite,
                  produits_info: Array.isArray(p.produits) ? 
                    `tableau de ${p.produits.length} éléments` : 
                    (p.produits ? 'objet unique' : 'absent')
                })));
    
    return result;
  });
  
  return chargementsWithStatus as Chargement[];
}

export async function createChargement(
  clientId: string, 
  transporteurId: string, 
  nom?: string,
  dateDepart?: string,
  dateArrivee?: string,
  produits?: { produitId: string, quantite: number }[]
) {
  // Insérer le chargement de base
  const { data: chargement, error } = await supabase
    .from('chargements')
    .insert({ 
      client_id: clientId, 
      transporteur_id: transporteurId,
      nom,
      date_depart: dateDepart || null,
      date_arrivee: dateArrivee || null
    })
    .select('id')
    .single();
  
  if (error) throw error;
  
  // Si des produits sont fournis, les associer au chargement
  if (produits && produits.length > 0 && chargement) {
    const produitsToInsert = produits.map(p => ({
      chargement_id: chargement.id,
      produit_id: p.produitId,
      quantite: p.quantite
    }));
    
    const { error: produitError } = await supabase
      .from('chargement_produits')
      .insert(produitsToInsert);
    
    if (produitError) throw produitError;
  }
  
  return chargement?.id;
}

export async function updateChargement(
  id: string,
  updates: {
    nom?: string,
    client_id?: string,
    transporteur_id?: string,
    date_depart?: string | null,
    date_arrivee?: string | null
  }
) {
  const { error } = await supabase
    .from('chargements')
    .update(updates)
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

export async function updateChargementProduits(
  id: string,
  produits: { produitId: string, quantite: number }[]
) {
  // 1. Supprimer tous les produits existants associés au chargement
  const { error: deleteError } = await supabase
    .from('chargement_produits')
    .delete()
    .eq('chargement_id', id);
  
  if (deleteError) throw deleteError;

  // 2. Ajouter les nouveaux produits
  if (produits.length > 0) {
    const produitsToInsert = produits.map(p => ({
      chargement_id: id,
      produit_id: p.produitId,
      quantite: p.quantite
    }));
    
    const { error: insertError } = await supabase
      .from('chargement_produits')
      .insert(produitsToInsert);
    
    if (insertError) throw insertError;
  }
  
  return true;
}

export async function deleteChargement(id: string) {
  // D'abord supprimer les relations produits-chargements
  const { error: produitError } = await supabase
    .from('chargement_produits')
    .delete()
    .eq('chargement_id', id);
  
  if (produitError) throw produitError;
  
  // Ensuite supprimer le chargement
  const { error } = await supabase
    .from('chargements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}