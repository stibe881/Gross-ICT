import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface SortableWidgetProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

export function SortableWidget({ id, title, description, icon: Icon, color, onClick }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden relative"
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 cursor-grab active:cursor-grabbing z-10"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className={`h-2 bg-gradient-to-r ${color}`} />
        <div onClick={onClick}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white`}>
                <Icon className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="mt-4 group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="text-sm">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="ghost"
              className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
            >
              Öffnen →
            </Button>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
