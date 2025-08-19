
import { Badge } from "@/components/ui/badge";

interface AiAvatarProps {
  name?: string;
  description?: string;
  avatar?: string;
}

const AiAvatar = ({ 
  name = "Valto AI", 
  description = "Hi! I'm Valto's personal AI twin. How can I help you?",
  avatar 
}: AiAvatarProps) => {
  return (
    <div className="flex flex-col items-center space-y-4 mb-8">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
          <img 
            src={avatar || "/lovable-uploads/28eb4092-896e-4ebd-a3a1-60f36f77edb4.png"}
            alt={`${name} AI`}
            className="w-full h-full object-cover"
          />
        </div>
        <Badge 
          variant="secondary" 
          className="absolute -bottom-1 -right-1 bg-black text-white text-xs px-2 py-1 font-semibold rounded-full border-2 border-white"
        >
          AI
        </Badge>
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">{name}</h1>
        <p className="text-gray-600 max-w-md">
          {description}
        </p>
      </div>
    </div>
  );
};

export default AiAvatar;
