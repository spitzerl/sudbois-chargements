'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, PlusIcon, XCircle } from 'lucide-react';
import { useNotification } from '@/components/ui/notification'; 

import {
    fetchChargements,
    fetchClients,
    fetchTransporteurs,
    deleteChargement,
    Chargement,
    Client,
    Transporteur,
} from '@/lib/supabaseData';

import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
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
import { ChargementCard } from "@/components/chargements/ChargementCard";
import { NewChargementForm } from "@/components/forms/NewChargementForm";

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