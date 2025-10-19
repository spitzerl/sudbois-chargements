import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Chargement } from '@/lib/supabaseData';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface ChargementDetailsProps {
  chargement: Chargement | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (chargement: Chargement) => void;
  onDelete?: (id: string) => void;
}

export function ChargementDetails({ chargement, isOpen, onClose, onEdit, onDelete }: ChargementDetailsProps) {
  if (!chargement) return null;
  
  // Détermine si le chargement peut être modifié (non parti seulement)
  const canModify = chargement.status === 'non_parti';

  let clientName = 'Inconnu';
  let transporteurName = 'Inconnu';
  
  if (Array.isArray(chargement.clients) && chargement.clients.length > 0) {
    clientName = chargement.clients[0].nom;
  } 
  else if (chargement.clients && typeof chargement.clients === 'object' && 'nom' in chargement.clients) {
    clientName = (chargement.clients as { nom: string }).nom;
  }
  
  if (Array.isArray(chargement.transporteurs) && chargement.transporteurs.length > 0) {
    transporteurName = chargement.transporteurs[0].nom;
  }
  else if (chargement.transporteurs && typeof chargement.transporteurs === 'object' && 'nom' in chargement.transporteurs) {
    transporteurName = (chargement.transporteurs as { nom: string }).nom;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-2 shadow-sm">
          <DialogTitle>{chargement.nom || 'Détails du chargement'}</DialogTitle>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-b from-transparent to-gray-100"></div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations de base */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/40 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-300">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom:</p>
                <p className="font-medium">{chargement.nom || 'Sans nom'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID:</p>
                <p className="font-mono text-sm">{chargement.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de départ:</p>
                {chargement.date_depart ? (
                  <>
                    <p className="font-medium">
                      {format(new Date(chargement.date_depart), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(new Date(chargement.date_depart), 'HH:mm:ss')}
                    </p>
                  </>
                ) : (
                  <p className="italic text-muted-foreground">Non définie</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date d&apos;arrivée:</p>
                {chargement.date_arrivee ? (
                  <>
                    <p className="font-medium">
                      {format(new Date(chargement.date_arrivee), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {format(new Date(chargement.date_arrivee), 'HH:mm:ss')}
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
                  <p className="text-sm text-muted-foreground">ID: {chargement.client_id}</p>
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium mb-2 text-amber-700 dark:text-amber-400">Transporteur</h4>
                <div className="bg-white/80 dark:bg-slate-800/50 p-3 rounded-md shadow-sm">
                  <p className="font-medium">{transporteurName}</p>
                  <p className="text-sm text-muted-foreground">ID: {chargement.transporteur_id}</p>
                </div>
              </div>
            </div>
          </div>
              
          {/* Produits détaillés */}
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/40 shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-purple-800 dark:text-purple-300">Contenu du chargement</h3>
            {chargement.produits && chargement.produits.length > 0 ? (
              <div className="bg-white/80 dark:bg-slate-800/50 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-purple-100 dark:bg-purple-900/30">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-purple-800 dark:text-purple-200">Produit</th>
                        <th className="text-right p-3 text-sm font-medium text-purple-800 dark:text-purple-200">Quantité</th>
                        <th className="text-left p-3 text-sm font-medium text-purple-800 dark:text-purple-200 hidden sm:table-cell">Référence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chargement.produits.map((produit) => {
                        let produitNom = "Produit inconnu";
                        if (produit.produits) {
                          if (typeof produit.produits === 'object') {
                            produitNom = (produit.produits as { nom: string }).nom || "Sans nom";
                          }
                        }
                        
                        return (
                          <tr key={produit.id} className="border-t border-purple-100 dark:border-purple-800/20">
                            <td className="p-3">{produitNom}</td>
                            <td className="p-3 text-right">{produit.quantite}</td>
                            <td className="p-3 hidden sm:table-cell">
                              <span className="font-mono text-xs">{produit.produit_id}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                Aucun produit associé à ce chargement
              </div>
            )}
          </div>
          
          {/* Boutons d'action */}
          <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg border border-gray-100 dark:border-gray-800/40 shadow-sm mt-6 sticky bottom-0">
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-t from-transparent to-gray-100/50"></div>
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
                onClick={() => onEdit && onEdit(chargement)}
                disabled={!canModify}
              >
                <Pencil className="size-4 mr-2" /> Modifier le chargement
              </Button>
              
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => onDelete && onDelete(chargement.id)}
                disabled={!canModify}
              >
                <Trash2 className="size-4 mr-2" /> Annuler le chargement
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}