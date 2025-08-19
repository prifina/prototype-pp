import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import AiAvatar from "./AiAvatar";

interface ChatMessageProps {
  message?: string;
  isUser: boolean;
  timestamp: string;
  avatar?: string;
  index?: string;
  isWaiting?: boolean;
}

const ChatMessage = ({
  message,
  isUser,
  timestamp,
  avatar,
  index,
  isWaiting = false,
}: ChatMessageProps) => {
  return (
    <div
      id={index ? index : undefined}
      // key={"chat-" + index}
      className={`flex gap-3 mb-6 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className="relative flex-shrink-0">
        {isUser ? (
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-gray-200 text-gray-600">
              You
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AiAvatar avatar={avatar} />
              <AvatarFallback>VA</AvatarFallback>
            </Avatar>
            <Badge
              variant="secondary"
              className="absolute -bottom-1 -right-1 bg-black text-white text-xs px-1 py-0.5 font-semibold rounded-full border border-white"
            >
              AI
            </Badge>
          </div>
        )}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`inline-block max-w-3xl ${
            isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
          } rounded-2xl px-4 py-3`}
        >
          <p className="question-answer text-sm leading-relaxed whitespace-pre-wrap">
            {isWaiting ? "Thinking..." : message}
          </p>
        </div>
        <div
          className={`text-xs text-gray-500 mt-1 ${
            isUser ? "text-right" : "text-left"
          }`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
