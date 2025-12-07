import { cn } from "@/lib/utils";

export default function Marquee({ 
  items, 
  direction = "left", 
  speed = "normal",
  className 
}: { 
  items: string[], 
  direction?: "left" | "right", 
  speed?: "slow" | "normal" | "fast",
  className?: string
}) {
  const animationClass = direction === "left" ? "animate-marquee" : "animate-marquee-reverse";
  const willChangeStyle = { willChange: "transform" };
  const durationClass = speed === "slow" ? "duration-[40s]" : speed === "fast" ? "duration-[15s]" : "duration-[25s]";

  return (
    <div className={cn("relative flex overflow-hidden py-4 bg-card/40 border-y border-border backdrop-blur-sm", className)}>
      <div style={willChangeStyle} className={cn("flex min-w-full shrink-0 gap-12 items-center justify-around whitespace-nowrap px-12", animationClass, durationClass)}>
        {items.map((item, i) => (
          <span key={i} className="text-lg font-bold text-muted-foreground uppercase tracking-widest">{item}</span>
        ))}
      </div>
      <div style={willChangeStyle} className={cn("absolute top-0 flex min-w-full shrink-0 gap-12 items-center justify-around whitespace-nowrap px-12", animationClass, durationClass)}>
        {items.map((item, i) => (
          <span key={`duplicate-${i}`} className="text-lg font-bold text-muted-foreground uppercase tracking-widest">{item}</span>
        ))}
      </div>
      
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10"></div>
    </div>
  );
}
