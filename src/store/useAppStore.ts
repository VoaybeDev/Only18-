import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  demoContent,
  demoMessages,
  demoSubscriptions,
  demoTransactions,
  demoUsers,
} from "@/data/seed";
import {
  ContentItem,
  Message,
  PaymentSource,
  SellerRole,
  Subscription,
  SubscriptionStatus,
  ToastItem,
  Transaction,
  User,
} from "@/types";

interface RegisterPayload {
  username: string;
  password: string;
  email?: string;
}

interface ChatterAccessPayload {
  username: string;
  email: string;
  displayName: string;
}

interface ActionResult {
  ok: boolean;
  message: string;
  requiresPasswordChange?: boolean;
  temporaryPassword?: string;
}

interface AppStore {
  currentUserId: string | null;
  activeModelId: string | null;
  onboardingComplete: boolean;
  users: User[];
  subscriptions: Subscription[];
  content: ContentItem[];
  transactions: Transaction[];
  messages: Message[];
  toasts: ToastItem[];
  login: (username: string, password: string) => ActionResult;
  changePassword: (newPassword: string) => ActionResult;
  register: (payload: RegisterPayload) => ActionResult;
  logout: () => void;
  completeOnboarding: () => void;
  setActiveModel: (modelId: string) => ActionResult;
  subscribeToModel: (modelId?: string) => ActionResult;
  createOrGrantChatterAccess: (payload: ChatterAccessPayload) => ActionResult;
  simulatePayment: (contentId: string, source?: PaymentSource) => ActionResult;
  sendMessage: (conversationId: string, modelId: string, text: string) => ActionResult;
  pushToast: (title: string, description: string) => void;
  dismissToast: (toastId: string) => void;
  resetDemo: () => void;
}

export const SUBSCRIPTION_PRICE = 12.99;
export const SUBSCRIPTION_DURATION_DAYS = 30;
export const DEFAULT_CHATTER_PASSWORD = "12345678";
export const MAX_CHATTER_MODELS = 3;

const CHATTER_COMMISSION_RATE = 0.1;
const DAY_MS = 1000 * 60 * 60 * 24;

type StoreState = Pick<
  AppStore,
  | "currentUserId"
  | "activeModelId"
  | "onboardingComplete"
  | "users"
  | "subscriptions"
  | "content"
  | "transactions"
  | "messages"
  | "toasts"
>;

function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

function getCurrentUser(state: Pick<AppStore, "users" | "currentUserId">) {
  return state.users.find((user) => user.id === state.currentUserId) ?? null;
}

function getModelUsers(users: User[]) {
  return users.filter((user) => user.role === "modele");
}

function isSubscriptionRecordActive(subscription: Subscription | null | undefined) {
  if (!subscription) return false;
  if (subscription.status !== "active") return false;
  if (!subscription.expiresAt) return false;
  return new Date(subscription.expiresAt).getTime() > Date.now();
}

function getActiveSubscribedModelIds(subscriptions: Subscription[], subscriberId: string) {
  return subscriptions
    .filter(
      (subscription) =>
        subscription.subscriberId === subscriberId && isSubscriptionRecordActive(subscription),
    )
    .map((subscription) => subscription.modelId);
}

function getAccessibleModelsForUser(user: User | null, users: User[]) {
  if (!user) return [];

  if (user.role === "modele") {
    return users.filter((candidate) => candidate.role === "modele" && candidate.id === user.id);
  }

  if (user.role === "chateur") {
    const allowedIds = user.accessibleModelIds ?? [];
    return users.filter(
      (candidate) => candidate.role === "modele" && allowedIds.includes(candidate.id),
    );
  }

  return getModelUsers(users);
}

function getInitialActiveModelId(
  user: User,
  users: User[],
  subscriptions: Subscription[],
): string | null {
  const accessibleModels = getAccessibleModelsForUser(user, users);

  if (accessibleModels.length === 0) return null;

  if (user.role === "modele") {
    return user.id;
  }

  if (user.role === "chateur") {
    return accessibleModels[0]?.id ?? null;
  }

  const activeSubscription =
    subscriptions.find(
      (subscription) =>
        subscription.subscriberId === user.id && isSubscriptionRecordActive(subscription),
    ) ?? null;

  return activeSubscription?.modelId ?? accessibleModels[0]?.id ?? null;
}

