export interface Board {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CardTag {
  card_id: string;
  tag_id: string;
}