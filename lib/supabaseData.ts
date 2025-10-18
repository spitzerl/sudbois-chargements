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

/**
 * Récupère la liste des chargements avec leurs clients, transporteurs et produits associés
 * Calcule également le statut en fonction des dates
 */
export async function fetchChargements() {
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
  
  const enrichedChargements = await Promise.all(chargementsData.map(async (charge) => {
    const { data: clientData } = await supabase
      .from('clients')
      .select('nom')
      .eq('id', charge.client_id)
      .single();
    
    const { data: transporteurData } = await supabase
      .from('transporteurs')
      .select('nom')
      .eq('id', charge.transporteur_id)
      .single();
    
    const { data: chargementProduitsData } = await supabase
      .from('chargement_produits')
      .select('id, produit_id, quantite')
      .eq('chargement_id', charge.id);
    
    let produitsEnriched: ProduitChargement[] = [];
    
    if (chargementProduitsData && chargementProduitsData.length > 0) {
      produitsEnriched = await Promise.all(chargementProduitsData.map(async (produit) => {
        const { data: produitInfo } = await supabase
          .from('produits')
          .select('id, nom')
          .eq('id', produit.produit_id)
          .single();
        
        return {
          id: produit.id,
          chargement_id: charge.id,
          produit_id: produit.produit_id,
          quantite: produit.quantite,
          produits: produitInfo
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
  
  const chargementsWithStatus = enrichedChargements.map(charge => {
    let status: 'non_parti' | 'en_cours' | 'livre' = 'non_parti';
    const now = new Date();
    
    if (charge.date_arrivee && new Date(charge.date_arrivee) <= now) {
      status = 'livre';
    } 
    else if (charge.date_depart) {
      const departDate = new Date(charge.date_depart);
      if (departDate <= now) {
        status = 'en_cours';
      } 
      else {
        status = 'non_parti';
      }
    }
    
    return {
      ...charge,
      status
    };
  });
  
  return chargementsWithStatus as Chargement[];
}

/**
 * Crée un nouveau chargement et associe des produits si fournis
 */
export async function createChargement(
  clientId: string, 
  transporteurId: string, 
  nom?: string,
  dateDepart?: string,
  dateArrivee?: string,
  produits?: { produitId: string, quantite: number }[]
) {
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

/**
 * Met à jour la liste des produits associés à un chargement
 * Supprime tous les produits existants puis en insère de nouveaux
 */
export async function updateChargementProduits(
  id: string,
  produits: { produitId: string, quantite: number }[]
) {
  const { error: deleteError } = await supabase
    .from('chargement_produits')
    .delete()
    .eq('chargement_id', id);
  
  if (deleteError) throw deleteError;
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

/**
 * Supprime un chargement et tous ses produits associés
 */
export async function deleteChargement(id: string) {
  const { error: produitError } = await supabase
    .from('chargement_produits')
    .delete()
    .eq('chargement_id', id);
  
  if (produitError) throw produitError;
  const { error } = await supabase
    .from('chargements')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}