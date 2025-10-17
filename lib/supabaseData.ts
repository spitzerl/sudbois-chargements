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
  produits?: { id: string; nom: string }[];
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
    
    // Récupérer les produits associés
    const { data: produitsData } = await supabase
      .from('chargement_produits')
      .select(`
        id,
        produit_id,
        quantite,
        produits:produit_id(id, nom)
      `)
      .eq('chargement_id', charge.id);
    
    return {
      ...charge,
      clients: clientData,
      transporteurs: transporteurData,
      produits: produitsData || []
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
    
    return {
      ...charge,
      status
    };
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