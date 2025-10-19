'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chargement } from '@/lib/supabaseData';

interface ChargementCardProps {
  charge: Chargement;
  onView?: (chargement: Chargement) => void;
}

export function ChargementCard({ charge, onView }: ChargementCardProps) {
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
