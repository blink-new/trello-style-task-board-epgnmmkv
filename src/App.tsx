import { useState, useEffect } from 'react';
import { BoardProvider } from './context/BoardContext';
import { BoardList } from './components/BoardList';
import { Board } from './components/Board';
import { useBoard } from './context/BoardContext';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { currentBoard, isLoading } = useBoard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {currentBoard ? <Board /> : <BoardList />}
    </div>
  );
}

function App() {
  return (
    <BoardProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto py-4 px-4">
            <h1 className="text-2xl font-bold">Task Board</h1>
          </div>
        </header>
        <main>
          <AppContent />
        </main>
      </div>
    </BoardProvider>
  );
}

export default App;