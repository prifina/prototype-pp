import { useParams } from "react-router-dom";
import { useTwinData } from "@/hooks/useTwinData";
import { useStreamingChat } from "@/hooks/useStreamingChat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AiAvatar from "@/components/AiAvatar";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SuggestedQuestions from "@/components/SuggestedQuestions";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, MessageCircle } from "lucide-react";
import { loadingMessageId } from "@/utils";

const Index = () => {
  const { twinName } = useParams<{ twinName: string }>();

  // Redirect to onboarding if no twin name provided
  if (!twinName) {
    window.location.href = '/';
    return null;
  }

  const { profile, session, loading, error } = useTwinData(twinName);
  const {
    messages,
    isLoading: isChatLoading,
    sendMessage,
    messageRetrieved,
  } = useStreamingChat(
    profile?.knowledgebaseId,
    profile?.userId,
    session ? session.sessionId : ""
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-96 mx-auto" />
            </div>
            <Card className="h-96">
              <div className="p-4 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Alert className="max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Alert className="max-w-md mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Twin profile not found. Please check the URL.
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleSuggestedQuestion = async (question: string) => {
    await sendMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Twin Profile Header */}
          <div className="text-center mb-8">
            <AiAvatar
              name={profile.name}
              description={profile.caption}
              avatar={profile["avatar-url"]}
            />
          </div>

          {/* Chat Interface */}
          <Card className="min-h-[500px] flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto max-h-96">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 mb-6">
                    Start a conversation with {profile.name}
                  </p>
                  <SuggestedQuestions
                    onQuestionSelect={handleSuggestedQuestion}
                    questions={profile.exampleQuestions}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message.text}
                      isUser={message.isUser}
                      avatar={profile["avatar-url"]}
                      timestamp={message.timestamp}
                    />
                  ))}
                  {isChatLoading && (
                    <ChatMessage
                      index={loadingMessageId}
                      // index={messages.length - 1}
                      // message="Thinking..."
                      isWaiting={!messageRetrieved}
                      isUser={false}
                      timestamp={new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={isChatLoading}
              />
            </div>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
