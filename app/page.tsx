'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Loader2, PlusIcon, Trash2, Eye } from 'lucide-react'; 

import {
    fetchChargements,
    fetchClients,
    fetchTransporteurs,
    fetchProduits,
    createChargement,
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
      
      {/* Bouton pour voir les détails */}
      <div className="pt-2 mt-2 border-t">
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


// Formulaire de création de chargement
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
    <div>
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

// Dashboard principal des chargements
export default function ChargementsDashboard() {
  const [chargements, setChargements] = useState<Chargement[]>([]);
  const [filteredChargements, setFilteredChargements] = useState<Chargement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<'date' | 'status' | 'client' | 'transporteur'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'non_parti' | 'en_cours' | 'livre'>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterTransporteur, setFilterTransporteur] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedChargement, setSelectedChargement] = useState<Chargement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

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
      if (sortOption === 'date') {
        const dateA = new Date(a.date_creation).getTime();
        const dateB = new Date(b.date_creation).getTime();
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
  const handleDeleteChargement = (id: string) => {
    setChargements((prevChargements) => prevChargements.filter(c => c.id !== id));
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
  
  // Fonction pour éditer un chargement (à implémenter avec modal dans le futur)
  const handleEditChargement = (chargement: Chargement) => {
    // Pour l'instant, on ferme simplement la fenêtre de détails
    setDetailsDialogOpen(false);
    setSelectedChargement(null);
    
    // Ici, on pourrait ouvrir une fenêtre modale d'édition
    // ou naviguer vers une page d'édition
    alert(`Fonctionnalité d'édition pour le chargement ${chargement.id}`);
    
    // Après l'édition, on recharge les données
    loadData();
  };

  // Changement de direction du tri
  const handleToggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  useEffect(() => {
    loadData();
  }, [loadData]); 

  return (
    <div className="font-sans min-h-screen px-2 py-3 sm:px-4 sm:py-4 max-w-full mx-auto">
      <main className="flex flex-col gap-3">
        
        {/* En-tête et bouton de création */}
        <div className="flex flex-col border-b pb-2 mb-2">
          <div className="flex flex-row justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Liste des chargements</h2>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <PlusIcon className="size-4 mr-1" />
                    Créer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau chargement</DialogTitle>
                  </DialogHeader>
                  <NewChargementForm 
                    onChargementCreated={loadData}
                    clients={clients}
                    transporteurs={transporteurs}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Recherche et tri */}
          <div className="border rounded-md p-2 bg-card mb-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Section recherche */}
              <div className="flex-grow min-w-[200px] border-r pr-2">
                <div className="text-xs font-semibold mb-1">Recherche</div>
                <Input
                  placeholder="Rechercher par nom ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 text-sm"
                />
              </div>
              
              {/* Section tri */}
              <div className="flex-shrink-0 border-r pr-2">
                <div className="text-xs font-semibold mb-1">Tri</div>
                <div className="flex items-center gap-1">
                  <Select 
                    onValueChange={(value) => setSortOption(value as 'date' | 'status' | 'client' | 'transporteur')} 
                    value={sortOption}
                  >
                    <SelectTrigger className="h-8 min-w-[110px] text-xs">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
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
              <div className="flex-shrink-0">
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
                  
                  <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
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
            </div>
            
            {filteredChargements.length === 0 ? (
              <div className="text-center bg-muted/20 rounded-lg py-6">
                <p className="text-muted-foreground">Aucun chargement trouvé.</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="w-full overflow-x-auto">
                <ChargementList
                  chargements={filteredChargements}
                  onView={handleViewChargement}
                  onUpdate={loadData}
                />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredChargements.map((charge) => (
                  <ChargementCard 
                    key={charge.id} 
                    charge={charge}
                    onView={handleViewChargement} 
                  />
                ))}
              </div>
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