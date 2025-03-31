import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface WorkoutSummaryProps {
  id: number;
  name: string;
  date: string;
  duration: number;
  exercises: string[];
  totalExercises: number;
  onClick?: () => void;
}

export default function WorkoutSummary({
  id,
  name,
  date,
  duration,
  exercises,
  totalExercises,
  onClick
}: WorkoutSummaryProps) {
  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium">{name}</h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium text-gray-800">{duration} min</span>
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      </div>
      <div className="flex mt-3 space-x-2 flex-wrap">
        {exercises.map((exercise, i) => (
          <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
            {exercise}
          </Badge>
        ))}
        {totalExercises > 3 && (
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
            +{totalExercises - 3} more
          </Badge>
        )}
      </div>
    </Card>
  );
}
