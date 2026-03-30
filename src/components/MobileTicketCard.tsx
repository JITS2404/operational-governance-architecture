import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileTicketCardProps {
  ticket: any;
  onAction?: (action: string) => void;
}

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
};

const statusColors = {
  NEW: 'bg-gray-100 text-gray-800',
  ASSIGNED_TO_TECHNICIAN: 'bg-blue-100 text-blue-800',
  WORK_IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  WORK_COMPLETED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600'
};

export function MobileTicketCard({ ticket, onAction }: MobileTicketCardProps) {
  const navigate = useNavigate();

  const getStatusDisplay = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Card 
      className="mb-3 cursor-pointer hover:shadow-md transition-shadow active:scale-98"
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-mono">
                {ticket.ticket_number}
              </Badge>
              <Badge className={cn('text-xs', priorityColors[ticket.priority as keyof typeof priorityColors])}>
                {ticket.priority}
              </Badge>
            </div>
            <h3 className="font-semibold text-base line-clamp-2 leading-tight">
              {ticket.title}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Status */}
        <div className="flex items-center justify-between">
          <Badge className={cn('text-xs', statusColors[ticket.status as keyof typeof statusColors] || 'bg-gray-100')}>
            {getStatusDisplay(ticket.status)}
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getTimeAgo(ticket.created_at)}
          </span>
        </div>

        {/* Location & Category */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {ticket.location_name && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{ticket.location_name}</span>
            </div>
          )}
          {ticket.category_name && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="truncate">{ticket.category_name}</span>
            </div>
          )}
        </div>

        {/* Technician */}
        {ticket.technician_name && (
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="font-medium">{ticket.technician_name}</span>
          </div>
        )}

        {/* Quick Actions */}
        {onAction && (
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onAction('view');
              }}
            >
              View Details
            </Button>
            {ticket.status === 'INVOICE_SENT' && (
              <Button 
                size="sm" 
                className="flex-1 h-8 text-xs bg-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction('start');
                }}
              >
                Start Work
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
