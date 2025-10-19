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

// Récupère les chargements avec leurs relations et calcule le statut
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

// Crée un chargement avec ses produits associés
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

// Met à jour les produits d'un chargement
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

// Supprime un chargement et ses produits
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

// Fonctions CRUD pour les clients

// Crée un client
export async function createClient(nom: string, adresse?: string) {
  const { data, error } = await supabase
    .from('clients')
    .insert({ nom, adresse })
    .select('id')
    .single();
  
  if (error) throw error;
  return data;
}

// Met à jour un client
export async function updateClient(id: string, nom: string, adresse?: string) {
  const { error } = await supabase
    .from('clients')
    .update({ nom, adresse })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Supprime un client
export async function deleteClient(id: string) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Récupère les détails d'un client
export async function fetchClientDetails(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Fonctions CRUD pour les transporteurs

// Crée un transporteur
export async function createTransporteur(nom: string, contact?: string) {
  const { data, error } = await supabase
    .from('transporteurs')
    .insert({ nom, contact })
    .select('id')
    .single();
  
  if (error) throw error;
  return data;
}

// Met à jour un transporteur
export async function updateTransporteur(id: string, nom: string, contact?: string) {
  const { error } = await supabase
    .from('transporteurs')
    .update({ nom, contact })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Supprime un transporteur
export async function deleteTransporteur(id: string) {
  const { error } = await supabase
    .from('transporteurs')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Récupère les détails d'un transporteur
export async function fetchTransporteurDetails(id: string) {
  const { data, error } = await supabase
    .from('transporteurs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

// Fonctions CRUD pour les produits

// Crée un produit
export async function createProduit(nom: string, description?: string) {
  const { data, error } = await supabase
    .from('produits')
    .insert({ nom, description })
    .select('id')
    .single();
  
  if (error) throw error;
  return data;
}

// Met à jour un produit
export async function updateProduit(id: string, nom: string, description?: string) {
  const { error } = await supabase
    .from('produits')
    .update({ nom, description })
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Supprime un produit
export async function deleteProduit(id: string) {
  const { error } = await supabase
    .from('produits')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Récupère les détails d'un produit
export async function fetchProduitDetails(id: string) {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}