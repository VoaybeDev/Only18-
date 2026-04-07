import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

interface SendMessageResult {
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
  login: (username: string, password: string) => { ok: boolean; message: string };
  register: (payload: RegisterPayload) => { ok: boolean; message: string };
  logout: () => void;
  completeOnboarding: () => void;
  simulatePayment: (contentId: string, source?: PaymentSource) => { ok: boolean; message: string };
  sendMessage: (conversationId: string, text: string) => SendMessageResult;
  pushToast: (title: string, description: string) => void;
  dismissToast: (toastId: string) => void;
  resetDemo: () => void;
}

const CHATTER_COMMISSION_RATE = 0.1;

const initialState = {
  currentUserId: null,
  onboardingComplete: false,
  users: demoUsers,
  content: demoContent,
  transactions: demoTransactions,
  messages: demoMessages,
  toasts: [] as ToastItem[],
};

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
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
    soldByUserId: creator?.id ?? item.creatorId,
    soldByUsername: creator?.username ?? "modele_test",
    soldByRole: "modele" as SellerRole,
    chateurId: null,
  };
}

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

      simulatePayment: (contentId, source = "catalogue") => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);
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
              description:
                saleMeta.soldByRole === "chateur"
                  ? `${item.title} a été débloqué. Vente attribuée au chateur.`
                  : `${item.title} a été débloqué. Vente attribuée à la modèle.`,
            },
            ...previous.toasts,
          ],
        }));

        return { ok: true, message: "Paiement simulé réussi." };
      },

      sendMessage: (conversationId, text) => {
        const state = get();
        const currentUser = state.users.find((user) => user.id === state.currentUserId);

        if (!currentUser || !text.trim()) {
          return { ok: false, message: "Message vide." };
        }

        if (
          currentUser.role === "subscriber" &&
          currentUser.subscriptionStatus !== "active"
        ) {
          set((previous) => ({
            toasts: [
              {
                id: `toast-${Date.now()}`,
                title: "Audience privée réservée",
                description: "Seuls les fans abonnés peuvent écrire à la modèle.",
              },
              ...previous.toasts,
            ],
          }));

          return {
            ok: false,
            message: "Seuls les abonnés peuvent envoyer des messages.",
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

export const hasAccessToContent = (
  user: User | null,
  item: ContentItem,
  transactions: Transaction[],
) => {
  if (!user) return false;
  if (user.role === "modele" || user.role === "chateur") return true;
  if (item.price === 0) return true;

  return transactions.some(
    (transaction) =>
      transaction.contentId === item.id &&
      transaction.buyerId === user.id &&
      transaction.accessGranted,
  );
};