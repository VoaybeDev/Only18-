import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoContent, demoMessages, demoTransactions, demoUsers } from "@/data/seed";
import {
  ContentItem,
  Message,
  PaymentSource,
  SellerRole,
  ToastItem,
  Transaction,
  User,
} from "@/types";

interface RegisterPayload {
  username: string;
  password: string;
}

interface ActionResult {
  ok: boolean;
  message: string;
}

interface AppStore {
  currentUserId: string | null;
  onboardingComplete: boolean;
  users: User[];
  content: ContentItem[];
  transactions: Transaction[];
  messages: Message[];
  toasts: ToastItem[];
  login: (username: string, password: string) => ActionResult;
  register: (payload: RegisterPayload) => ActionResult;
  logout: () => void;
  completeOnboarding: () => void;
  subscribeToModel: () => ActionResult;
  simulatePayment: (contentId: string, source?: PaymentSource) => ActionResult;
  sendMessage: (conversationId: string, text: string) => ActionResult;
  pushToast: (title: string, description: string) => void;
  dismissToast: (toastId: string) => void;
  resetDemo: () => void;
}

export const SUBSCRIPTION_PRICE = 12.99;
export const SUBSCRIPTION_DURATION_DAYS = 30;

const CHATTER_COMMISSION_RATE = 0.1;
const DAY_MS = 1000 * 60 * 60 * 24;

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function getCurrentUser(state: Pick<AppStore, "users" | "currentUserId">) {
  return state.users.find((user) => user.id === state.currentUserId) ?? null;
}

function resolveSaleMeta(item: ContentItem, users: User[], messages: Message[]) {
  const creator = users.find((user) => user.id === item.creatorId);
  const linkedMessage = item.linkedMessageId
    ? messages.find((message) => message.id === item.linkedMessageId)
    : undefined;

  if (linkedMessage && (linkedMessage.senderRole === "modele" || linkedMessage.senderRole === "chateur")) {
    const seller = users.find((user) => user.id === linkedMessage.senderId);

    if (seller) {
      const soldByRole = linkedMessage.senderRole as SellerRole;

      return {
        creatorId: creator?.id ?? item.creatorId,
        creatorUsername: creator?.username ?? "modele_test",
        sellerId: creator?.id ?? item.creatorId,
        soldByUserId: seller.id,
        soldByUsername: seller.username,
        soldByRole,
        chateurId: soldByRole === "chateur" ? seller.id : null,
      };
    }
  }

  return {
    creatorId: creator?.id ?? item.creatorId,
    creatorUsername: creator?.username ?? "modele_test",
    sellerId: creator?.id ?? item.creatorId,
    soldByUserId: creator?.id ?? item.creatorId,
    soldByUsername: creator?.username ?? "modele_test",
    soldByRole: "modele" as SellerRole,
    chateurId: null,
  };
}

