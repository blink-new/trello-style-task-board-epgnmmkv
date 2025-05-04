import { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import { Button } from './ui/button';
import { Card as CardType } from '../types';
import { Pencil, Trash2, X, Check, Tag as TagIcon } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../lib/utils';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface CardProps {
  card: CardType;
  isActive: boolean;
}

export function Card({ card, isActive }: CardProps) {
  const { updateCard, deleteCard, tags, addTagToCard, removeTagFromCard } = useBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: card.id,
    disabled: isEditing,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isActive ? 10 : 0,
    opacity: isActive ? 0.8 : 1,
  } : undefined;

  const handleSaveEdit = async () => {
    if (editTitle.trim()) {
      await updateCard({
        id: card.id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    await deleteCard(card.id);
  };

  const handleTagClick = async (tagId: string) => {
    const hasTag = card.tags?.some(tag => tag.id === tagId);
    
    if (hasTag) {
      await removeTagFromCard(card.id, tagId);
    } else {
      await addTagToCard(card.id, tagId);
    }
    
    setIsTagPopoverOpen(false);
  };

  // Get card tags
  const cardTags = card.tags || [];

  // Determine border color based on tags
  const borderColor = cardTags.length > 0 ? cardTags[0].color : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "bg-card rounded-md p-3 shadow-sm cursor-pointer group transition-all",
          isActive ? "shadow-md" : "hover:shadow-md",
          borderColor ? `border-l-4` : "border"
        )}
        style={{ 
          ...style, 
          borderLeftColor: borderColor 
        }}
      >
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-sm font-medium resize-none min-h-[60px]"
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={handleSaveEdit}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(card.title);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium">{card.title}</h4>
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {card.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {card.description}
              </p>
            )}

            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {cardTags.map((tag) => (
                <Badge
                  key={tag.id}
                  className="text-[10px] h-5 px-1.5"
                  style={{ backgroundColor: tag.color, color: '#fff' }}
                >
                  {tag.name}
                </Badge>
              ))}

              <Popover open={isTagPopoverOpen} onOpenChange={setIsTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TagIcon className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="start">
                  <div className="space-y-1">
                    {tags.map((tag) => {
                      const isSelected = cardTags.some(t => t.id === tag.id);
                      return (
                        <div
                          key={tag.id}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1 rounded-sm cursor-pointer hover:bg-secondary",
                            isSelected && "bg-secondary"
                          )}
                          onClick={() => handleTagClick(tag.id)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-xs">{tag.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{card.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Description</h4>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add a description..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <h4 className="text-sm font-medium mb-1">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                  const isSelected = cardTags.some(t => t.id === tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      className={cn(
                        "cursor-pointer",
                        isSelected ? "opacity-100" : "opacity-50"
                      )}
                      style={{ backgroundColor: tag.color, color: '#fff' }}
                      onClick={() => handleTagClick(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditDescription(card.description || '');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  await updateCard({
                    id: card.id,
                    description: editDescription.trim() || null,
                  });
                  setIsDialogOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}