
export interface SocialComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string; // ISO Date String
}

export interface SocialGalleryPost {
  id: string;
  fiestaId: string;
  imageUrl: string;
  authorName: string;
  timestamp: string; // ISO Date String
  likes: number;
  comments: SocialComment[];
}
