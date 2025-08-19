
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex-1" />
        </div>
      </div>
    </header>
  );
};

export default Header;
