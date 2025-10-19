'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, PlusIcon, Trash2, Eye, XCircle } from 'lucide-react';
import { useNotification } from '@/components/ui/notification'; 

import {
    fetchChargements,
    fetchClients,
    fetchTransporteurs,
    fetchProduits,
    createChargement,
    deleteChargement,
    updateChargement,
    updateChargementProduits,
    Chargement,
    Client,
    Transporteur,
    Produit
} from '@/lib/supabaseData';import { Button } from '@/components/ui/button';
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
import { ViewToggle } from "@/components/ui/tabs/view-toggle";
import { ChargementList } from "@/components/ui/chargement-list";
import { ChargementDetails } from "@/components/ui/chargement-details";


// Carte de chargement avec actions de modification et suppression
function ChargementCard({ charge, onView }: { 
  charge: Chargement, 
  onView?: (chargement: Chargement) => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
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
      case 'non_parti':
      default:
        if (charge.date_depart) {
          const departDate = new Date(charge.date_depart);
          const now = new Date();
          if (departDate > now) {
            return { 
              color: 'bg-blue-500', 
              text: 'Départ prévu'
            };
          }
        }
        return { 
          color: 'bg-red-500', 
          text: 'En préparation'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const timeOnly = format(new Date(charge.date_creation), 'HH:mm');
  const chargementName = charge.nom || `ID: ${charge.id}`;
  
  // Extrait les informations client et transporteur
  let clientName = 'Client inconnu';
  let transporteurName = 'Transporteur inconnu';
  
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

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card shadow-lg transition-all hover:bg-muted/20">
      {/* En-tête de la carte - toujours visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/30 text-foreground text-xs font-medium shrink-0">
          <div className={`size-2 rounded-full ${statusInfo.color}`}></div>
          <span>{statusInfo.text}</span>
        </div>
        
        <div className="sm:hidden">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0.5"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>
      
      <div className="border-b pb-2">
        <h3 className="text-base font-semibold text-primary truncate">
          {chargementName}
        </h3>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {clientName}
          </p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            {transporteurName}
          </p>
        </div>
      </div>
      
      {/* Contenu détaillé - conditionnellement visible */}
      <div className={`sm:block ${isExpanded ? 'block' : 'hidden'}`}>
        {charge.nom && (
          <div className="text-xs text-muted-foreground mb-1">
            ID: {charge.id}
          </div>
        )}
        
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
          
          {/* Informations supplémentaires pour mobile */}
          <div className="sm:hidden bg-muted/20 rounded-md px-2 py-1">
            <span className="block text-muted-foreground">Transporteur:</span>
            {transporteurName}
          </div>
        </div>
      </div>
      
      {/* Bouton pour voir les détails - toujours visible */}
      <div className={`pt-2 mt-2 border-t ${isExpanded ? '' : 'sm:mt-2 mt-0 sm:border-t border-t-0 sm:pt-2 pt-0'}`}>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => onView && onView(charge)}
        >
          <Eye className="size-4 mr-2" /> Détails
        </Button>
      </div>
    </div>
  );
}


