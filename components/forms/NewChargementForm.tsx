'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, PlusIcon, Trash2 } from 'lucide-react';
import { useNotification } from '@/components/ui/notification';
import {
  fetchProduits,
  createChargement,
  updateChargement,
  updateChargementProduits,
  Chargement,
  Client,
  Transporteur,
  Produit
} from '@/lib/supabaseData';
import { Button } from '@/components/ui/button';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface NewChargementFormProps {
  onChargementCreated: () => void;
  clients: Client[];
  transporteurs: Transporteur[];
  chargementToEdit?: Chargement | null;
}

export function NewChargementForm({ 
  onChargementCreated, 
  clients, 
  transporteurs,
  chargementToEdit = null,
}: NewChargementFormProps) {
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
            {chargementToEdit ? 'Modifier le chargement' : 'Créer le chargement'}
          </Button>
        </div>
      </form>
      {error && <p className="text-destructive text-sm mt-4">{error}</p>}
    </div>
  );
}
