// src/pages/SubmitTicket.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCategories from '@/hooks/useCategories';
import useLocations from '@/hooks/useLocations';
import useUsers from '@/hooks/useUsers';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createTicket } from '@/services/ticketService';
import { UserRole } from '@/types/auth';
import { TicketStatus } from '@/types/workflow';

export default function SubmitTicket() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // fetch lists from DB
  const { data: dbCategories = [], loading: catLoading } = useCategories();
  const { data: dbLocations = [], loading: locLoading } = useLocations();
  const { data: dbUsers = [], loading: usersLoading } = useUsers();
  
  // Check if current user is admin
  const isAdmin = [UserRole.PLATFORM_ADMIN, UserRole.HEAD, UserRole.MAINTENANCE_MANAGER].includes(user?.role as UserRole);

  // Debug: log the actual data structure
  React.useEffect(() => {
    console.log('Categories loading:', catLoading, 'data length:', dbCategories.length);
    console.log('Locations loading:', locLoading, 'data length:', dbLocations.length);
    
    if (dbCategories.length > 0) {
      console.log('Categories data:', dbCategories.slice(0, 2));
    }
    if (dbLocations.length > 0) {
      console.log('Locations data:', dbLocations.slice(0, 2));
    }
  }, [dbCategories, dbLocations, catLoading, locLoading]);

  // form state (store IDs for category & location)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    category_id: '', // uuid expected by DB
    location_id: '',  // uuid expected by DB
    reporter_id: '',   // for admin to select reporter
    floor_no: '',
    room_no: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `${file.name} exceeds 10MB limit.`,
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // quick client-side validation
    if (!user?.id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to create a ticket.',
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation',
        description: 'Please provide both title and description.',
      });
      return;
    }

    if (!formData.category_id || !formData.location_id) {
      toast({
        variant: 'destructive',
        title: 'Validation',
        description: 'Please select both a category and a location.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const ticketData = {
        title: formData.title.trim(),
        description: `${formData.description.trim()} [Floor: ${formData.floor_no}, Room: ${formData.room_no}]`,
        priority: formData.priority || 'MEDIUM',
        category_id: formData.category_id,
        location_id: formData.location_id,
        status: TicketStatus.NEW, // Start with NEW status
      };

      console.log('Submitting ticket with payload:', ticketData);

      // Use selected reporter_id if admin, otherwise use current user
      const reporterId = isAdmin && formData.reporter_id ? formData.reporter_id : user.id;
      const newTicket = await createTicket(ticketData, reporterId);

      // Upload files if any
      if (selectedFiles.length > 0) {
        try {
          const { uploadTicketAttachment } = await import('@/services/ticketService');
          await Promise.all(
            selectedFiles.map(file => uploadTicketAttachment(newTicket.id, file))
          );
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            variant: 'destructive',
            title: 'File Upload Warning',
            description: 'Ticket created but some files failed to upload.',
          });
        }
      }

      // Get category and location names for notification
      const categoryName = dbCategories.find(c => c.id === ticketData.category_id)?.name || 'Unknown';
      const locationName = dbLocations.find(l => l.id === ticketData.location_id)?.name || 'Unknown';
      
      // Notify all admins about new ticket
      const adminNotification = {
        id: `ticket-created-${newTicket.id}-${Date.now()}`,
        title: 'New Ticket Created',
        message: `${user.firstName} ${user.lastName} created ticket "${newTicket.title}" (${categoryName} - ${locationName})`,
        ticketId: newTicket.id,
        userId: 'ADMIN_ROLES',
        createdAt: new Date().toISOString(),
        type: 'ticket_created',
        priority: ticketData.priority
      };
      
      // Store notifications for admins
      const existingNotifications = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      localStorage.setItem('adminNotifications', JSON.stringify([adminNotification, ...existingNotifications.slice(0, 49)]));
      
      const regularNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      localStorage.setItem('notifications', JSON.stringify([adminNotification, ...regularNotifications.slice(0, 49)]));

      toast({
        title: 'Ticket Created',
        description: `Ticket "${newTicket.title}" created successfully and admins have been notified.`,
      });

      // reset and navigate to My Tickets
      setFormData({ title: '', description: '', priority: '', category_id: '', location_id: '', reporter_id: '', floor_no: '', room_no: '' });
      setSelectedFiles([]);
      
      // Navigate without reload
      navigate('/tickets');
    } catch (err: any) {
      console.error('createTicket error (full):', err);
      const message = err?.message || err?.msg || 'Failed to create ticket';
      const details = err?.details ? ` Details: ${err.details}` : '';
      const hint = err?.hint ? ` Hint: ${err.hint}` : '';

      toast({
        variant: 'destructive',
        title: 'Ticket creation failed',
        description: message + details + hint,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold text-foreground">Submit a Ticket</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Enter a short title"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the issue in detail"
            required
            rows={4}
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full p-2 rounded glass"
          >
            <option value="">Select priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Category select (passes UUID) */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
            className="w-full p-2 rounded glass"
            required
          >
            <option value="">Select category</option>
            {catLoading ? (
              <option>Loading...</option>
            ) : dbCategories.length === 0 ? (
              <option>No categories available</option>
            ) : (
              dbCategories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            )}
          </select>
          {dbCategories.length === 0 && !catLoading && (
            <p className="text-xs text-red-500">Unable to load categories. Please check if the backend server is running.</p>
          )}
        </div>

        {/* Location select (passes UUID) */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <select
            id="location"
            value={formData.location_id}
            onChange={(e) => setFormData(prev => ({ ...prev, location_id: e.target.value }))}
            className="w-full p-2 rounded glass"
            required
          >
            <option value="">Select location</option>
            {locLoading ? (
              <option>Loading...</option>
            ) : dbLocations.length === 0 ? (
              <option>No locations available</option>
            ) : (
              dbLocations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))
            )}
          </select>
          {dbLocations.length === 0 && !locLoading && (
            <p className="text-xs text-red-500">Unable to load locations. Please check if the backend server is running.</p>
          )}
        </div>

        {/* Floor Number */}
        <div className="space-y-2">
          <Label htmlFor="floor">Floor Number</Label>
          <select
            id="floor"
            value={formData.floor_no}
            onChange={(e) => setFormData(prev => ({ ...prev, floor_no: e.target.value }))}
            className="w-full p-2 rounded glass"
            required
          >
            <option value="">Select floor</option>
            <option value="Ground">Ground Floor</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
            <option value="4">Floor 4</option>
            <option value="5">Floor 5</option>
            <option value="6">Floor 6</option>
          </select>
        </div>

        {/* Room Number */}
        <div className="space-y-2">
          <Label htmlFor="room">Room Number</Label>
          <Input
            id="room"
            value={formData.room_no}
            onChange={(e) => setFormData(prev => ({ ...prev, room_no: e.target.value }))}
            placeholder="Enter room number (e.g., 101, A-205)"
            required
            className="glass"
          />
        </div>

        {/* Reporter select (only for admins) */}
        {isAdmin && (
          <div className="space-y-2">
            <Label htmlFor="reporter">Reporter (Optional - Leave empty to create as yourself)</Label>
            <select
              id="reporter"
              value={formData.reporter_id}
              onChange={(e) => setFormData(prev => ({ ...prev, reporter_id: e.target.value }))}
              className="w-full p-2 rounded glass"
            >
              <option value="">Create as myself</option>
              {usersLoading ? (
                <option>Loading users...</option>
              ) : (
                dbUsers
                  .filter(u => u.role === 'REPORTER' || u.role === 'TENANT')
                  .map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              Select a reporter to create this ticket on their behalf. If left empty, the ticket will be created under your account.
            </p>
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="files">Attachments (Max 10MB per file)</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <input
              type="file"
              id="files"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="files"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload files</span>
            </label>
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          className="bg-gradient-primary hover:opacity-90 w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </form>
    </div>
  );
}
