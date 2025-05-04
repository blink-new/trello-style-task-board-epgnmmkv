import { useState } from 'react';
import { useBoard } from '../context/BoardContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export function BoardList() {
  const { boards, createBoard, deleteBoard, fetchBoardData, setCurrentBoard } = useBoard();
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateBoard = async () => {
    if (newBoardTitle.trim()) {
      const board = await createBoard(newBoardTitle.trim());
      if (board) {
        setNewBoardTitle('');
        setIsDialogOpen(false);
      }
    }
  };

  const handleSelectBoard = (boardId: string) => {
    fetchBoardData(boardId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Boards</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <PlusCircle className="h-4 w-4" />
              New Board
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Board</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Board Title"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateBoard()}
              />
              <Button onClick={handleCreateBoard} className="w-full">
                Create Board
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No boards yet. Create your first board to get started!
          </div>
        ) : (
          boards.map((board) => (
            <Card key={board.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">{board.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard(board.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => handleSelectBoard(board.id)}
                >
                  Open Board
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}