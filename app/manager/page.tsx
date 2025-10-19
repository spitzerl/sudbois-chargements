'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientManager } from "@/components/manager/ClientManager";
import { TransporteurManager } from "@/components/manager/TransporteurManager";
import { ProduitManager } from "@/components/manager/ProduitManager";

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
