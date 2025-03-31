import { Link } from "wouter";
import { Home, PlusCircle, Clock, BarChart } from "lucide-react";

interface BottomNavigationProps {
  currentPath: string;
}

export default function BottomNavigation({ currentPath }: BottomNavigationProps) {
  const isActive = (path: string) => currentPath === path;

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around">
          <NavButton 
            icon={<Home className="h-6 w-6" />} 
            label="Home" 
            href="/" 
            isActive={isActive("/")} 
          />
          <NavButton 
            icon={<PlusCircle className="h-6 w-6" />} 
            label="Workout" 
            href="/workout" 
            isActive={isActive("/workout")} 
          />
          <NavButton 
            icon={<Clock className="h-6 w-6" />} 
            label="History" 
            href="/history" 
            isActive={isActive("/history")} 
          />
          <NavButton 
            icon={<BarChart className="h-6 w-6" />} 
            label="Progress" 
            href="/progress" 
            isActive={isActive("/progress")} 
          />
        </div>
      </div>
    </nav>
  );
}

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

function NavButton({ icon, label, href, isActive }: NavButtonProps) {
  return (
    <Link href={href}>
      <a className={`flex flex-col items-center py-2 px-3 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}
