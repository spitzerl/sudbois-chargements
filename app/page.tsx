'use client'; //composant côté client

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Import du client initialisé

type Client = {
  id: string;
  nom: string;
  adresse: string | null;
};

export default function Home() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchClients() {
      // Interroge la table 'clients'
      const { data, error } = await supabase
        .from('clients')
        .select('*');

      if (error) {
        console.error('Erreur lors de la récupération des clients:', error);
      } else {
        setClients(data as Client[]);
      }
      setLoading(false);
    }

    fetchClients();
  }, []);

  return (
    <div className="font-sans min-h-screen p-8">
      <main className="flex flex-col gap-8 items-start">
        <h1 className="text-3xl font-bold">Liste des Clients</h1>

        {loading ? (
          <p>Chargement des données...</p>
        ) : (
          <div className="w-full">
            {/* Utilisation du composant Table de shadcn/ui pour l'affichage */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">ID</th>
                  <th className="text-left p-2 border-b">Nom</th>
                  <th className="text-left p-2 border-b">Adresse</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-100">
                    <td className="p-2">{client.id.substring(0, 8)}...</td>
                    <td className="p-2">{client.nom}</td>
                    <td className="p-2">{client.adresse || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-8 text-sm text-gray-500">
          Cette page affiche les données récupérées de Supabase.
        </p>
      </main>
      {/* Reste du footer de votre page.tsx original */}
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        {/* ... (éléments de footer) ... */}
      </footer>
    </div>
  );
}