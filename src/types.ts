export type Role = "modele" | "chateur" | "subscriber";
export type MediaType = "image" | "video";
export type SellerRole = "modele" | "chateur";
export type PaymentSource = "chat" | "viewer" | "catalogue";
export type SubscriptionStatus = "active" | "inactive";

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: Role;
  displayName: string;
  avatar: string;
  bio: string;
  mustChangePassword?: boolean;
  accessibleModelIds?: string[];
  subscribedModelIds?: string[];
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPrice?: number;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
}

export interface Subscription {
  id: string;
  subscriberId: string;
  modelId: string;
  price: number;
  status: SubscriptionStatus;
  startedAt: string | null;
  expiresAt: string | null;
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
  visibility: "public" | "subscriber" | "ppv";
  createdAt: string;
}

export interface Transaction {
  id: string;
  contentId: string;
  contentTitle: string;
  buyerId: string;
  buyerUsername: string;
  creatorId: string;
  creatorUsername: string;
  soldByUserId: string;
  soldByUsername: string;
  soldByRole: SellerRole;
  chateurId?: string | null;
  amount: number;
  currency: "EUR";
  source: PaymentSource;
  accessGranted: boolean;
  chatterCommissionRate: number;
  chatterCommissionAmount: number;
  modelNetAmount: number;
  createdAt: string;
}

export interface InlineAttachment {
  id: string;
  title: string;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  previewUrl: string;
}

export interface Message {
  id: string;
  conversationId: string;
  modelId: string;
  senderId: string;
  senderRole: Role;
  senderDisplayName: string;
  subscriberVisibleSenderName: string;
  text: string;
  contentId?: string;
  inlineAttachment?: InlineAttachment;
  createdAt: string;
}

export interface ComposerMediaPayload {
  title: string;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  previewUrl: string;
  price?: number;
}

export interface SendMessagePayload {
  text: string;
  mediaItem?: ComposerMediaPayload | null;
}

export interface MediaLibraryItem {
  id: string;
  ownerModelId?: string | null;
  collection: string;
  title: string;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  previewUrl: string;
  defaultPrice: number;
}

export interface ScriptTemplate {
  id: string;
  ownerModelId?: string | null;
  phase: string;
  title: string;
  body: string;
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
