'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, PlusIcon } from 'lucide-react'; 

import { 
    fetchClients, 
    fetchTransporteurs, 
    fetchChargements, 
    createChargement,
    Client,
    Transporteur,
    Chargement
} from '@/lib/supabaseData';

import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label'; 


function ChargementCard({ charge }: { charge: Chargement }) {
  let clientName = 'Inconnu';
  let transporteurName = 'Inconnu';
  
  if (Array.isArray(charge.clients) && charge.clients.length > 0) {
    clientName = charge.clients[0].nom;
  } 
  else if (charge.clients && typeof charge.clients === 'object' && 'nom' in charge.clients) {
    clientName = (charge.clients as { nom: string }).nom;
  }
  
  if (Array.isArray(charge.transporteurs) && charge.transporteurs.length > 0) {
    transporteurName = charge.transporteurs[0].nom;
  }
  else if (charge.transporteurs && typeof charge.transporteurs === 'object' && 'nom' in charge.transporteurs) {
    transporteurName = (charge.transporteurs as { nom: string }).nom;
  }
  
  const timeOnly = format(new Date(charge.date_creation), 'HH:mm');

  return (
    <div className="border rounded-lg p-4 space-y-2 bg-card shadow-lg transition-all hover:bg-muted/20">
      <div className="flex items-center gap-2 border-b pb-2">
        <div className="bg-primary/10 p-1.5 rounded-full">
          <div className="size-2 rounded-full bg-primary"></div>
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-primary truncate">
          Chargement #{charge.id.substring(0, 6)}
        </h3>
      </div>
      
      <div className="bg-muted/20 rounded-md px-2 py-1 text-xs inline-block">
        {format(new Date(charge.date_creation), 'dd/MM/yyyy')} <span className="font-mono">{timeOnly}</span>
      </div>
      
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mt-2">
        <div className="flex items-center text-muted-foreground">Client:</div>
        <div className="font-medium truncate">{clientName}</div>
        
        <div className="flex items-center text-muted-foreground">Transporteur:</div>
        <div className="truncate">{transporteurName}</div>
      </div>
    </div>
  );
}


function NewChargementForm({ onChargementCreated, clients, transporteurs }: { 
    onChargementCreated: () => void, 
    clients: Client[], 
    transporteurs: Transporteur[] 
}) {
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTransporteur, setSelectedTransporteur] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClient || !selectedTransporteur) {
      setError('Veuillez sélectionner un client ET un transporteur.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createChargement(selectedClient, selectedTransporteur);
      
      alert('Chargement créé avec succès !');
      setSelectedClient('');
      setSelectedTransporteur('');
      onChargementCreated();
      
    } catch (err: unknown) {
      let errorMessage = 'Échec de la création du chargement.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (clients.length === 0 || transporteurs.length === 0) {
    return (
        <div className="border p-4 rounded-lg bg-card shadow-lg flex justify-center items-center">
            <p className="text-muted-foreground">Chargement des listes de sélection...</p>
        </div>
    );
  }

  return (
    <div className="border p-4 rounded-lg bg-card shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">Ajouter un chargement</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
        
        <div className="grid gap-1.5">
          <Label htmlFor="client-select" className="text-sm">Client</Label>
          <Select 
            onValueChange={setSelectedClient} 
            value={selectedClient} 
            name="client_id"
          >
            <SelectTrigger id="client-select" className="h-10">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="transporteur-select" className="text-sm">Transporteur</Label>
          <Select 
            onValueChange={setSelectedTransporteur} 
            value={selectedTransporteur} 
            name="transporteur_id"
          >
            <SelectTrigger id="transporteur-select" className="h-10">
              <SelectValue placeholder="Sélectionner un transporteur" />
            </SelectTrigger>
            <SelectContent>
              {transporteurs.map((transp) => (
                <SelectItem key={transp.id} value={transp.id}>
                  {transp.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="h-10 font-medium"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <PlusIcon className="size-4 mr-2" />
          )}
          Ajouter
        </Button>

      </form>
      {error && <p className="text-destructive text-sm mt-4">{error}</p>}
    </div>
  );
}

export default function ChargementsDashboard() {
  const [chargements, setChargements] = useState<Chargement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [chargementsData, clientsData, transporteursData] = await Promise.all([
        fetchChargements(),
        fetchClients(),
        fetchTransporteurs(),
      ]);


      
      setChargements(chargementsData);
      setClients(clientsData);
      setTransporteurs(transporteursData);

    } catch (err: unknown) {
      let errorMessage = 'Erreur lors du chargement des données.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        errorMessage = (err as { message: string }).message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]); 

  return (
    <div className="font-sans min-h-screen px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gestion des chargements et de leur contenu.
        </p>
      </header>

      <main className="flex flex-col gap-6 sm:gap-10">
        
        <NewChargementForm 
          onChargementCreated={loadData}
          clients={clients}
          transporteurs={transporteurs}
        />
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-2 mb-4">
            <h2 className="text-2xl font-semibold">Liste des chargements</h2>
        </div>

        {error && (
          <div className="text-destructive p-4 border border-destructive rounded">
            Erreur de données: {error}
          </div>
        )}

        {loading && !error ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {chargements.length} chargement{chargements.length !== 1 ? 's' : ''} au total
            </p>
            
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chargements.length === 0 ? (
                <div className="text-center col-span-full bg-muted/20 rounded-lg p-8">
                  <p className="text-muted-foreground">Aucun chargement trouvé.</p>
                </div>
              ) : (
                chargements.map((charge) => (
                  <ChargementCard key={charge.id} charge={charge} />
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}