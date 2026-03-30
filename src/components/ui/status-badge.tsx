import { cn } from "@/lib/utils";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  PlayCircle, 
  PauseCircle,
  FileText,
  Send,
  DollarSign,
  LucideIcon
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

const statusConfig: Record<string, { 
  label: string; 
  color: string; 
  icon: LucideIcon;
  bgColor: string;
}> = {
  OPEN: { 
    label: "Open", 
    color: "text-blue-700", 
    bgColor: "bg-blue-50 border-blue-200",
    icon: Clock 
  },
  ASSIGNED: { 
    label: "Assigned", 
    color: "text-purple-700", 
    bgColor: "bg-purple-50 border-purple-200",
    icon: PlayCircle 
  },
  WORK_STARTED: { 
    label: "Work Started", 
    color: "text-orange-700", 
    bgColor: "bg-orange-50 border-orange-200",
    icon: PlayCircle 
  },
  WORK_IN_PROGRESS: { 
    label: "In Progress", 
    color: "text-amber-700", 
    bgColor: "bg-amber-50 border-amber-200",
    icon: PauseCircle 
  },
  WORK_COMPLETED: { 
    label: "Work Done", 
    color: "text-green-700", 
    bgColor: "bg-green-50 border-green-200",
    icon: CheckCircle2 
  },
  COMPLETION_REPORT_UPLOADED: { 
    label: "Report Uploaded", 
    color: "text-teal-700", 
    bgColor: "bg-teal-50 border-teal-200",
    icon: FileText 
  },
  QUOTATION_SENT: { 
    label: "Quotation Sent", 
    color: "text-indigo-700", 
    bgColor: "bg-indigo-50 border-indigo-200",
    icon: Send 
  },
  INVOICE_SENT: { 
    label: "Invoice Sent", 
    color: "text-cyan-700", 
    bgColor: "bg-cyan-50 border-cyan-200",
    icon: DollarSign 
  },
  CLOSED: { 
    label: "Closed", 
    color: "text-gray-700", 
    bgColor: "bg-gray-50 border-gray-200",
    icon: CheckCircle2 
  },
  CANCELLED: { 
    label: "Cancelled", 
    color: "text-red-700", 
    bgColor: "bg-red-50 border-red-200",
    icon: XCircle 
  },
};

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status, 
    color: "text-gray-700", 
    bgColor: "bg-gray-50 border-gray-200",
    icon: AlertCircle 
  };
  
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
        config.color,
        config.bgColor,
        className
      )}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: string;
  className?: string;
}

const priorityConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string;
}> = {
  URGENT: { 
    label: "Urgent", 
    color: "text-red-700", 
    bgColor: "bg-red-50 border-red-300" 
  },
  HIGH: { 
    label: "High", 
    color: "text-orange-700", 
    bgColor: "bg-orange-50 border-orange-300" 
  },
  MEDIUM: { 
    label: "Medium", 
    color: "text-yellow-700", 
    bgColor: "bg-yellow-50 border-yellow-300" 
  },
  LOW: { 
    label: "Low", 
    color: "text-green-700", 
    bgColor: "bg-green-50 border-green-300" 
  },
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority] || { 
    label: priority, 
    color: "text-gray-700", 
    bgColor: "bg-gray-50 border-gray-300" 
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        config.color,
        config.bgColor,
        className
      )}
    >
      {config.label}
    </span>
  );
}
