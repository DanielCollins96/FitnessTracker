import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">FitTrack</h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Search className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}
