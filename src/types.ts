//src/types.ts
export type Role = "modele" | "chateur" | "subscriber";
export type MediaType = "image" | "video";

export interface User {
  id: string;
  username: string;
  password: string;
  role: Role;
  displayName: string;
  avatar: string;
  bio: string;
  createdByModelId?: string;
}

export interface ContentItem {
  id: string;
  creatorId: string;
  chateurId?: string | null;
  linkedMessageId?: string;
  title: string;
  caption: string;
  price: number;
  mediaType: MediaType;
  mediaUrl: string;
  previewUrl: string;
  visibility: "public" | "ppv";
  createdAt: string;
}

export interface Transaction {
  id: string;
  contentId: string;
  buyerId: string;
  sellerId: string;
  chateurId?: string | null;
  amount: number;
  accessGranted: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: Role;
  senderDisplayName: string;
  subscriberVisibleSenderName: string;
  text: string;
  contentId?: string;
  createdAt: string;
}

export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  kicker: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description: string;
}
