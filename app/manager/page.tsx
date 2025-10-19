'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, PlusIcon, Trash2, Pencil } from 'lucide-react'; 

import { 
  fetchClients, 
  fetchTransporteurs, 
  fetchProduits,
  fetchChargements,
  createClient,
  updateClient,
  deleteClient,
  createTransporteur,
  updateTransporteur,
  deleteTransporteur,
  createProduit,
  updateProduit,
  deleteProduit,
  Client,
  Transporteur,
  Chargement,
  Produit
} from '@/lib/supabaseData';
import { ProduitChargement } from '@/lib/supabaseData';

import { useNotification } from '@/components/ui/notification';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Page de gestion des entités
export default function ManagerPage() {
  const [, setActiveTab] = useState('clients');

  return (
    <div className="font-sans min-h-screen px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Manager
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gestion des clients, transporteurs et produits.
        </p>
      </header>

      <Tabs defaultValue="clients" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="transporteurs">Transporteurs</TabsTrigger>
          <TabsTrigger value="produits">Produits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-6">
          <ClientManager />
        </TabsContent>
        
        <TabsContent value="transporteurs" className="space-y-6">
          <TransporteurManager />
        </TabsContent>
        
        <TabsContent value="produits" className="space-y-6">
          <ProduitManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Gestion des clients
function ClientManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedChargements, setRelatedChargements] = useState<Chargement[]>([]);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<{id: string, nom: string, adresse: string}>({ id: '', nom: '', adresse: '' });
  const [newClient, setNewClient] = useState<{nom: string, adresse: string}>({ nom: '', adresse: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleAddClient = async () => {
    if (!newClient.nom.trim()) {
      setError('Le nom du client est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createClient(newClient.nom, newClient.adresse);
      setNewClient({ nom: '', adresse: '' });
      setIsAddDialogOpen(false);
      await loadClients();
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      setError('Impossible de créer le client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!currentClient.nom.trim()) {
      setError('Le nom du client est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateClient(currentClient.id, currentClient.nom, currentClient.adresse);
      setIsEditDialogOpen(false);
      await loadClients();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du client:', error);
      setError('Impossible de mettre à jour le client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (isDeleting) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteClient(id);
      await loadClients();
      showNotification('Client supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression du client:', error);
      const rawMessage = error && typeof error === 'object' && 'message' in error ? String((error as Record<string, unknown>).message) : String(error) || 'Impossible de supprimer le client';

      // Détecter une erreur de contrainte FK et afficher un message utilisateur clair en français
      const isFkError = rawMessage.includes('violates foreign key constraint') || rawMessage.toLowerCase().includes('foreign key');
      if (isFkError) {
        const fkMessage = "Impossible de supprimer cet élément car il est lié à un ou plusieurs chargements. Veuillez d'abord annuler ou supprimer ces chargements.";
        setError(fkMessage);
        showNotification(fkMessage, 'error');

        try {
          const allCharges = await fetchChargements();
          const related = allCharges.filter(c => c.client_id === id);
          setRelatedChargements(related);
          setRelatedDialogOpen(true);
        } catch (e) {
          console.error('Erreur lors de la récupération des chargements liés:', e);
        }
      } else {
        const userMessage = `Impossible de supprimer le client : ${rawMessage}`;
        setError(userMessage);
        showNotification(userMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Clients</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={newClient.nom}
                  onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                  placeholder="Nom du client"
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={newClient.adresse}
                  onChange={(e) => setNewClient({ ...newClient, adresse: e.target.value })}
                  placeholder="Adresse du client"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddClient}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

          {/* Dialog affichant les chargements empêchant la suppression */}
          <Dialog open={relatedDialogOpen} onOpenChange={setRelatedDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Chargements liés</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Impossible de supprimer ce client car il est utilisé par les chargements suivants :</p>
                {relatedChargements.length === 0 ? (
                  <p>Aucun chargement trouvé.</p>
                ) : (
                  <ul className="list-disc pl-5">
                    {relatedChargements.map((c) => (
                      <li key={c.id}>
                        {c.nom || `ID: ${c.id}`} - statut: {c.status || 'non_parti'}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end mt-4">
                  <Button onClick={() => setRelatedDialogOpen(false)}>Fermer</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-500">{error}</div>
      ) : clients.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">Aucun client trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un client
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle>{client.nom}</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentClient({ id: client.id, nom: client.nom, adresse: '' });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteClient(client.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-nom">Nom</Label>
              <Input
                id="edit-nom"
                value={currentClient.nom}
                onChange={(e) => setCurrentClient({ ...currentClient, nom: e.target.value })}
                placeholder="Nom du client"
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-adresse">Adresse</Label>
              <Input
                id="edit-adresse"
                value={currentClient.adresse}
                onChange={(e) => setCurrentClient({ ...currentClient, adresse: e.target.value })}
                placeholder="Adresse du client"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateClient}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Dialog affichant les chargements empêchant la suppression */}
      <Dialog open={relatedDialogOpen} onOpenChange={setRelatedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargements liés</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {relatedChargements.length === 0 ? (
              <p>Aucun chargement trouvé.</p>
            ) : (
              <ul className="list-disc pl-5">
                {relatedChargements.map((c) => (
                  <li key={c.id}>
                    {c.nom || `ID: ${c.id}`} - statut: {c.status || 'non_parti'}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={() => setRelatedDialogOpen(false)}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Gestion des transporteurs
function TransporteurManager() {
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedChargements, setRelatedChargements] = useState<Chargement[]>([]);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTransporteur, setCurrentTransporteur] = useState<{id: string, nom: string, contact: string}>({ id: '', nom: '', contact: '' });
  const [newTransporteur, setNewTransporteur] = useState<{nom: string, contact: string}>({ nom: '', contact: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadTransporteurs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTransporteurs();
      setTransporteurs(data);
    } catch (error) {
      console.error('Erreur lors du chargement des transporteurs:', error);
      setError('Impossible de charger les transporteurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransporteurs();
  }, []);

  const handleAddTransporteur = async () => {
    if (!newTransporteur.nom.trim()) {
      setError('Le nom du transporteur est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createTransporteur(newTransporteur.nom, newTransporteur.contact);
      setNewTransporteur({ nom: '', contact: '' });
      setIsAddDialogOpen(false);
      await loadTransporteurs();
    } catch (error) {
      console.error('Erreur lors de la création du transporteur:', error);
      setError('Impossible de créer le transporteur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransporteur = async () => {
    if (!currentTransporteur.nom.trim()) {
      setError('Le nom du transporteur est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateTransporteur(currentTransporteur.id, currentTransporteur.nom, currentTransporteur.contact);
      setIsEditDialogOpen(false);
      await loadTransporteurs();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du transporteur:', error);
      setError('Impossible de mettre à jour le transporteur');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransporteur = async (id: string) => {
    if (isDeleting) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce transporteur ?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteTransporteur(id);
      await loadTransporteurs();
      showNotification('Transporteur supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression du transporteur:', error);
      const rawMessage = error && typeof error === 'object' && 'message' in error ? String((error as Record<string, unknown>).message) : String(error) || 'Impossible de supprimer le transporteur';
      const isFkError = rawMessage.includes('violates foreign key constraint') || rawMessage.toLowerCase().includes('foreign key');
      if (isFkError) {
        const fkMessage = "Impossible de supprimer cet élément car il est lié à un ou plusieurs chargements. Veuillez d'abord annuler ou supprimer ces chargements.";
        setError(fkMessage);
        showNotification(fkMessage, 'error');

        try {
          const allCharges = await fetchChargements();
          const related = allCharges.filter(c => c.transporteur_id === id);
          setRelatedChargements(related);
          setRelatedDialogOpen(true);
        } catch (e) {
          console.error('Erreur lors de la récupération des chargements liés:', e);
        }
      } else {
        const userMessage = `Impossible de supprimer le transporteur : ${rawMessage}`;
        setError(userMessage);
        showNotification(userMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transporteurs</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Ajouter un transporteur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un transporteur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={newTransporteur.nom}
                  onChange={(e) => setNewTransporteur({ ...newTransporteur, nom: e.target.value })}
                  placeholder="Nom du transporteur"
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  value={newTransporteur.contact}
                  onChange={(e) => setNewTransporteur({ ...newTransporteur, contact: e.target.value })}
                  placeholder="Contact du transporteur"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddTransporteur}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-500">{error}</div>
      ) : transporteurs.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">Aucun transporteur trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un transporteur
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {transporteurs.map((transporteur) => (
            <Card key={transporteur.id}>
              <CardHeader>
                <CardTitle>{transporteur.nom}</CardTitle>
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentTransporteur({ id: transporteur.id, nom: transporteur.nom, contact: '' });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteTransporteur(transporteur.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le transporteur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-nom">Nom</Label>
              <Input
                id="edit-nom"
                value={currentTransporteur.nom}
                onChange={(e) => setCurrentTransporteur({ ...currentTransporteur, nom: e.target.value })}
                placeholder="Nom du transporteur"
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-contact">Contact</Label>
              <Input
                id="edit-contact"
                value={currentTransporteur.contact}
                onChange={(e) => setCurrentTransporteur({ ...currentTransporteur, contact: e.target.value })}
                placeholder="Contact du transporteur"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateTransporteur}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Gestion des produits
function ProduitManager() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [relatedChargements, setRelatedChargements] = useState<Chargement[]>([]);
  const [relatedDialogOpen, setRelatedDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentProduit, setCurrentProduit] = useState<{id: string, nom: string, description: string}>({ id: '', nom: '', description: '' });
  const [newProduit, setNewProduit] = useState<{nom: string, description: string}>({ nom: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProduits = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProduits();
      setProduits(data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      setError('Impossible de charger les produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduits();
  }, []);

  const handleAddProduit = async () => {
    if (!newProduit.nom.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createProduit(newProduit.nom, newProduit.description);
      setNewProduit({ nom: '', description: '' });
      setIsAddDialogOpen(false);
      await loadProduits();
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      setError('Impossible de créer le produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduit = async () => {
    if (!currentProduit.nom.trim()) {
      setError('Le nom du produit est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateProduit(currentProduit.id, currentProduit.nom, currentProduit.description);
      setIsEditDialogOpen(false);
      await loadProduits();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      setError('Impossible de mettre à jour le produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduit = async (id: string) => {
    if (isDeleting) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProduit(id);
      await loadProduits();
      showNotification('Produit supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      const rawMessage = error && typeof error === 'object' && 'message' in error ? String((error as Record<string, unknown>).message) : String(error) || 'Impossible de supprimer le produit';
      const isFkError = rawMessage.includes('violates foreign key constraint') || rawMessage.toLowerCase().includes('foreign key');
      if (isFkError) {
        const fkMessage = "Impossible de supprimer cet élément car il est lié à un ou plusieurs chargements. Veuillez d'abord annuler ou supprimer ces chargements.";
        setError(fkMessage);
        showNotification(fkMessage, 'error');

        try {
          const allCharges = await fetchChargements();
          // Filtrer les chargements qui contiennent le produit
          const related = allCharges.filter(c => {
            return Array.isArray(c.produits) && c.produits.some((p) => (p as ProduitChargement).produit_id === id);
          });
          setRelatedChargements(related);
          setRelatedDialogOpen(true);
        } catch (e) {
          console.error('Erreur lors de la récupération des chargements liés:', e);
        }
      } else {
        const userMessage = `Impossible de supprimer le produit : ${rawMessage}`;
        setError(userMessage);
        showNotification(userMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Produits</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              Ajouter un produit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un produit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={newProduit.nom}
                  onChange={(e) => setNewProduit({ ...newProduit, nom: e.target.value })}
                  placeholder="Nom du produit"
                />
              </div>
              <div className="grid w-full gap-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newProduit.description}
                  onChange={(e) => setNewProduit({ ...newProduit, description: e.target.value })}
                  placeholder="Description du produit"
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleAddProduit}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-md text-red-500">{error}</div>
      ) : produits.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <p className="text-gray-500">Aucun produit trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {produits.map((produit) => (
            <Card key={produit.id}>
              <CardHeader>
                <CardTitle>{produit.nom}</CardTitle>
                {produit.description && (
                  <CardDescription>{produit.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentProduit({ 
                      id: produit.id, 
                      nom: produit.nom, 
                      description: produit.description || '' 
                    });
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProduit(produit.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de modification */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-nom">Nom</Label>
              <Input
                id="edit-nom"
                value={currentProduit.nom}
                onChange={(e) => setCurrentProduit({ ...currentProduit, nom: e.target.value })}
                placeholder="Nom du produit"
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={currentProduit.description}
                onChange={(e) => setCurrentProduit({ ...currentProduit, description: e.target.value })}
                placeholder="Description du produit"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                onClick={handleUpdateProduit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog affichant les chargements empêchant la suppression */}
      <Dialog open={relatedDialogOpen} onOpenChange={setRelatedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chargements liés</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Impossible de supprimer ce transporteur car il est utilisé par les chargements suivants :</p>
            <p className="text-sm text-muted-foreground">Impossible de supprimer ce produit car il est utilisé par les chargements suivants :</p>
            {relatedChargements.length === 0 ? (
              <p>Aucun chargement trouvé.</p>
            ) : (
              <ul className="list-disc pl-5">
                {relatedChargements.map((c) => (
                  <li key={c.id}>
                    {c.nom || `ID: ${c.id}`} - statut: {c.status || 'non_parti'}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end mt-4">
              <Button onClick={() => setRelatedDialogOpen(false)}>Fermer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}