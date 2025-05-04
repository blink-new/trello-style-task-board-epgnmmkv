import { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card as CardComponent } from './Card';
import { Column as ColumnType, Card as CardType } from '../types';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useDraggable, useDroppable } from '@dnd-kit/core';

interface ColumnProps {
  column: ColumnType;
  cards: CardType[];
  activeCardId: string | null;
}

export function Column({ column, cards, activeCardId }: ColumnProps) {
  const { createCard, deleteColumn } = useBoard();
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
  });

  const handleCreateCard = async () => {
    if (newCardTitle.trim()) {
      await createCard(newCardTitle.trim(), column.id);
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleDeleteColumn = async () => {
    await deleteColumn(column.id);
  };

  // Sort cards by position
  const sortedCards = [...cards].sort((a, b) => a.position - b.position);

  return (
    <div
      ref={setDroppableRef}
      className="flex flex-col bg-secondary/50 rounded-lg p-3 min-w-[280px] max-w-[280px] h-fit"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm truncate">{column.title}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={handleDeleteColumn}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 min-h-[50px]">
        {sortedCards.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            isActive={card.id === activeCardId}
          />
        ))}
      </div>

      {isAddingCard ? (
        <div className="mt-2 space-y-2">
          <Input
            placeholder="Card Title"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateCard()}
            autoFocus
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateCard} 
              size="sm" 
              className="flex-1"
            >
              Add
            </Button>
            <Button 
              onClick={() => {
                setIsAddingCard(false);
                setNewCardTitle('');
              }} 
              variant="outline" 
              size="sm" 
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-muted-foreground"
          onClick={() => setIsAddingCard(true)}
        >
          <PlusCircle className="h-4 w-4 mr-1" />
          Add Card
        </Button>
      )}
    </div>
  );
}