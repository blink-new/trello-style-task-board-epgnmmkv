import { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Column } from './Column';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/core';

export function Board() {
  const { 
    currentBoard, 
    columns, 
    cards, 
    createColumn, 
    updateCardPosition,
    setCurrentBoard
  } = useBoard();
  
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateColumn = async () => {
    if (newColumnTitle.trim() && currentBoard) {
      await createColumn(newColumnTitle.trim(), currentBoard.id);
      setNewColumnTitle('');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveCardId(active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // We'll implement this later if needed
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveCardId(null);
      return;
    }
    
    const activeCardId = active.id as string;
    const overId = over.id as string;
    
    // Find the active card
    const activeCard = cards.find(card => card.id === activeCardId);
    
    if (!activeCard) {
      setActiveCardId(null);
      return;
    }
    
    // Check if it's dropped over a column
    const overColumn = columns.find(column => column.id === overId);
    
    if (overColumn) {
      // Get the highest position in the target column
      const columnCards = cards.filter(card => card.column_id === overColumn.id);
      const highestPosition = columnCards.length > 0 
        ? Math.max(...columnCards.map(card => card.position)) + 1 
        : 0;
      
      // Update card position
      await updateCardPosition(activeCardId, overColumn.id, highestPosition);
    } else {
      // It's dropped over another card
      const overCard = cards.find(card => card.id === overId);
      
      if (overCard && activeCard.column_id === overCard.column_id) {
        // Same column reordering
        const columnCards = cards
          .filter(card => card.column_id === activeCard.column_id)
          .sort((a, b) => a.position - b.position);
        
        const activeIndex = columnCards.findIndex(card => card.id === activeCardId);
        const overIndex = columnCards.findIndex(card => card.id === overId);
        
        if (activeIndex !== -1 && overIndex !== -1) {
          // Reorder the cards
          const newOrder = arrayMove(columnCards, activeIndex, overIndex);
          
          // Update positions
          for (let i = 0; i < newOrder.length; i++) {
            if (newOrder[i].id === activeCardId) {
              await updateCardPosition(activeCardId, activeCard.column_id, i);
              break;
            }
          }
        }
      } else if (overCard) {
        // Moving to a different column
        await updateCardPosition(activeCardId, overCard.column_id, overCard.position);
      }
    }
    
    setActiveCardId(null);
  };

  if (!currentBoard) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setCurrentBoard(null)}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{currentBoard.title}</h2>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Input
          placeholder="New Column Title"
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateColumn()}
          className="max-w-xs"
        />
        <Button 
          onClick={handleCreateColumn} 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          Add Column
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.length === 0 ? (
            <div className="flex-1 text-center py-8 text-muted-foreground border border-dashed rounded-lg">
              No columns yet. Create your first column to get started!
            </div>
          ) : (
            columns.map((column) => (
              <Column 
                key={column.id} 
                column={column} 
                cards={cards.filter(card => card.column_id === column.id)}
                activeCardId={activeCardId}
              />
            ))
          )}
        </div>
      </DndContext>
    </div>
  );
}