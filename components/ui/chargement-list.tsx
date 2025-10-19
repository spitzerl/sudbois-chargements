import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Chargement } from '@/lib/supabaseData';

interface ChargementListProps {
  chargements: Chargement[];
  onView: (chargement: Chargement) => void;
  onUpdate: () => void;
}

export function ChargementList({ chargements, onView }: ChargementListProps) {
  return (
    <div className="overflow-hidden border rounded-lg">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold">Nom</th>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold">Client</th>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold hidden sm:table-cell">Transporteur</th>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold hidden md:table-cell">Date de départ</th>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold hidden lg:table-cell">Produits</th>
            <th scope="col" className="px-3 py-2.5 text-left text-sm font-semibold">Statut</th>
            <th scope="col" className="px-3 py-2.5 text-right text-sm font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {chargements.map((charge) => {
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

            const produitCount = charge.produits?.length || 0;

            let statusColor = 'bg-red-100 text-red-800';
            let statusText = 'En préparation';
            
            switch(charge.status) {
              case 'livre': 
                statusColor = 'bg-green-100 text-green-800';
                statusText = 'Livré';
                break;
              case 'en_cours': 
                statusColor = 'bg-yellow-100 text-yellow-800';
                statusText = 'Acheminement en cours';
                break;
              case 'non_parti':
              default:
                if (charge.date_depart) {
                  const departDate = new Date(charge.date_depart);
                  const now = new Date();
                  if (departDate > now) {
                    statusColor = 'bg-blue-100 text-blue-800';
                    statusText = 'Départ prévu';
                  } else {
                    statusColor = 'bg-red-100 text-red-800';
                    statusText = 'En préparation';
                  }
                } else {
                  statusColor = 'bg-red-100 text-red-800';
                  statusText = 'En préparation';
                }
            }

            return (
              <tr key={charge.id} className="hover:bg-muted/20">
                <td className="px-3 py-2.5 text-sm">
                  {charge.nom || <span className="text-muted-foreground italic">Sans nom</span>}
                </td>
                <td className="px-3 py-2.5 text-sm">{clientName}</td>
                <td className="px-3 py-2.5 text-sm hidden sm:table-cell">{transporteurName}</td>
                <td className="px-3 py-2.5 text-sm hidden md:table-cell">
                  {charge.date_depart ? format(new Date(charge.date_depart), 'dd/MM/yyyy') : '-'}
                </td>
                <td className="px-3 py-2.5 text-sm hidden lg:table-cell">
                  {produitCount > 0 ? `${produitCount} produit(s)` : '-'}
                </td>
                <td className="px-3 py-2.5 text-sm">
                  <span className={`${statusColor} px-2 py-0.5 text-xs font-medium rounded-full`}>
                    {statusText}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-sm text-right">
                  <Button 
                    onClick={() => onView(charge)} 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs font-medium"
                  >
                    Détails
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}