// Formulaire de création/modification de chargement
function NewChargementForm({ 
    onChargementCreated, 
    clients, 
    transporteurs,
    chargementToEdit = null,
}: { 
    onChargementCreated: () => void, 
    clients: Client[], 
    transporteurs: Transporteur[],
    chargementToEdit?: Chargement | null
}) {
  const { showNotification } = useNotification();
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

  // Pré-remplir le formulaire si on est en mode édition
  useEffect(() => {
    if (chargementToEdit) {
      setSelectedClient(chargementToEdit.client_id);
      setSelectedTransporteur(chargementToEdit.transporteur_id);
      setNomChargement(chargementToEdit.nom || '');
      setDateDepart(chargementToEdit.date_depart 
        ? new Date(chargementToEdit.date_depart).toISOString().split('T')[0] 
        : '');
      setDateArrivee(chargementToEdit.date_arrivee 
        ? new Date(chargementToEdit.date_arrivee).toISOString().split('T')[0] 
        : '');
      
      // Pré-remplir les produits si disponibles
      if (chargementToEdit.produits && chargementToEdit.produits.length > 0) {
        const formattedProduits = chargementToEdit.produits.map(p => {
          // Récupérer le nom du produit
          let produitNom = '';
          if (p.produits) {
            if (Array.isArray(p.produits) && p.produits.length > 0) {
              produitNom = p.produits[0].nom;
            } else if (typeof p.produits === 'object' && 'nom' in p.produits) {
              produitNom = (p.produits as { nom: string }).nom;
            }
          }
          
          return {
            id: p.id,
            produitId: p.produit_id,
            nom: produitNom,
            quantite: p.quantite
          };
        });
        
        setProduits(formattedProduits);
      }
    }
  }, [chargementToEdit]);

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
    
    if (!nomChargement || nomChargement.trim() === '') {
      setError('Veuillez saisir un nom pour le chargement.');
      return;
    }

    setIsSubmitting(true);
    try {
      const produitsToSend = produits.map(p => ({
        produitId: p.produitId,
        quantite: p.quantite
      }));

      if (chargementToEdit) {
        // Mode modification
        const updates = {
          nom: nomChargement.trim(),
          client_id: selectedClient,
          transporteur_id: selectedTransporteur,
          date_depart: dateDepart || null,
          date_arrivee: dateArrivee || null
        };

        // Mettre à jour les informations de base du chargement
        await updateChargement(chargementToEdit.id, updates);

        // Mettre à jour les produits liés au chargement
        await updateChargementProduits(chargementToEdit.id, produitsToSend);
        
        // Notification via le hook local
        showNotification('Chargement modifié avec succès !', 'success');
      } else {
        // Mode création
        await createChargement(
          selectedClient, 
          selectedTransporteur, 
          nomChargement.trim(),
          dateDepart || undefined,
          dateArrivee || undefined,
          produitsToSend.length > 0 ? produitsToSend : undefined
        );
        
        // Notification via le hook local
        showNotification('Chargement créé avec succès !', 'success');
      }

      // Réinitialisation du formulaire
      setSelectedClient('');
      setSelectedTransporteur('');
      setNomChargement('');
      setDateDepart('');
      setDateArrivee('');
      setProduits([]);
      onChargementCreated();
      
    } catch (err: unknown) {
      let errorMessage = chargementToEdit ? 
        'Échec de la modification du chargement.' : 
        'Échec de la création du chargement.';
      
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
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-end">
          {/* Informations de base */}
          <div className="grid gap-1.5">
            <Label htmlFor="nom-chargement" className="text-sm">Nom du chargement*</Label>
            <Input 
              id="nom-chargement"
              value={nomChargement} 
              onChange={(e) => setNomChargement(e.target.value)}
              placeholder="Nom du chargement" 
              className="h-10"
              required
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

// Dashboard principal des chargements
export default function ChargementsDashboard() {
  const [chargements, setChargements] = useState<Chargement[]>([]);
  const [filteredChargements, setFilteredChargements] = useState<Chargement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showNotification, notificationElements } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'date_creation' | 'date_depart' | 'date_arrivee' | 'status' | 'client' | 'transporteur'>('date_creation');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'non_parti' | 'en_cours' | 'livre'>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterTransporteur, setFilterTransporteur] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedChargement, setSelectedChargement] = useState<Chargement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [newChargementDialogOpen, setNewChargementDialogOpen] = useState(false);

  const sortAndFilterChargements = useCallback(() => {
    let result = [...chargements];
    
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      result = result.filter(charge => 
        (charge.nom?.toLowerCase().includes(lowerCaseSearch) || 
         charge.id.toLowerCase().includes(lowerCaseSearch))
      );
    }
    
    if (filterStatus !== 'all') {
      result = result.filter(charge => charge.status === filterStatus);
    }
    
    if (filterClient !== 'all') {
      result = result.filter(charge => charge.client_id === filterClient);
    }
    
    if (filterTransporteur !== 'all') {
      result = result.filter(charge => charge.transporteur_id === filterTransporteur);
    }
    
    result.sort((a, b) => {
      if (sortOption === 'date_creation') {
        const dateA = new Date(a.date_creation).getTime();
        const dateB = new Date(b.date_creation).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortOption === 'date_depart') {
        // Gérer les cas où date_depart peut être null
        const dateA = a.date_depart ? new Date(a.date_depart).getTime() : 0;
        const dateB = b.date_depart ? new Date(b.date_depart).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortOption === 'date_arrivee') {
        // Gérer les cas où date_arrivee peut être null
        const dateA = a.date_arrivee ? new Date(a.date_arrivee).getTime() : 0;
        const dateB = b.date_arrivee ? new Date(b.date_arrivee).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortOption === 'status') {
        // Tri par statut avec priorité: non_parti > en_cours > livre
        const statusOrder = { non_parti: 0, en_cours: 1, livre: 2 };
        const orderA = statusOrder[a.status || 'non_parti'];
        const orderB = statusOrder[b.status || 'non_parti'];
        return sortDirection === 'asc' ? orderA - orderB : orderB - orderA;
      } else if (sortOption === 'client') {
        // Tri par nom de client
        const clientA = a.clients ? (typeof a.clients === 'object' && 'nom' in a.clients ? 
                      (a.clients as { nom: string }).nom : 
                      (Array.isArray(a.clients) && a.clients.length > 0 ? a.clients[0].nom : '')) : '';
        const clientB = b.clients ? (typeof b.clients === 'object' && 'nom' in b.clients ? 
                      (b.clients as { nom: string }).nom : 
                      (Array.isArray(b.clients) && b.clients.length > 0 ? b.clients[0].nom : '')) : '';
        return sortDirection === 'asc' ? 
          clientA.localeCompare(clientB) : 
          clientB.localeCompare(clientA);
      } else if (sortOption === 'transporteur') {
        // Tri par nom de transporteur
        const transporteurA = a.transporteurs ? (typeof a.transporteurs === 'object' && 'nom' in a.transporteurs ? 
                            (a.transporteurs as { nom: string }).nom : 
                            (Array.isArray(a.transporteurs) && a.transporteurs.length > 0 ? a.transporteurs[0].nom : '')) : '';
        const transporteurB = b.transporteurs ? (typeof b.transporteurs === 'object' && 'nom' in b.transporteurs ? 
                            (b.transporteurs as { nom: string }).nom : 
                            (Array.isArray(b.transporteurs) && b.transporteurs.length > 0 ? b.transporteurs[0].nom : '')) : '';
        return sortDirection === 'asc' ? 
          transporteurA.localeCompare(transporteurB) : 
          transporteurB.localeCompare(transporteurA);
      } else {
        return 0;
      }
    });
    
    setFilteredChargements(result);
  }, [chargements, searchTerm, filterStatus, filterClient, filterTransporteur, sortOption, sortDirection]);

  // Tri et filtrage des chargements
  useEffect(() => {
    sortAndFilterChargements();
  }, [sortAndFilterChargements]);
  
  // Écouter les événements de notification depuis les composants enfants
  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<{message: string, type: 'success' | 'error' | 'info'}>;
      if (customEvent.detail) {
        showNotification(customEvent.detail.message, customEvent.detail.type);
      }
    };
    
    window.addEventListener('showNotification', handleNotification);
    
    return () => {
      window.removeEventListener('showNotification', handleNotification);
    };
  }, [showNotification]);

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

  // Suppression d'un chargement
  const handleDeleteChargement = async (id: string) => {
    try {
      setLoading(true);
      // Appel à la fonction de suppression dans Supabase
      await deleteChargement(id);
      // Mise à jour de l'état local après suppression réussie
      setChargements((prevChargements) => prevChargements.filter(c => c.id !== id));
      
      // Notification de succès
      showNotification("Chargement supprimé avec succès", "success");
      
      // Fermer la fenêtre de détails si elle était ouverte
      if (detailsDialogOpen) {
        setDetailsDialogOpen(false);
        setSelectedChargement(null);
      }
      
      // Recharger les données pour être sûr que la liste est à jour
      loadData();
      
    } catch (error) {
      console.error("Erreur lors de la suppression du chargement:", error);
      setError("Échec de la suppression du chargement");
      showNotification("Échec de la suppression du chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour afficher les détails d'un chargement
  const handleViewChargement = (chargement: Chargement) => {
    setSelectedChargement(chargement);
    setDetailsDialogOpen(true);
  };

  // Fonction pour fermer la fenêtre de détails
  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedChargement(null);
  };
  
  // Fonction pour éditer un chargement
  const handleEditChargement = (chargement: Chargement) => {
    // On vérifie que le chargement peut être modifié
    if (chargement.status && chargement.status !== 'non_parti') {
      showNotification("Ce chargement ne peut plus être modifié car il a déjà été expédié ou livré.", "error");
      return;
    }
    
    // On ferme d'abord la fenêtre de détails
    setDetailsDialogOpen(false);
    
    // On définit le chargement à modifier
    setSelectedChargement(chargement);
    
    // On ouvre le dialogue de création/édition avec le chargement sélectionné
    setTimeout(() => {
      // Utiliser un petit délai pour éviter des problèmes potentiels avec l'état du dialogue
      setNewChargementDialogOpen(true);
    }, 100);
    
  // Ici, on pourrait ouvrir une fenêtre modale d'édition
  // ou naviguer vers une page d'édition
  showNotification(`Fonctionnalité d'édition pour le chargement ${chargement.id}`, 'info');
    
    // Après l'édition, on recharge les données
    loadData();
  };

  // Changement de direction du tri
  const handleToggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Réinitialisation de tous les filtres
  const handleResetAllFilters = () => {
    setFilterStatus('all');
    setFilterClient('all');
    setFilterTransporteur('all');
    setSearchTerm('');
  };

  useEffect(() => {
    loadData();
  }, [loadData]); 

  return (
    <div className="font-sans min-h-screen px-2 py-3 sm:px-4 sm:py-4 max-w-full mx-auto">
      {/* Notifications (bandeaux en bas) */}
      {notificationElements}
      <main className="flex flex-col gap-3">
        
        {/* En-tête et bouton de création */}
        <div className="flex flex-col border-b pb-2 mb-2">
          <div className="flex flex-row justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Liste des chargements</h2>
            <div className="flex items-center gap-2">
              <Dialog open={newChargementDialogOpen} onOpenChange={setNewChargementDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" onClick={() => {
                    setSelectedChargement(null);  // Réinitialiser le chargement sélectionné pour créer un nouveau
                    setNewChargementDialogOpen(true);
                  }}>
                    <PlusIcon className="size-4 mr-1" />
                    Créer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>
                      {selectedChargement ? "Modifier un chargement" : "Ajouter un nouveau chargement"}
                    </DialogTitle>
                  </DialogHeader>
                  <NewChargementForm 
                    onChargementCreated={() => {
                      loadData();
                      setNewChargementDialogOpen(false);
                    }}
                    clients={clients}
                    transporteurs={transporteurs}
                    chargementToEdit={selectedChargement}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Recherche et tri */}
          <div className="border rounded-md p-2 bg-card mb-1">
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
              {/* Section recherche */}
              <div className="flex-grow min-w-[200px] sm:border-r sm:pr-2 pb-2 sm:pb-0 border-b sm:border-b-0">
                <div className="text-xs font-semibold mb-1">Recherche</div>
                <Input
                  placeholder="Rechercher par nom ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 text-sm"
                />
              </div>
              
              {/* Section tri */}
              <div className="flex-shrink-0 sm:border-r sm:pr-2 pb-2 sm:pb-0 border-b sm:border-b-0">
                <div className="text-xs font-semibold mb-1">Tri</div>
                <div className="flex items-center gap-1">
                  <Select 
                    onValueChange={(value) => setSortOption(value as 'date_creation' | 'date_depart' | 'date_arrivee' | 'status' | 'client' | 'transporteur')} 
                    value={sortOption}
                  >
                    <SelectTrigger className="h-8 min-w-[130px] text-xs">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_creation">Date de création</SelectItem>
                      <SelectItem value="date_depart">Date d&apos;expédition</SelectItem>
                      <SelectItem value="date_arrivee">Date de livraison</SelectItem>
                      <SelectItem value="status">Statut</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="transporteur">Transporteur</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleToggleSortDirection}
                    aria-label="Inverser l'ordre de tri"
                    className="h-8 w-8"
                  >
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>
              
              {/* Section affichage */}
              <div className="flex-shrink-0 flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="text-xs font-semibold mb-1">Affichage</div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilters(!showFilters)}
                      className="h-8 text-xs"
                    >
                      {showFilters ? 'Masquer filtres' : 'Afficher filtres'}
                    </Button>
                    
                    <div className="hidden sm:block">
                      <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filtres avancés */}
            {showFilters && (
              <div className="mt-2 border-t pt-2 space-y-2">
                {/* Section Statuts */}
                <div className="p-2 bg-muted/20 rounded-md">
                  <div className="font-semibold text-xs mb-1.5">État du chargement</div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button 
                      variant={filterStatus === 'all' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilterStatus('all')}
                      className="h-7 text-xs py-0"
                    >
                      Tous
                    </Button>
                    <Button 
                      variant={filterStatus === 'non_parti' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilterStatus('non_parti')}
                      className={`h-7 text-xs py-0 ${filterStatus === 'non_parti' ? "" : "text-red-500"}`}
                    >
                      En préparation
                    </Button>
                    <Button 
                      variant={filterStatus === 'en_cours' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilterStatus('en_cours')}
                      className={`h-7 text-xs py-0 ${filterStatus === 'en_cours' ? "" : "text-yellow-500"}`}
                    >
                      Acheminement
                    </Button>
                    <Button 
                      variant={filterStatus === 'livre' ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => setFilterStatus('livre')}
                      className={`h-7 text-xs py-0 ${filterStatus === 'livre' ? "" : "text-green-500"}`}
                    >
                      Livré
                    </Button>
                  </div>
                </div>
                
                {/* Section Entités */}
                <div className="p-2 bg-muted/20 rounded-md">
                  <div className="font-semibold text-xs mb-1.5">Filtres par entités</div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="w-full sm:w-auto sm:flex-1">
                      <div className="flex gap-2 items-center">
                        <div className="text-xs font-medium">Client:</div>
                        <Select 
                          onValueChange={setFilterClient} 
                          value={filterClient}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Tous les clients" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les clients</SelectItem>
                            {clients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="w-full sm:w-auto sm:flex-1">
                      <div className="flex gap-2 items-center">
                        <div className="text-xs font-medium">Transporteur:</div>
                        <Select 
                          onValueChange={setFilterTransporteur} 
                          value={filterTransporteur}
                        >
                          <SelectTrigger className="h-7 text-xs flex-1">
                            <SelectValue placeholder="Tous les transporteurs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les transporteurs</SelectItem>
                            {transporteurs.map((transporteur) => (
                              <SelectItem key={transporteur.id} value={transporteur.id}>
                                {transporteur.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="text-destructive p-2 border border-destructive rounded text-sm mb-1">
            Erreur: {error}
          </div>
        )}

        {loading && !error ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground ml-1 mb-1">
              <div className="px-2 py-1 bg-muted/30 rounded-md">
                <span className="font-medium">{filteredChargements.length} chargement{filteredChargements.length !== 1 ? 's' : ''}</span>
                {filteredChargements.length !== chargements.length && (
                  <span className="ml-1">sur {chargements.length}</span>
                )}
              </div>
              
              {/* Filtres actifs organisés par type */}
              {filterStatus !== 'all' && (
                <div className="px-2 py-1 bg-muted/30 rounded-md flex items-center">
                  <span className="text-xs font-medium">Statut:</span>
                  <span className="ml-1 text-xs">
                    {filterStatus === 'non_parti' ? 'En préparation' : 
                     filterStatus === 'en_cours' ? 'Acheminement en cours' : 'Livré'}
                  </span>
                </div>
              )}
              
              {filterClient !== 'all' && (
                <div className="px-2 py-1 bg-muted/30 rounded-md flex items-center">
                  <span className="text-xs font-medium">Client:</span>
                  <span className="ml-1 text-xs">
                    {clients.find(c => c.id === filterClient)?.nom || ''}
                  </span>
                </div>
              )}
              
              {filterTransporteur !== 'all' && (
                <div className="px-2 py-1 bg-muted/30 rounded-md flex items-center">
                  <span className="text-xs font-medium">Transporteur:</span>
                  <span className="ml-1 text-xs">
                    {transporteurs.find(t => t.id === filterTransporteur)?.nom || ''}
                  </span>
                </div>
              )}

              {/* Bouton pour réinitialiser tous les filtres */}
              {(filterStatus !== 'all' || filterClient !== 'all' || filterTransporteur !== 'all' || searchTerm) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetAllFilters}
                  className="px-2 py-1 h-7 text-xs text-red-500 hover:bg-red-100 hover:text-red-700 border-red-200 flex items-center"
                >
                  <XCircle className="size-3.5 mr-1" />
                  Effacer les filtres
                </Button>
              )}
            </div>
            
            {filteredChargements.length === 0 ? (
              <div className="text-center bg-muted/20 rounded-lg py-6">
                <p className="text-muted-foreground">Aucun chargement trouvé.</p>
              </div>
            ) : (
              <>
                {/* Vue liste - visible uniquement sur desktop si sélectionnée */}
                {viewMode === 'list' && (
                  <div className="w-full overflow-x-auto hidden sm:block transition-all duration-300 ease-in-out">
                    <ChargementList
                      chargements={filteredChargements}
                      onView={handleViewChargement}
                      onUpdate={loadData}
                    />
                  </div>
                )}
                
                {/* Vue carte - toujours visible sur mobile, visible sur desktop si sélectionnée */}
                <div className={`grid gap-y-3 gap-x-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${viewMode === 'list' ? 'sm:hidden' : ''} transition-all duration-300 ease-in-out`}>
                  {filteredChargements.map((charge) => (
                    <ChargementCard 
                      key={charge.id} 
                      charge={charge}
                      onView={handleViewChargement} 
                    />
                  ))}
                </div>
              </>
            )}
            
            <ChargementDetails
              chargement={selectedChargement}
              isOpen={detailsDialogOpen}
              onClose={handleCloseDetails}
              onEdit={handleEditChargement}
              onDelete={handleDeleteChargement}
            />
          </div>
        )}
      </main>
    </div>
  );
}