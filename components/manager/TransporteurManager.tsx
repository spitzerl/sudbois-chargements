'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, PlusIcon, Trash2, Pencil } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';
import {
  fetchTransporteurs,
  fetchChargements,
  createTransporteur,
  updateTransporteur,
  deleteTransporteur,
  Transporteur,
  Chargement,
} from '@/lib/supabaseData';
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
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function TransporteurManager() {
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

        <Dialog open={relatedDialogOpen} onOpenChange={setRelatedDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Chargements liés</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Impossible de supprimer ce transporteur car il est utilisé par les chargements suivants :</p>
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
