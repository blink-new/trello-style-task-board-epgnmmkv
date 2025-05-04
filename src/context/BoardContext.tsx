import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Board, Column, Card, Tag } from '../types';
import { toast } from 'react-hot-toast';

interface BoardContextType {
  boards: Board[];
  currentBoard: Board | null;
  columns: Column[];
  cards: Card[];
  tags: Tag[];
  isLoading: boolean;
  fetchBoards: () => Promise<void>;
  fetchBoardData: (boardId: string) => Promise<void>;
  createBoard: (title: string) => Promise<Board | null>;
  createColumn: (title: string, boardId: string) => Promise<Column | null>;
  createCard: (title: string, columnId: string) => Promise<Card | null>;
  updateCardPosition: (cardId: string, columnId: string, position: number) => Promise<void>;
  updateCard: (card: Partial<Card> & { id: string }) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addTagToCard: (cardId: string, tagId: string) => Promise<void>;
  removeTagFromCard: (cardId: string, tagId: string) => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
}

const BoardContext = createContext<BoardContextType | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all boards
  const fetchBoards = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBoards(data || []);
    } catch (error) {
      console.error('Error fetching boards:', error);
      toast.error('Failed to load boards');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all tags
  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to load tags');
    }
  };

  // Fetch board data (columns and cards)
  const fetchBoardData = async (boardId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch board
      const { data: boardData, error: boardError } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();
      
      if (boardError) throw boardError;
      setCurrentBoard(boardData);
      
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .eq('board_id', boardId)
        .order('position');
      
      if (columnsError) throw columnsError;
      setColumns(columnsData || []);
      
      // Fetch cards
      const { data: cardsData, error: cardsError } = await supabase
        .from('cards')
        .select(`
          *,
          tags:card_tags(
            tag_id
          )
        `)
        .in('column_id', columnsData?.map(col => col.id) || [])
        .order('position');
      
      if (cardsError) throw cardsError;
      
      // Process cards to include tag objects
      const processedCards = await Promise.all((cardsData || []).map(async (card) => {
        const tagIds = card.tags?.map((t: any) => t.tag_id) || [];
        
        if (tagIds.length > 0) {
          const { data: tagData } = await supabase
            .from('tags')
            .select('*')
            .in('id', tagIds);
          
          return { ...card, tags: tagData || [] };
        }
        
        return { ...card, tags: [] };
      }));
      
      setCards(processedCards);
    } catch (error) {
      console.error('Error fetching board data:', error);
      toast.error('Failed to load board data');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new board
  const createBoard = async (title: string): Promise<Board | null> => {
    try {
      const { data, error } = await supabase
        .from('boards')
        .insert({ title })
        .select()
        .single();

      if (error) throw error;
      
      setBoards(prev => [data, ...prev]);
      toast.success('Board created');
      return data;
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error('Failed to create board');
      return null;
    }
  };

  // Create a new column
  const createColumn = async (title: string, boardId: string): Promise<Column | null> => {
    try {
      // Get the highest position
      const { data: existingColumns } = await supabase
        .from('columns')
        .select('position')
        .eq('board_id', boardId)
        .order('position', { ascending: false })
        .limit(1);

      const position = existingColumns && existingColumns.length > 0 
        ? existingColumns[0].position + 1 
        : 0;

      const { data, error } = await supabase
        .from('columns')
        .insert({ title, board_id: boardId, position })
        .select()
        .single();

      if (error) throw error;
      
      setColumns(prev => [...prev, data]);
      toast.success('Column created');
      return data;
    } catch (error) {
      console.error('Error creating column:', error);
      toast.error('Failed to create column');
      return null;
    }
  };

  // Create a new card
  const createCard = async (title: string, columnId: string): Promise<Card | null> => {
    try {
      // Get the highest position
      const { data: existingCards } = await supabase
        .from('cards')
        .select('position')
        .eq('column_id', columnId)
        .order('position', { ascending: false })
        .limit(1);

      const position = existingCards && existingCards.length > 0 
        ? existingCards[0].position + 1 
        : 0;

      const { data, error } = await supabase
        .from('cards')
        .insert({ title, column_id: columnId, position })
        .select()
        .single();

      if (error) throw error;
      
      const newCard = { ...data, tags: [] };
      setCards(prev => [...prev, newCard]);
      toast.success('Card created');
      return newCard;
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Failed to create card');
      return null;
    }
  };

  // Update card position (for drag and drop)
  const updateCardPosition = async (cardId: string, columnId: string, position: number) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update({ column_id: columnId, position })
        .eq('id', cardId);

      if (error) throw error;
      
      // Update local state
      setCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { ...card, column_id: columnId, position } 
            : card
        )
      );
    } catch (error) {
      console.error('Error updating card position:', error);
      toast.error('Failed to update card position');
    }
  };

  // Update card details
  const updateCard = async (card: Partial<Card> & { id: string }) => {
    try {
      const { error } = await supabase
        .from('cards')
        .update(card)
        .eq('id', card.id);

      if (error) throw error;
      
      // Update local state
      setCards(prev => 
        prev.map(c => 
          c.id === card.id 
            ? { ...c, ...card } 
            : c
        )
      );
      toast.success('Card updated');
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Failed to update card');
    }
  };

  // Delete a card
  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      
      // Update local state
      setCards(prev => prev.filter(card => card.id !== cardId));
      toast.success('Card deleted');
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  // Delete a column
  const deleteColumn = async (columnId: string) => {
    try {
      const { error } = await supabase
        .from('columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;
      
      // Update local state
      setColumns(prev => prev.filter(column => column.id !== columnId));
      setCards(prev => prev.filter(card => card.column_id !== columnId));
      toast.success('Column deleted');
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error('Failed to delete column');
    }
  };

  // Delete a board
  const deleteBoard = async (boardId: string) => {
    try {
      const { error } = await supabase
        .from('boards')
        .delete()
        .eq('id', boardId);

      if (error) throw error;
      
      // Update local state
      setBoards(prev => prev.filter(board => board.id !== boardId));
      if (currentBoard?.id === boardId) {
        setCurrentBoard(null);
        setColumns([]);
        setCards([]);
      }
      toast.success('Board deleted');
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    }
  };

  // Add a tag to a card
  const addTagToCard = async (cardId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('card_tags')
        .insert({ card_id: cardId, tag_id: tagId });

      if (error) throw error;
      
      // Find the tag
      const tag = tags.find(t => t.id === tagId);
      
      // Update local state
      setCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { 
                ...card, 
                tags: [...(card.tags || []), tag]
              } 
            : card
        )
      );
      toast.success('Tag added');
    } catch (error) {
      console.error('Error adding tag to card:', error);
      toast.error('Failed to add tag');
    }
  };

  // Remove a tag from a card
  const removeTagFromCard = async (cardId: string, tagId: string) => {
    try {
      const { error } = await supabase
        .from('card_tags')
        .delete()
        .eq('card_id', cardId)
        .eq('tag_id', tagId);

      if (error) throw error;
      
      // Update local state
      setCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { 
                ...card, 
                tags: (card.tags || []).filter(tag => tag.id !== tagId)
              } 
            : card
        )
      );
      toast.success('Tag removed');
    } catch (error) {
      console.error('Error removing tag from card:', error);
      toast.error('Failed to remove tag');
    }
  };

  // Load initial data
  useEffect(() => {
    fetchBoards();
    fetchTags();
  }, []);

  return (
    <BoardContext.Provider
      value={{
        boards,
        currentBoard,
        columns,
        cards,
        tags,
        isLoading,
        fetchBoards,
        fetchBoardData,
        createBoard,
        createColumn,
        createCard,
        updateCardPosition,
        updateCard,
        deleteCard,
        deleteColumn,
        deleteBoard,
        addTagToCard,
        removeTagFromCard,
        setCurrentBoard
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = () => {
  const context = useContext(BoardContext);
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  return context;
};