import { Trees, BookOpen, HeartPulse, GraduationCap, Landmark, Building2, Users, Music, Theater, Trophy, Sparkles, Eye, Wrench, MapPin as PinIcon } from "lucide-react";
import { categoryConfig } from "./CategoryBadge";
import { cn } from "~/lib/utils";
import type { Category } from "./CategoryBadge";
import type { LucideIcon } from "lucide-react";

const categoryIcons: Record<Category, LucideIcon> = {
  // PlaceCategory
  park:            Trees,
  library:         BookOpen,
  clinic:          HeartPulse,
  museum:          Landmark,
  townhall:        Building2,
  community_center:Users,
  education:       GraduationCap,
  sports:          Trophy,
  cultural_center: Sparkles,
  // EventCategory
  concert:         Music,
  theater:         Theater,
  sport:           Trophy,
  community:       Users,
  festival:        Sparkles,
  exhibition:      Eye,
  workshop:        Wrench,
  // shared
  other:           PinIcon,
};

interface MapPinProps {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
}

export function MapPinMarker({ category, selected, onClick }: MapPinProps) {
  const config = categoryConfig[category] ?? { color: "var(--cm-cat-other)", label: "Other" };
  const Icon = categoryIcons[category] ?? PinIcon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-white shadow-md cursor-pointer transition-all duration-200",
        selected
          ? "w-10 h-10 shadow-[0_10px_15px_rgba(0,0,0,0.2)] scale-110"
          : "w-8 h-8 hover:scale-125",
      )}
      style={{ backgroundColor: config.color }}
      title={config.label}
    >
      <Icon size={selected ? 20 : 16} color="white" strokeWidth={2.5} />
    </button>
  );
}
