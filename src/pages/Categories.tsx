// src/pages/Categories.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Trash2, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Category, DEFAULT_CATEGORIES } from '@/types/categories';
import { UserRole } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import useCategories, { CategoryRow } from '@/hooks/useCategories';

// ✅ import Supabase service functions
import { createCategory, updateCategory, deleteCategory } from '@/services/ticketService';

export default function Categories() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Use hook: returns rows from Supabase or fallback empty array
  const { data: dbCategories, loading } = useCategories();
  const categoriesFromDb = dbCategories ?? [];
  const categoriesInitial = categoriesFromDb.length
    ? categoriesFromDb.map(mapDbToUiCategory)
    : DEFAULT_CATEGORIES;

  const [categories, setCategories] = useState<Category[]>(categoriesInitial);
  const [searchTerm, setSearchTerm] = useState('');

  React.useEffect(() => {
    if (dbCategories && dbCategories.length) {
      setCategories(dbCategories.map(mapDbToUiCategory));
    } else if (!loading && (!dbCategories || dbCategories.length === 0)) {
      setCategories(DEFAULT_CATEGORIES);
    }
  }, [dbCategories, loading]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });

  function mapDbToUiCategory(r: CategoryRow): Category {
    return {
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      isActive: r.is_active ?? true,
      createdAt: r.created_at ?? new Date().toISOString(),
      updatedAt: r.updated_at ?? new Date().toISOString(),
    };
  }

  const canManageCategories = () => {
    return [UserRole.PLATFORM_ADMIN, UserRole.HEAD].includes(user?.role as UserRole);
  };

  // ✅ updated to persist in Supabase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const updated = await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description,
        });

        setCategories(prev =>
          prev.map(cat => (cat.id === updated.id ? mapDbToUiCategory(updated as any) : cat))
        );

        toast({ title: 'Category Updated', description: `${updated.name} updated.` });
      } else {
        const created = await createCategory({
          name: formData.name,
          description: formData.description,
        });

        setCategories(prev => [mapDbToUiCategory(created as any), ...prev]);

        toast({ title: 'Category Created', description: `${created.name} created.` });
      }

      setIsDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description });
    setIsDialogOpen(true);
  };

  // ✅ updated to delete in Supabase
  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(categoryId);
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast({ title: 'Category Deleted', description: 'Category has been deleted successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  // ⚠️ toggleStatus still needs a backend column update (is_active)
  const toggleStatus = async (categoryId: string) => {
    try {
      const target = categories.find(c => c.id === categoryId);
      if (!target) return;

      const updated = await updateCategory(categoryId, {
        is_active: !target.isActive,
      });

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? mapDbToUiCategory(updated as any) : cat
        )
      );

      toast({ title: 'Category Status Updated', description: 'Status updated successfully.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  if (!canManageCategories()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="glass max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
            <p className="text-muted-foreground">
              You don't have permission to manage categories. Only Platform Admins and Heads can access this page.
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
          <span>Loading categories...</span>
        </div>
      </div>
    );
  }

  // Simple filter function - only show matching categories
  const getFilteredCategories = () => {
    console.log('Search term:', searchTerm);
    console.log('Categories:', categories.map(c => c.name));
    
    if (!searchTerm.trim()) return categories;
    
    const filtered = categories.filter(category => {
      const match = category.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
      console.log(`${category.name} matches "${searchTerm}":`, match);
      return match;
    });
    
    console.log('Filtered results:', filtered.map(c => c.name));
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground mt-2">
            Manage maintenance categories for ticket classification
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <Input
            id="category-search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              console.log('Category search input changed to:', value);
              setSearchTerm(value);
            }}
            className="w-64"
          />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-primary hover:opacity-90"
                onClick={() => {
                  setEditingCategory(null);
                  setFormData({ name: '', description: '' });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory
                    ? 'Update the category information below.'
                    : 'Create a new category for maintenance tickets.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Carpentry, Civil, Mechanical"
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
                    placeholder="Brief description of this category"
                    rows={3}
                    className="glass"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="bg-gradient-primary hover:opacity-90 flex-1">
                    {editingCategory ? 'Update Category' : 'Create Category'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="glass"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>



      {/* Categories Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map(category => (
          <Card key={category.id} className="glass hover:shadow-glass transition-shadow duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </div>
                <Badge
                  variant={category.isActive ? 'default' : 'secondary'}
                  className={category.isActive ? 'bg-success/10 text-success border-success/20' : ''}
                >
                  {category.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-sm">
                {category.description || 'No description provided'}
              </CardDescription>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(category)} className="glass flex-1">
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(category.id)} className="glass">
                  {category.isActive ? 'Disable' : 'Enable'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(category.id)}
                  className="glass text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {searchTerm && filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No categories found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}