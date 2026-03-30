import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  description,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("bg-gradient-sidebar backdrop-blur-md border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white/80 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {trend && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.isPositive ? "text-green-300" : "text-red-300"
              )}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-white/60">vs last month</span>
              </p>
            )}
            {description && (
              <p className="text-xs text-white/60">{description}</p>
            )}
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
