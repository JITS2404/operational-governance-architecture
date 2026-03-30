// src/pages/Locations.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, MapPin, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Location, DEFAULT_LOCATIONS } from '@/types/locations';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import useLocations, { LocationRow } from '@/hooks/useLocations';

// Supabase-backed service functions
import { createLocation, updateLocation, deleteLocation } from '@/services/ticketService';

export default function Locations() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use hook to fetch live rows from Supabase
  const { data: dbLocations, loading, error } = useLocations();
  const locationsFromDb = dbLocations ?? [];
  const locationsInitial = locationsFromDb.length
    ? locationsFromDb.map(mapDbToUiLocation)
    : DEFAULT_LOCATIONS;

  const [locations, setLocations] = useState<Location[]>(locationsInitial);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (dbLocations && dbLocations.length) {
      setLocations(dbLocations.map(mapDbToUiLocation));
    } else if (!loading && (!dbLocations || dbLocations.length === 0)) {
      setLocations(DEFAULT_LOCATIONS);
    }
  }, [dbLocations, loading]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', address: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [showFloors, setShowFloors] = useState<string | null>(null);
  const [floors, setFloors] = useState<{[key: string]: {[key: string]: string[]}}>({}); // locationId -> floorNumber -> rooms[]

  function mapDbToUiLocation(r: LocationRow): Location {
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      address: r.address ?? '',
      isActive: r.is_active ?? true,
      createdAt: r.created_at ?? new Date().toISOString(),
      updatedAt: r.updated_at ?? new Date().toISOString(),
    };
  }

  const canManageLocations = () => {
    return [UserRole.PLATFORM_ADMIN, UserRole.HEAD].includes(user?.role as UserRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingLocation) {
        // Update in DB
        const updated = await updateLocation(editingLocation.id, {
          name: formData.name,
          description: formData.description,
          address: formData.address,
        });

        // Map DB row to UI shape and update local state
        setLocations(prev => prev.map(loc => (loc.id === updated.id ? mapDbToUiLocation(updated as LocationRow) : loc)));

        toast({
          title: 'Location Updated',
          description: `${updated.name} has been updated successfully.`,
        });
      } else {
        // Create in DB
        const created = await createLocation({
          name: formData.name,
          description: formData.description,
          address: formData.address,
        });

        setLocations(prev => [mapDbToUiLocation(created as LocationRow), ...prev]);

        toast({
          title: 'Location Created',
          description: `${created.name} has been created successfully.`,
        });
      }

      setIsDialogOpen(false);
      setEditingLocation(null);
      setFormData({ name: '', description: '', address: '' });
    } catch (err: any) {
      console.error('Location save error', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to save location. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description,
      address: location.address || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await deleteLocation(locationId);
      setLocations(prev => prev.filter(loc => loc.id !== locationId));
      toast({
        title: 'Location Deleted',
        description: 'Location has been deleted successfully.',
      });
    } catch (err: any) {
      console.error('Delete location error', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to delete location. Please try again.',
      });
    }
  };

  const getLocationBackgroundImage = (locationName: string) => {
    // Handle exact filenames
    if (locationName.toLowerCase() === 'admin block') {
      return '/images/locations/admin- block.jpg';
    }
    if (locationName.toLowerCase() === 'admission block') {
      return '/images/locations/Admission-block.jpg';
    }
    if (locationName.toLowerCase() === 'aic raise') {
      return '/images/locations/AIC-Raise.jpg';
    }
    if (locationName.toLowerCase() === 'rips (rathinam international public school)') {
      return '/images/locations/rips international school.jpg';
    }
    if (locationName.toLowerCase() === 'rcas (rathinam college of arts and science)') {
      return '/images/locations/Rcas.jpg';
    }
    if (locationName.toLowerCase() === 'rtc (rathinam technical campus)') {
      return '/images/locations/Rathinam Technical Campus.jpg';
    }
    if (locationName.toLowerCase() === 'research hub') {
      return '/images/research hub.jpg';
    }
    if (locationName.toLowerCase() === 'food court') {
      return '/images/locations/Food Court.jpg';
    }
    if (locationName.toLowerCase() === 'kpm (k.palaniappa memorial educational trust)') {
      return '/images/locations/kpm.jpg';
    }
    const name = locationName.toLowerCase().replace(/\s+/g, '-');
    return `/images/locations/${name}.jpg`;
  };

  const toggleStatus = async (locationId: string) => {
    try {
      const target = locations.find(l => l.id === locationId);
      if (!target) return;

      const updated = await updateLocation(locationId, { is_active: !target.isActive });
      setLocations(prev => prev.map(l => (l.id === locationId ? mapDbToUiLocation(updated as LocationRow) : l)));

      toast({
        title: 'Location Status Updated',
        description: 'Location status has been updated successfully.',
      });
    } catch (err: any) {
      console.error('Toggle status error', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err?.message || 'Failed to update location status. Please try again.',
      });
    }
  };

  // Simple filter function - only show matching locations
  const getFilteredLocations = () => {
    if (!searchTerm.trim()) return locations;
    
    return locations.filter(location => 
      location.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      (location.address && location.address.toLowerCase().includes(searchTerm.toLowerCase().trim()))
    );
  };

  const filteredLocations = getFilteredLocations();

  if (!canManageLocations()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to manage locations. Only Platform Admins and Heads can access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Loading locations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Locations</h1>
          <p className="text-muted-foreground mt-2">Manage facility locations for ticket assignment</p>
        </div>
        <div className="flex gap-4 items-center">
          <Input
            id="location-search"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-primary hover:opacity-90"
              onClick={() => {
                setEditingLocation(null);
                setFormData({ name: '', description: '', address: '' });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
              <DialogDescription>
                {editingLocation ? 'Update the location information below.' : 'Create a new location for facility management.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Building A, Main Campus"
                  required
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this location"
                  rows={3}
                  className="glass"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Specific address or area details"
                  className="glass"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="bg-gradient-primary hover:opacity-90 flex-1" disabled={isSaving}>
                  {editingLocation ? 'Update Location' : 'Create Location'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="glass">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 p-4">
        {filteredLocations.sort((a, b) => a.name.localeCompare(b.name)).map(location => (
          <Card key={location.id} className="glass hover:shadow-glass transition-all duration-300 relative overflow-hidden" style={{transform: 'perspective(1000px)', transformStyle: 'preserve-3d'}} onMouseEnter={(e) => e.currentTarget.style.transform = 'perspective(1000px) rotateY(5deg) rotateX(5deg) scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)'}>
            <div 
              className="absolute inset-0 opacity-750 pointer-events-none"
            >
              <img 
                src={getLocationBackgroundImage(location.name)}
                alt=""
                className="w-full h-full object-cover brightness-125"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <CardHeader className="pb-3 relative z-10">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-purple-700" />
                  <CardTitle className="text-lg font-bold text-black" style={{textShadow: '2px 2px 4px rgba(255,255,255,0.9)'}}>{location.name}</CardTitle>
                </div>
                <Badge variant={location.isActive ? 'default' : 'secondary'} className={location.isActive ? 'bg-green-500 text-white font-bold' : 'bg-gray-500 text-white font-bold'}>
                  {location.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <CardDescription className="text-sm text-black hover:scale-105 transition-all duration-300 cursor-pointer" style={{textShadow: '2px 2px 4px rgba(255,255,255,0.9)'}}>{location.description || 'No description provided'}</CardDescription>

              {location.address && (
                <div className="text-sm text-black font-medium hover:scale-105 transition-all duration-300 cursor-pointer" style={{textShadow: '2px 2px 4px rgba(255,255,255,0.9)'}}>
                  <strong>Address:</strong> {location.address}
                </div>
              )}

              <div className="text-xs text-black" style={{textShadow: '1px 1px 2px rgba(255,255,255,0.8)'}}>
                <p><strong>Created:</strong> {new Date(location.createdAt).toLocaleDateString()}</p>
                <p><strong>Updated:</strong> {new Date(location.updatedAt).toLocaleDateString()}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setShowFloors(showFloors === location.id ? null : location.id)} className="glass flex-1">
                  Floors
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEdit(location)} className="glass">
                  <Edit className="mr-1 h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(location.id)} className="glass">
                  {location.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(location.id)} className="glass text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              
              {showFloors === location.id && (
                <div className="mt-4 bg-white/60 p-3 rounded">
                  <h4 className="font-bold text-black mb-2">Floors & Rooms</h4>
                  {[1, 2, 3, 4].map(floorNum => (
                    <div key={floorNum} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-black">Floor {floorNum}</span>
                        <Button size="sm" variant="outline" onClick={() => {
                          const roomNumber = prompt(`Add room number for Floor ${floorNum}:`);
                          if (roomNumber) {
                            setFloors(prev => ({
                              ...prev,
                              [location.id]: {
                                ...prev[location.id],
                                [floorNum]: [...(prev[location.id]?.[floorNum] || []), roomNumber]
                              }
                            }));
                          }
                        }} className="glass text-xs">
                          Add Room
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(floors[location.id]?.[floorNum] || []).map((room, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {room}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {searchTerm && filteredLocations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No locations found matching "{searchTerm}"</p>
        </div>
      )}

      {locations.length === 0 && (
        <Card className="glass">
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No locations found</h3>
            <p className="text-muted-foreground mb-4">Create your first location to start organizing facility management.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
