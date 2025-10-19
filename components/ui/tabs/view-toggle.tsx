import React from 'react';
import { Button } from '@/components/ui/button';
import { ListIcon, Grid3X3Icon } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'list' | 'card';
  onViewChange: (view: 'list' | 'card') => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-muted/20 rounded-md p-0.5">
      <Button
        variant={currentView === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className="flex items-center gap-0.5 h-7 px-1.5"
      >
        <ListIcon className="size-3.5" />
        <span className="sr-only sm:not-sr-only sm:ml-0.5 text-[10px]">Liste</span>
      </Button>
      <Button
        variant={currentView === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('card')}
        className="flex items-center gap-0.5 h-7 px-1.5"
      >
        <Grid3X3Icon className="size-3.5" />
        <span className="sr-only sm:not-sr-only sm:ml-0.5 text-[10px]">Cartes</span>
      </Button>
    </div>
  );
}