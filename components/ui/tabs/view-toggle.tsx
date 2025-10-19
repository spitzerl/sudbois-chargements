import React from 'react';
import { Button } from '@/components/ui/button';
import { ListIcon, Grid3X3Icon } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'list' | 'card';
  onViewChange: (view: 'list' | 'card') => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-muted/20 rounded-md p-1">
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-1"
      >
        <ListIcon className="size-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Liste</span>
      </Button>
      <Button
        variant={currentView === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('card')}
        className="flex items-center gap-1"
      >
        <Grid3X3Icon className="size-4" />
        <span className="sr-only sm:not-sr-only sm:ml-1 text-xs">Cartes</span>
      </Button>
    </div>
  );
}