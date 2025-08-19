import { useState } from "react";
import { middlewareApi } from "@/services/middlewareApi";
import { SecurityUtils } from "@/services/securityUtils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export const useStreamingChat = (
  knowledgebaseId?: string,
  userId?: string,
  sessionId?: string
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageRetrieved, setMessageRetrieved] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (messageText: string) => {
    // Validate input
    const { isValid, sanitized, error } =
      SecurityUtils.validateChatMessage(messageText);
    if (!isValid) {
      toast({
        title: "Invalid Message",
        description: error || "Please check your message and try again.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitized,
      isUser: true,
      timestamp,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setMessageRetrieved(false);

    try {
      // Check if we have session data for API calls
      if (!knowledgebaseId || !userId) {
        // Fallback demo response
        const demoResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm currently in demo mode. The backend API is not available, so I can't provide real responses. Please check the API configuration.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, demoResponse]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      // Prepare AI response
      const aiMessageId = (Date.now() + 1).toString();

      const answer = await middlewareApi.streamGenerate({
        knowledgebaseId,
        userId,
        statement: sanitized,
        stream: true,
        index: messages.length / 2,
        sessionId,
        stopLoading: () => {
          setMessageRetrieved(true);
        },
      });

      console.log("ANSWER", answer);
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          text: answer[0].answer,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      console.error("Streaming error:", error);

      // Show user-friendly error message
      let errorMessage =
        "I'm having trouble responding right now. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Rate limited")) {
          errorMessage =
            "Too many requests. Please wait a moment before trying again.";
        } else if (error.message.includes("Invalid")) {
          errorMessage =
            "There was an issue with your message. Please try rephrasing it.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Add error message
      const errorResponseMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: errorMessage,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, errorResponseMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, messageRetrieved, sendMessage };
};
