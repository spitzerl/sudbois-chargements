'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, PlusIcon, Trash2, Eye, Pencil, AlertCircle } from 'lucide-react'; 

import { 
    fetchClients, 
    fetchTransporteurs, 
    fetchChargements, 
    fetchProduits,
    createChargement,
    updateChargement,
    deleteChargement,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


function ChargementCard({ charge, onUpdate, onDelete }: { 
  charge: Chargement, 
  onUpdate: () => void, 
  onDelete: (id: string) => void 
}) {
  const [isModifying, setIsModifying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modifiedChargement, setModifiedChargement] = useState({
    nom: charge.nom || '',
    date_depart: charge.date_depart || '',
    date_arrivee: charge.date_arrivee || '',
    client_id: charge.client_id,
    transporteur_id: charge.transporteur_id
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  
  // Charger les clients et transporteurs pour le formulaire de modification
  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsData, transporteursData] = await Promise.all([
          fetchClients(),
          fetchTransporteurs()
        ]);
        setClients(clientsData);
        setTransporteurs(transporteursData);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };
    
    // Ne charger les données que si le chargement est en modification
    if (isModifying) {
      loadData();
    }
  }, [isModifying]);
  
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
          color: 'bg-yellow-500', 
          text: 'Acheminement en cours'
        };
      default: 
        return { 
          color: 'bg-red-500', 
          text: 'En préparation'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  // Vérifier si le chargement peut être modifié (pas encore parti)
  const canModify = charge.status === 'non_parti';
  
  // Formater les dates
  const timeOnly = format(new Date(charge.date_creation), 'HH:mm');
  const chargementName = charge.nom || `#${charge.id.substring(0, 6)}`;
  
  // Gérer la soumission du formulaire de modification
  const handleSubmitModification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Préparer les mises à jour
      const updates = {
        nom: modifiedChargement.nom || undefined,
        client_id: modifiedChargement.client_id,
        transporteur_id: modifiedChargement.transporteur_id,
        date_depart: modifiedChargement.date_depart || null,
        date_arrivee: modifiedChargement.date_arrivee || null
      };
      
      // Mettre à jour le chargement
      await updateChargement(charge.id, updates);
      setIsModifying(false);
      onUpdate();
    } catch (err: unknown) {
      let errorMessage = 'Échec de la modification du chargement.';
      
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
  
  // Gérer la suppression d'un chargement
  const handleDeleteChargement = async () => {
    setIsSubmitting(true);
    try {
      await deleteChargement(charge.id);
      setIsDeleting(false);
      onDelete(charge.id);
    } catch (err) {
      let errorMessage = 'Échec de la suppression du chargement.';
      
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
      
      {/* Bouton pour voir les détails */}
      <div className="pt-2 mt-2 border-t">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="size-4 mr-2" /> Voir les détails
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Détails du chargement {chargementName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4 space-y-8">
              {/* ID du chargement */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-blue-800 dark:text-blue-300">Informations générales</h3>
                <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">ID du chargement</p>
                  <p className="font-mono">{charge.id}</p>
                </div>
                
                {/* Statut actuel - déplacé ici */}
                <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md mt-2 flex gap-2 items-center">
                  <div className={`size-4 rounded-full ${statusInfo.color}`}></div>
                  <p className="font-medium">Statut actuel: {statusInfo.text}</p>
                </div>
              </div>
              
              {/* Dates complètes */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800/40 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-green-800 dark:text-green-300">Dates du chargement</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Date de création</p>
                    <p className="font-medium">
                      {format(new Date(charge.date_creation), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(new Date(charge.date_creation), 'HH:mm:ss')}
                    </p>
                  </div>
                  
                  <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Date d&apos;expédition</p>
                    {charge.date_depart ? (
                      <>
                        <p className="font-medium">
                          {format(new Date(charge.date_depart), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(charge.date_depart), 'HH:mm:ss')}
                        </p>
                      </>
                    ) : (
                      <p className="italic text-muted-foreground">Non définie</p>
                    )}
                  </div>
                  
                  <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Date de livraison</p>
                    {charge.date_arrivee ? (
                      <>
                        <p className="font-medium">
                          {format(new Date(charge.date_arrivee), 'dd/MM/yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {format(new Date(charge.date_arrivee), 'HH:mm:ss')}
                        </p>
                      </>
                    ) : (
                      <p className="italic text-muted-foreground">Non définie</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Informations sur le client et le transporteur */}
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-100 dark:border-amber-800/40 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-amber-800 dark:text-amber-300">Parties concernées</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-md font-medium mb-2 text-amber-700 dark:text-amber-400">Client</h4>
                    <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                      <p className="font-medium">{clientName}</p>
                      <p className="text-sm text-muted-foreground">ID: {charge.client_id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-md font-medium mb-2 text-amber-700 dark:text-amber-400">Transporteur</h4>
                    <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                      <p className="font-medium">{transporteurName}</p>
                      <p className="text-sm text-muted-foreground">ID: {charge.transporteur_id}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Produits détaillés */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/40 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-300">Contenu du chargement</h3>
                {charge.produits && charge.produits.length > 0 ? (
                  <div className="bg-white/80 dark:bg-slate-800/50 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead className="bg-purple-100 dark:bg-purple-900/30">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-purple-800 dark:text-purple-200">Produit</th>
                          <th className="text-right p-3 text-sm font-medium text-purple-800 dark:text-purple-200">Quantité</th>
                          <th className="text-left p-3 text-sm font-medium text-purple-800 dark:text-purple-200">Référence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charge.produits.map((produit) => {
                          // Simplification de l'extraction du nom du produit
                          let produitNom = "Produit inconnu";
                          const produitId = produit.produit_id || "";
                          
                          try {
                            if (produit.produits) {
                              // Nouvelle structure : produit.produits est directement l'objet produit
                              if (typeof produit.produits === 'object') {
                                produitNom = (produit.produits as { nom: string }).nom || "Sans nom";
                              }
                            }
                          } catch (error) {
                            console.error("Erreur d'extraction du nom du produit dans la vue détaillée:", error);
                          }
                          
                          return (
                            <tr key={produit.id} className="border-t border-purple-100 dark:border-purple-800/30">
                              <td className="p-3">{produitNom}</td>
                              <td className="p-3 text-right">{produit.quantite}</td>
                              <td className="p-3 text-sm font-mono text-muted-foreground">
                                {produitId}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-slate-800/50 p-4 rounded-md text-center">
                    <p className="text-muted-foreground italic">Aucun produit associé à ce chargement</p>
                  </div>
                )}
              </div>
              
              {/* Options de modification et suppression - présentes pour tous les chargements mais désactivées si non modifiable */}
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800/40 shadow-sm">
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-300">Actions</h3>
                
                {!canModify && (
                  <div className="mb-2 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded text-sm">
                    <p>Ce chargement ne peut plus être modifié car il a déjà été expédié ou livré.</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsModifying(true)}
                    disabled={!canModify}
                  >
                    <Pencil className="size-4 mr-2" /> Modifier le chargement
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => setIsDeleting(true)}
                    disabled={!canModify}
                  >
                    <AlertCircle className="size-4 mr-2" /> Annuler le chargement
                  </Button>
                </div>
              </div>

              {/* Formulaire de modification */}
              {isModifying && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-300">Modifier le chargement</h3>
                  
                  <form onSubmit={handleSubmitModification} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="nom-edit">Nom du chargement</Label>
                        <Input
                          id="nom-edit"
                          value={modifiedChargement.nom}
                          onChange={(e) => setModifiedChargement({...modifiedChargement, nom: e.target.value})}
                          placeholder="Nom du chargement"
                        />
                      </div>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="client-select-edit">Client</Label>
                        <Select 
                          value={modifiedChargement.client_id}
                          onValueChange={(value) => setModifiedChargement({...modifiedChargement, client_id: value})}
                        >
                          <SelectTrigger id="client-select-edit">
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
                        <Label htmlFor="transporteur-select-edit">Transporteur</Label>
                        <Select 
                          value={modifiedChargement.transporteur_id}
                          onValueChange={(value) => setModifiedChargement({...modifiedChargement, transporteur_id: value})}
                        >
                          <SelectTrigger id="transporteur-select-edit">
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
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="date-depart-edit">Date de départ</Label>
                        <Input
                          id="date-depart-edit"
                          type="date"
                          value={modifiedChargement.date_depart}
                          onChange={(e) => setModifiedChargement({...modifiedChargement, date_depart: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="date-arrivee-edit">Date d&apos;arrivée</Label>
                        <Input
                          id="date-arrivee-edit"
                          type="date"
                          value={modifiedChargement.date_arrivee}
                          onChange={(e) => setModifiedChargement({...modifiedChargement, date_arrivee: e.target.value})}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsModifying(false)}
                        disabled={isSubmitting}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : null}
                        Enregistrer
                      </Button>
                    </div>
                    
                    {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                  </form>
                </div>
              )}

              {/* Confirmation de suppression */}
              {isDeleting && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800/40 shadow-sm">
                  <h3 className="text-lg font-semibold mb-3 text-red-800 dark:text-red-300">Confirmer l&apos;annulation</h3>
                  <p className="mb-4">Êtes-vous sûr de vouloir annuler ce chargement ? Cette action est irréversible.</p>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDeleting(false)}
                      disabled={isSubmitting}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteChargement}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : null}
                      Confirmer la suppression
                    </Button>
                  </div>
                  
                  {error && <p className="text-destructive text-sm mt-2">{error}</p>}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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

  // Gérer la suppression d'un chargement
  const handleDeleteChargement = (id: string) => {
    // Mettre à jour la liste locale immédiatement pour une UX plus réactive
    setChargements((prevChargements) => prevChargements.filter(c => c.id !== id));
  };

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
                  <ChargementCard 
                    key={charge.id} 
                    charge={charge} 
                    onUpdate={loadData} 
                    onDelete={handleDeleteChargement} 
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}