import { ChatThread } from "@/components/chat-thread";
import { Card, CardContent } from "@/components/ui/card";
import { selectCurrentUser, useAppStore } from "@/store/useAppStore";

export function ChatPage() {
  const currentUser = useAppStore(selectCurrentUser);
  const messages = useAppStore((state) => state.messages);
  const content = useAppStore((state) => state.content);
  const transactions = useAppStore((state) => state.transactions);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const simulatePayment = useAppStore((state) => state.simulatePayment);
  const pushToast = useAppStore((state) => state.pushToast);

  if (!currentUser) return null;

  const handleSimulatePayment = (contentId: string) => {
    const result = simulatePayment(contentId);
    if (!result.ok) {
      pushToast("Action impossible", result.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 sm:p-6">
          <h2 className="text-2xl font-semibold">Messages</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {currentUser.role === "subscriber"
              ? "Tous les messages reçus apparaissent comme envoyés par modele_test."
              : "Les messages envoyés par le chateur restent invisibles côté fan et sont affichés comme modele_test."}
          </p>
        </CardContent>
      </Card>

      <ChatThread
        currentUser={currentUser}
        messages={messages}
        content={content}
        transactions={transactions}
        onSendMessage={sendMessage}
        onSimulatePayment={handleSimulatePayment}
      />
    </div>
  );
}