const initialState = {
  currentUserId: null,
  onboardingComplete: false,
  users: demoUsers,
  content: demoContent,
  transactions: demoTransactions,
  messages: demoMessages,
  toasts: [] as ToastItem[],
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (username, password) => {
        const user = get().users.find(
          (candidate) => candidate.username === username && candidate.password === password,
        );

        if (!user) {
          return { ok: false, message: "Identifiants invalides." };
        }

        set({ currentUserId: user.id });
        return { ok: true, message: `Bienvenue ${user.displayName}` };
      },

      register: ({ username, password }) => {
        const alreadyExists = get().users.some((user) => user.username === username);

        if (alreadyExists) {
          return { ok: false, message: "Ce nom d’utilisateur existe déjà." };
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          username,
          password,
          role: "subscriber",
          displayName: username,
          avatar: `https://picsum.photos/seed/${username}/200/200`,
          bio: "Nouveau fan inscrit depuis la démo locale.",
          subscriptionStatus: "inactive",
          subscriptionPrice: SUBSCRIPTION_PRICE,
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
        };

        set((state) => ({
          users: [newUser, ...state.users],
          currentUserId: newUser.id,
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title: "Compte créé",
              description: "Ton compte fan est prêt.",
            },
            ...state.toasts,
          ],
        }));

        return { ok: true, message: "Compte créé avec succès." };
      },

      logout: () => set({ currentUserId: null }),

      completeOnboarding: () => set({ onboardingComplete: true }),

      subscribeToModel: () => {
        const state = get();
        const currentUser = getCurrentUser(state);

        if (!currentUser) {
          return { ok: false, message: "Connecte-toi pour t’abonner." };
        }

        if (currentUser.role !== "subscriber") {
          return { ok: false, message: "Seuls les fans peuvent s’abonner." };
        }

        if (isSubscriptionActive(currentUser)) {
          return { ok: true, message: "Ton abonnement est déjà actif." };
        }

        const startedAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + SUBSCRIPTION_DURATION_DAYS * DAY_MS).toISOString();

        set((previous) => ({
          users: previous.users.map((user) =>
            user.id === currentUser.id
              ? {
                  ...user,
                  subscriptionStatus: "active",
                  subscriptionPrice: SUBSCRIPTION_PRICE,
                  subscriptionStartedAt: startedAt,
                  subscriptionExpiresAt: expiresAt,
                }
              : user,
          ),
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title: "Abonnement activé",
              description: `Audience privée ouverte pendant ${SUBSCRIPTION_DURATION_DAYS} jours.`,
            },
            ...previous.toasts,
          ],
        }));

        return { ok: true, message: "Abonnement activé." };
      },

      simulatePayment: (contentId, source = "catalogue") => {
        const state = get();
        const currentUser = getCurrentUser(state);
        const item = state.content.find((content) => content.id === contentId);

        if (!currentUser) {
          return { ok: false, message: "Connecte-toi pour débloquer ce contenu." };
        }

        if (!item) {
          return { ok: false, message: "Contenu introuvable." };
        }

        if (currentUser.role !== "subscriber") {
          return { ok: true, message: "Les comptes internes ont déjà accès au contenu." };
        }

        if (item.visibility !== "public" && !isSubscriptionActive(currentUser)) {
          return {
            ok: false,
            message: "Abonne-toi d’abord pour accéder aux contenus privés.",
          };
        }

        const existing = state.transactions.find(
          (transaction) =>
            transaction.contentId === contentId &&
            transaction.buyerId === currentUser.id &&
            transaction.accessGranted,
        );

        if (item.price === 0 || existing) {
          return { ok: true, message: "Ce contenu est déjà accessible." };
        }

        const saleMeta = resolveSaleMeta(item, state.users, state.messages);
        const chatterCommissionAmount =
          saleMeta.soldByRole === "chateur" ? roundToTwo(item.price * CHATTER_COMMISSION_RATE) : 0;
        const modelNetAmount = roundToTwo(item.price - chatterCommissionAmount);

        const transaction: Transaction = {
          id: `txn-${Date.now()}`,
          contentId: item.id,
          contentTitle: item.title,
          buyerId: currentUser.id,
          buyerUsername: currentUser.username,
          creatorId: saleMeta.creatorId,
          creatorUsername: saleMeta.creatorUsername,
          sellerId: saleMeta.sellerId,
          soldByUserId: saleMeta.soldByUserId,
          soldByUsername: saleMeta.soldByUsername,
          soldByRole: saleMeta.soldByRole,
          chateurId: saleMeta.chateurId,
          amount: item.price,
          currency: "EUR",
          source,
          accessGranted: true,
          chatterCommissionRate: saleMeta.soldByRole === "chateur" ? CHATTER_COMMISSION_RATE : 0,
          chatterCommissionAmount,
          modelNetAmount,
          createdAt: new Date().toISOString(),
        };

        set((previous) => ({
          transactions: [transaction, ...previous.transactions],
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title: "Paiement simulé réussi",
              description: `${item.title} est maintenant déverrouillé.`,
            },
            ...previous.toasts,
          ],
        }));

        return { ok: true, message: "Paiement simulé réussi." };
      },

      sendMessage: (conversationId, text) => {
        const state = get();
        const currentUser = getCurrentUser(state);

        if (!currentUser || !text.trim()) {
          return { ok: false, message: "Message vide." };
        }

        if (currentUser.role === "subscriber" && !isSubscriptionActive(currentUser)) {
          set((previous) => ({
            toasts: [
              {
                id: `toast-${Date.now()}`,
                title: "Audience privée réservée",
                description: "Abonne-toi pour envoyer des messages privés.",
              },
              ...previous.toasts,
            ],
          }));

          return {
            ok: false,
            message: "Seuls les fans abonnés peuvent écrire à la modèle.",
          };
        }

        const message: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          senderId: currentUser.id,
          senderRole: currentUser.role,
          senderDisplayName: currentUser.displayName,
          subscriberVisibleSenderName:
            currentUser.role === "subscriber" ? currentUser.displayName : "modele_test",
          text: text.trim(),
          createdAt: new Date().toISOString(),
        };

        set((previous) => ({
          messages: [...previous.messages, message],
        }));

        return { ok: true, message: "Message envoyé." };
      },

      pushToast: (title, description) => {
        set((state) => ({
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title,
              description,
            },
            ...state.toasts,
          ],
        }));
      },

      dismissToast: (toastId) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== toastId),
        }));
      },

      resetDemo: () => {
        set({ ...initialState });
      },
    }),
    {
      name: "only18plus-demo-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        onboardingComplete: state.onboardingComplete,
        users: state.users,
        content: state.content,
        transactions: state.transactions,
        messages: state.messages,
      }),
    },
  ),
);

export const selectCurrentUser = (state: AppStore) =>
  state.users.find((user) => user.id === state.currentUserId) ?? null;

export const isSubscriptionActive = (user: User | null) => {
  if (!user || user.role !== "subscriber") return false;
  if (!user.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
};

export const hasAccessToContent = (
  user: User | null,
  item: ContentItem,
  transactions: Transaction[],
) => {
  if (!user) return false;
  if (user.role === "modele" || user.role === "chateur") return true;

  if (item.visibility === "public" && item.price === 0) return true;

  if (!isSubscriptionActive(user)) return false;

  if (item.visibility === "subscriber" && item.price === 0) return true;

  if (item.price === 0) return true;

  return transactions.some(
    (transaction) =>
      transaction.contentId === item.id &&
      transaction.buyerId === user.id &&
      transaction.accessGranted,
  );
};