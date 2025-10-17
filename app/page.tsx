'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, PlusIcon, Trash2 } from 'lucide-react'; 

import { 
    fetchClients, 
    fetchTransporteurs, 
    fetchChargements, 
    fetchProduits,
    createChargement,
    Client,
    Transporteur,
    Chargement,
    Produit
} from '@/lib/supabaseData';

import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


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
  
  // Obtenir les informations de statut
  const getStatusInfo = () => {
    switch(charge.status) {
      case 'livre': 
        return { 
          color: 'bg-green-500', 
          text: 'Livré'
        };
      case 'en_cours': 
        return { 
          color: 'bg-orange-500', 
          text: 'En cours'
        };
      default: 
        return { 
          color: 'bg-red-500', 
          text: 'Non expédié'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  // Formater les dates
  const timeOnly = format(new Date(charge.date_creation), 'HH:mm');
  const chargementName = charge.nom || `#${charge.id.substring(0, 6)}`;

  return (
    <div className="border rounded-lg p-4 space-y-2 bg-card shadow-lg transition-all hover:bg-muted/20">
      <div className="flex justify-start mb-1">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 text-foreground text-xs font-medium shrink-0">
          <div className={`size-2 rounded-full ${statusInfo.color}`}></div>
          <span>{statusInfo.text}</span>
        </div>
      </div>
      
      <div className="border-b pb-2">
        <h3 className="text-base sm:text-lg font-semibold text-primary truncate">
          {chargementName}
        </h3>
      </div>
      
      <div className="text-xs text-muted-foreground">
        ID: {charge.id.substring(0, 10)}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-muted/20 rounded-md px-2 py-1">
          <span className="block text-muted-foreground">Créé le:</span>
          {format(new Date(charge.date_creation), 'dd/MM/yyyy')} <span className="font-mono">{timeOnly}</span>
        </div>
        
        <div className="bg-muted/20 rounded-md px-2 py-1">
          <span className="block text-muted-foreground">Expédition prévue:</span>
          {charge.date_depart 
            ? format(new Date(charge.date_depart), 'dd/MM/yyyy') 
            : <span className="italic text-muted-foreground">Non définie</span>}
        </div>
        
        <div className="bg-muted/20 rounded-md px-2 py-1">
          <span className="block text-muted-foreground">Livraison prévue:</span>
          {charge.date_arrivee 
            ? format(new Date(charge.date_arrivee), 'dd/MM/yyyy') 
            : <span className="italic text-muted-foreground">Non définie</span>}
        </div>
      </div>
      
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm mt-2">
        <div className="flex items-center text-muted-foreground">Client:</div>
        <div className="font-medium truncate">{clientName}</div>
        
        <div className="flex items-center text-muted-foreground">Transporteur:</div>
        <div className="truncate">{transporteurName}</div>
        
        {charge.produits && charge.produits.length > 0 && (
          <>
            <div className="flex items-center text-muted-foreground col-span-2 mt-2 border-t pt-2">
              <span className="font-medium">Produits</span>
            </div>
            <div className="col-span-2">
              <div className="grid gap-1">
                {charge.produits.map((produit) => {
                  const produitNom = produit.produits && (
                    Array.isArray(produit.produits) 
                      ? produit.produits[0]?.nom 
                      : (produit.produits as unknown as { nom: string })?.nom
                  );
                  return (
                    <div key={produit.id} className="flex items-center justify-between text-xs bg-muted/10 px-3 py-1.5 rounded-md">
                      <span className="font-medium">{produitNom}</span>
                      <span className="bg-muted/30 px-2 py-0.5 rounded-full">{produit.quantite}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
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
  const [nomChargement, setNomChargement] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [dateArrivee, setDateArrivee] = useState('');
  const [produits, setProduits] = useState<{id: string, produitId: string, nom: string, quantite: number}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableProduits, setAvailableProduits] = useState<Produit[]>([]);
  const [selectedProduit, setSelectedProduit] = useState('');
  const [quantiteProduit, setQuantiteProduit] = useState(1);
  const [showProduitForm, setShowProduitForm] = useState(false);

  useEffect(() => {
    const loadProduits = async () => {
      try {
        const produitsData = await fetchProduits();
        setAvailableProduits(produitsData);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      }
    };

    loadProduits();
  }, []);

  const handleAddProduit = () => {
    if (!selectedProduit || quantiteProduit <= 0) {
      setError('Veuillez sélectionner un produit et une quantité valide');
      return;
    }

    const produit = availableProduits.find(p => p.id === selectedProduit);
    if (!produit) return;

    setProduits([...produits, {
      id: `temp-${Date.now()}`,
      produitId: produit.id,
      nom: produit.nom,
      quantite: quantiteProduit
    }]);

    // Reset les valeurs
    setSelectedProduit('');
    setQuantiteProduit(1);
    setShowProduitForm(false);
    setError(null);
  };

  const handleRemoveProduit = (id: string) => {
    setProduits(produits.filter(p => p.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedClient || !selectedTransporteur) {
      setError('Veuillez sélectionner un client ET un transporteur.');
      return;
    }

    setIsSubmitting(true);
    try {
      const produitsToSend = produits.map(p => ({
        produitId: p.produitId,
        quantite: p.quantite
      }));

      await createChargement(
        selectedClient, 
        selectedTransporteur, 
        nomChargement || undefined,
        dateDepart || undefined,
        dateArrivee || undefined,
        produitsToSend.length > 0 ? produitsToSend : undefined
      );
      
      alert('Chargement créé avec succès !');
      // Reset le formulaire
      setSelectedClient('');
      setSelectedTransporteur('');
      setNomChargement('');
      setDateDepart('');
      setDateArrivee('');
      setProduits([]);
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
          {/* Informations de base */}
          <div className="grid gap-1.5">
            <Label htmlFor="nom-chargement" className="text-sm">Nom (optionnel)</Label>
            <Input 
              id="nom-chargement"
              value={nomChargement} 
              onChange={(e) => setNomChargement(e.target.value)}
              placeholder="Nom du chargement" 
              className="h-10"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="client-select" className="text-sm">Client*</Label>
            <Select 
              onValueChange={setSelectedClient} 
              value={selectedClient} 
              name="client_id"
              required
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
            <Label htmlFor="transporteur-select" className="text-sm">Transporteur*</Label>
            <Select 
              onValueChange={setSelectedTransporteur} 
              value={selectedTransporteur} 
              name="transporteur_id"
              required
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
          
          {/* Dates */}
          <div className="grid gap-1.5">
            <Label htmlFor="date-depart" className="text-sm">Date de départ</Label>
            <Input 
              id="date-depart" 
              type="date" 
              value={dateDepart} 
              onChange={(e) => setDateDepart(e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="grid gap-1.5">
            <Label htmlFor="date-arrivee" className="text-sm">Date d&apos;arrivée</Label>
            <Input 
              id="date-arrivee" 
              type="date" 
              value={dateArrivee} 
              onChange={(e) => setDateArrivee(e.target.value)}
              className="h-10"
            />
          </div>
        </div>

        {/* Section Produits */}
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-md font-medium">Produits associés</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowProduitForm(!showProduitForm)}
            >
              <PlusIcon className="size-4 mr-2" />
              Ajouter un produit
            </Button>
          </div>

          {showProduitForm && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 bg-muted/20 rounded-lg">
              <div className="grid gap-1.5">
                <Label htmlFor="produit-select" className="text-sm">Produit</Label>
                <Select 
                  onValueChange={setSelectedProduit} 
                  value={selectedProduit}
                >
                  <SelectTrigger id="produit-select" className="h-10">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProduits.map((produit) => (
                      <SelectItem key={produit.id} value={produit.id}>
                        {produit.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="quantite" className="text-sm">Quantité</Label>
                <Input 
                  id="quantite" 
                  type="number" 
                  min="1" 
                  value={quantiteProduit} 
                  onChange={(e) => setQuantiteProduit(parseInt(e.target.value) || 1)}
                  className="h-10"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={handleAddProduit}
                  className="h-10 w-full"
                >
                  Ajouter
                </Button>
              </div>
            </div>
          )}

          {produits.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/20">
                  <tr>
                    <th className="text-left p-2 text-sm font-medium">Produit</th>
                    <th className="text-right p-2 text-sm font-medium">Quantité</th>
                    <th className="text-center p-2 w-16 text-sm font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((produit) => (
                    <tr key={produit.id} className="border-t">
                      <td className="p-2">{produit.nom}</td>
                      <td className="p-2 text-right">{produit.quantite}</td>
                      <td className="p-2 text-center">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleRemoveProduit(produit.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun produit associé</p>
          )}
        </div>

        <div className="border-t pt-4 flex justify-end">
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
            Créer le chargement
          </Button>
        </div>
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