function syncCurrentSubscriberFields(
  users: User[],
  currentUserId: string | null,
  activeModelId: string | null,
  subscriptions: Subscription[],
): User[] {
  return users.map((user) => {
    if (user.id !== currentUserId || user.role !== "subscriber") {
      return user;
    }

    const subscribedModelIds = getActiveSubscribedModelIds(subscriptions, user.id);

    const activeModelSubscription =
      activeModelId
        ? subscriptions.find(
            (subscription) =>
              subscription.subscriberId === user.id &&
              subscription.modelId === activeModelId &&
              isSubscriptionRecordActive(subscription),
          ) ?? null
        : null;

    const subscriptionStatus: SubscriptionStatus = activeModelSubscription
      ? "active"
      : "inactive";

    return {
      ...user,
      subscribedModelIds,
      subscriptionStatus,
      subscriptionPrice: activeModelSubscription?.price ?? SUBSCRIPTION_PRICE,
      subscriptionStartedAt: activeModelSubscription?.startedAt ?? null,
      subscriptionExpiresAt: activeModelSubscription?.expiresAt ?? null,
    };
  });
}

function resolveSaleMeta(item: ContentItem, users: User[], messages: Message[]) {
  const creator = users.find((user) => user.id === item.creatorId);
  const linkedMessage = item.linkedMessageId
    ? messages.find((message) => message.id === item.linkedMessageId)
    : undefined;

  if (
    linkedMessage &&
    (linkedMessage.senderRole === "modele" || linkedMessage.senderRole === "chateur")
  ) {
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

const initialState: StoreState = {
  currentUserId: null,
  activeModelId: null,
  onboardingComplete: false,
  users: demoUsers,
  subscriptions: demoSubscriptions,
  content: demoContent,
  transactions: demoTransactions,
  messages: demoMessages,
  toasts: [],
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

        const activeModelId = getInitialActiveModelId(user, get().users, get().subscriptions);
        const nextUsers = syncCurrentSubscriberFields(
          get().users,
          user.id,
          activeModelId,
          get().subscriptions,
        );

        set({
          currentUserId: user.id,
          activeModelId,
          users: nextUsers,
        });

        return {
          ok: true,
          message: `Bienvenue ${user.displayName}`,
          requiresPasswordChange: user.role === "chateur" && Boolean(user.mustChangePassword),
        };
      },

      changePassword: (newPassword) => {
        const currentUser = getCurrentUser(get());

        if (!currentUser) {
          return { ok: false, message: "Aucune session active." };
        }

        if (newPassword.trim().length < 8) {
          return { ok: false, message: "Le mot de passe doit contenir au moins 8 caractères." };
        }

        set((state) => ({
          users: state.users.map((user) =>
            user.id === currentUser.id
              ? {
                  ...user,
                  password: newPassword.trim(),
                  mustChangePassword: false,
                }
              : user,
          ),
        }));

        return { ok: true, message: "Mot de passe mis à jour." };
      },

      register: ({ username, password, email }) => {
        const usernameTaken = get().users.some(
          (user) => normalizeValue(user.username) === normalizeValue(username),
        );

        if (usernameTaken) {
          return { ok: false, message: "Ce nom d’utilisateur existe déjà." };
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          username,
          email: email?.trim() || `${username}@only18.local`,
          password,
          role: "subscriber",
          displayName: username,
          avatar: `https://picsum.photos/seed/${username}/200/200`,
          bio: "Nouveau fan inscrit depuis la démo locale.",
          subscribedModelIds: [],
          subscriptionStatus: "inactive",
          subscriptionPrice: SUBSCRIPTION_PRICE,
          subscriptionStartedAt: null,
          subscriptionExpiresAt: null,
        };

        const modelUsers = getModelUsers(get().users);
        const activeModelId = modelUsers[0]?.id ?? null;
        const nextUsers = syncCurrentSubscriberFields(
          [newUser, ...get().users],
          newUser.id,
          activeModelId,
          get().subscriptions,
        );

        set((state) => ({
          users: nextUsers,
          currentUserId: newUser.id,
          activeModelId,
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

      logout: () => set({ currentUserId: null, activeModelId: null }),

      completeOnboarding: () => set({ onboardingComplete: true }),

      setActiveModel: (modelId) => {
        const currentUser = getCurrentUser(get());

        if (!currentUser) {
          return { ok: false, message: "Aucune session active." };
        }

        const accessibleModels = getAccessibleModelsForUser(currentUser, get().users);
        const canAccess = accessibleModels.some((model) => model.id === modelId);

        if (!canAccess) {
          return { ok: false, message: "Accès refusé à cette modèle." };
        }

        const nextUsers = syncCurrentSubscriberFields(
          get().users,
          currentUser.id,
          modelId,
          get().subscriptions,
        );

        set({
          activeModelId: modelId,
          users: nextUsers,
        });

        return { ok: true, message: "Modèle active changée." };
      },

      subscribeToModel: (modelId) => {
        const state = get();
        const currentUser = getCurrentUser(state);

        if (!currentUser) {
          return { ok: false, message: "Connecte-toi pour t’abonner." };
        }

        if (currentUser.role !== "subscriber") {
          return { ok: false, message: "Seuls les fans peuvent s’abonner." };
        }

        const targetModelId = modelId ?? state.activeModelId;

        if (!targetModelId) {
          return { ok: false, message: "Aucune modèle sélectionnée." };
        }

        const existing =
          state.subscriptions.find(
            (subscription) =>
              subscription.subscriberId === currentUser.id &&
              subscription.modelId === targetModelId,
          ) ?? null;

        if (existing && isSubscriptionRecordActive(existing)) {
          return { ok: true, message: "Ton abonnement est déjà actif pour cette modèle." };
        }

        const startedAt = new Date().toISOString();
        const expiresAt = new Date(
          Date.now() + SUBSCRIPTION_DURATION_DAYS * DAY_MS,
        ).toISOString();

        const nextSubscriptions: Subscription[] = existing
          ? state.subscriptions.map((subscription) =>
              subscription.id === existing.id
                ? {
                    ...subscription,
                    status: "active",
                    price: SUBSCRIPTION_PRICE,
                    startedAt,
                    expiresAt,
                  }
                : subscription,
            )
          : [
              {
                id: `sub-${Date.now()}`,
                subscriberId: currentUser.id,
                modelId: targetModelId,
                price: SUBSCRIPTION_PRICE,
                status: "active",
                startedAt,
                expiresAt,
              },
              ...state.subscriptions,
            ];

        const nextUsers = syncCurrentSubscriberFields(
          state.users,
          currentUser.id,
          targetModelId,
          nextSubscriptions,
        );

        set((previous) => ({
          subscriptions: nextSubscriptions,
          users: nextUsers,
          activeModelId: targetModelId,
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title: "Abonnement activé",
              description: `Accès privé ouvert pendant ${SUBSCRIPTION_DURATION_DAYS} jours.`,
            },
            ...previous.toasts,
          ],
        }));

        return { ok: true, message: "Abonnement activé." };
      },

      createOrGrantChatterAccess: (payload) => {
        const state = get();
        const currentUser = getCurrentUser(state);

        if (!currentUser || currentUser.role !== "modele") {
          return { ok: false, message: "Seule une modèle peut créer ou attribuer un chateur." };
        }

        const username = payload.username.trim();
        const email = payload.email.trim();
        const displayName = payload.displayName.trim() || username;

        if (!username || !email) {
          return { ok: false, message: "Username et email sont obligatoires." };
        }

        const usernameOwner = state.users.find(
          (user) => normalizeValue(user.username) === normalizeValue(username),
        );
        const emailOwner = state.users.find(
          (user) => normalizeValue(user.email) === normalizeValue(email),
        );

        if (usernameOwner && emailOwner && usernameOwner.id !== emailOwner.id) {
          return {
            ok: false,
            message: "Username et email correspondent à deux comptes différents.",
          };
        }

        const existing = usernameOwner ?? emailOwner;

        if (existing) {
          if (existing.role !== "chateur") {
            return {
              ok: false,
              message: "Ce username ou cet email est déjà utilisé par un autre type de compte.",
            };
          }

          const currentAccess = existing.accessibleModelIds ?? [];

          if (currentAccess.includes(currentUser.id)) {
            return { ok: false, message: "Ce chateur a déjà accès à cette modèle." };
          }

          if (currentAccess.length >= MAX_CHATTER_MODELS) {
            return {
              ok: false,
              message: `Ce chateur a déjà ${MAX_CHATTER_MODELS} modèles au maximum.`,
            };
          }

          set((previous) => ({
            users: previous.users.map((user) =>
              user.id === existing.id
                ? {
                    ...user,
                    accessibleModelIds: [...(user.accessibleModelIds ?? []), currentUser.id],
                  }
                : user,
            ),
            toasts: [
              {
                id: `toast-${Date.now()}`,
                title: "Accès accordé",
                description: `${existing.displayName} peut maintenant chatter pour ${currentUser.displayName}.`,
              },
              ...previous.toasts,
            ],
          }));

          return {
            ok: true,
            message: "Compte existant trouvé. L’accès à cette modèle a été ajouté.",
          };
        }

        const newChatter: User = {
          id: `chatter-${Date.now()}`,
          username,
          email,
          password: DEFAULT_CHATTER_PASSWORD,
          role: "chateur",
          displayName,
          avatar: `https://picsum.photos/seed/${username}/200/200`,
          bio: "Nouveau compte chateur créé par une modèle.",
          mustChangePassword: true,
          accessibleModelIds: [currentUser.id],
        };

        set((previous) => ({
          users: [newChatter, ...previous.users],
          toasts: [
            {
              id: `toast-${Date.now()}`,
              title: "Chateur créé",
              description: `${displayName} a été créé avec le mot de passe temporaire ${DEFAULT_CHATTER_PASSWORD}.`,
            },
            ...previous.toasts,
          ],
        }));

        return {
          ok: true,
          message: "Compte chateur créé avec succès.",
          temporaryPassword: DEFAULT_CHATTER_PASSWORD,
        };
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

        const hasSubscription = (currentUser.subscribedModelIds ?? []).includes(item.creatorId);

        if (item.visibility !== "public" && !hasSubscription) {
          return {
            ok: false,
            message: "Abonne-toi d’abord à cette modèle pour accéder aux contenus privés.",
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

      sendMessage: (conversationId, modelId, text) => {
        const state = get();
        const currentUser = getCurrentUser(state);

        if (!currentUser || !text.trim()) {
          return { ok: false, message: "Message vide." };
        }

        const model =
          state.users.find((user) => user.id === modelId && user.role === "modele") ?? null;

        if (!model) {
          return { ok: false, message: "Modèle introuvable." };
        }

        if (currentUser.role === "subscriber") {
          const subscribed = (currentUser.subscribedModelIds ?? []).includes(modelId);

          if (!subscribed) {
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
              message: "Seuls les fans abonnés peuvent écrire à cette modèle.",
            };
          }
        }

        if (currentUser.role === "chateur") {
          const canUseModel = (currentUser.accessibleModelIds ?? []).includes(modelId);

          if (!canUseModel) {
            return { ok: false, message: "Tu n’as pas accès à cette modèle." };
          }
        }

        if (currentUser.role === "modele" && currentUser.id !== modelId) {
          return { ok: false, message: "Cette session modèle ne correspond pas à la conversation." };
        }

        const message: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          modelId,
          senderId: currentUser.id,
          senderRole: currentUser.role,
          senderDisplayName: currentUser.displayName,
          subscriberVisibleSenderName:
            currentUser.role === "subscriber" ? currentUser.displayName : model.displayName,
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
        activeModelId: state.activeModelId,
        onboardingComplete: state.onboardingComplete,
        users: state.users,
        subscriptions: state.subscriptions,
        content: state.content,
        transactions: state.transactions,
        messages: state.messages,
      }),
    },
  ),
);

export const selectCurrentUser = (state: AppStore) =>
  state.users.find((user) => user.id === state.currentUserId) ?? null;

export const selectActiveModel = (state: AppStore) =>
  state.users.find((user) => user.id === state.activeModelId && user.role === "modele") ?? null;

export const isSubscriptionActive = (user: User | null) => {
  if (!user || user.role !== "subscriber") return false;
  if (user.subscriptionStatus !== "active") return false;
  if (!user.subscriptionExpiresAt) return false;
  return new Date(user.subscriptionExpiresAt).getTime() > Date.now();
};

export const isModelSubscribedByUser = (user: User | null, modelId: string) => {
  if (!user || user.role !== "subscriber") return false;
  return (user.subscribedModelIds ?? []).includes(modelId);
};

export const hasAccessToContent = (
  user: User | null,
  item: ContentItem,
  transactions: Transaction[],
) => {
  if (!user) return false;

  if (user.role === "modele") {
    return user.id === item.creatorId;
  }

  if (user.role === "chateur") {
    return (user.accessibleModelIds ?? []).includes(item.creatorId);
  }

  if (item.visibility === "public" && item.price === 0) return true;

  const subscribed = (user.subscribedModelIds ?? []).includes(item.creatorId);

  if (!subscribed) return false;

  if (item.visibility === "subscriber" && item.price === 0) return true;

  if (item.price === 0) return true;

  return transactions.some(
    (transaction) =>
      transaction.contentId === item.id &&
      transaction.buyerId === user.id &&
      transaction.accessGranted,
  );
};

export const getConversationId = (modelId: string, fanId: string) =>
  `conv|${modelId}|${fanId}`;