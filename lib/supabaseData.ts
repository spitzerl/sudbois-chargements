import { supabase } from '@/lib/supabaseClient'; 

export type Client = { id: string; nom: string };
export type Transporteur = { id: string; nom: string };
export type Chargement = {
  id: string;
  date_creation: string;
  clients: { nom: string }[] | { nom: string } | null; 
  transporteurs: { nom: string }[] | { nom: string } | null;
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

export async function fetchChargements() {
  const { data, error } = await supabase
    .from('chargements')
    .select(`
      id, 
      date_creation, 
      clients:client_id(nom), 
      transporteurs:transporteur_id(nom)
    `) 
    .order('date_creation', { ascending: false });
  
  if (error) throw error;
  
  return data as Chargement[];
}
export async function createChargement(clientId: string, transporteurId: string) {
  const { error } = await supabase
    .from('chargements')
    .insert({ client_id: clientId, transporteur_id: transporteurId });
  
  if (error) throw error;
  return true;
}