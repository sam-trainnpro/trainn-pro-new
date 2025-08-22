import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Package, Calendar, DollarSign, Users } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import type { ClassPackage } from '@shared/schema';

export default function CreatePackage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    packageName: '',
    description: '',
    classCount: '5' as '5' | '10' | '20',
    originalPriceCents: 0,
    discountedPriceCents: 0,
    validityDays: 120, // Default to ~4 months (semester)
    maxStudents: 15,
    isActive: true,
    terms: ''
  });

  // Get current user to ensure they're a coach
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });

  // Debug logging
  console.log('CreatePackage - User data:', user);
  console.log('CreatePackage - User loading:', userLoading);

  const createPackageMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest('/api/packages', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Package created successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches'] });
      navigate('/my-packages');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create package',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert prices to cents
    const dataToSubmit = {
      ...formData,
      originalPriceCents: Math.round(parseFloat(formData.originalPriceCents.toString()) * 100),
      discountedPriceCents: Math.round(parseFloat(formData.discountedPriceCents.toString()) * 100),
      classCount: parseInt(formData.classCount)
    };
    
    createPackageMutation.mutate(dataToSubmit);
  };

  const calculateDiscount = () => {
    if (formData.originalPriceCents && formData.discountedPriceCents) {
      const original = parseFloat(formData.originalPriceCents.toString());
      const discounted = parseFloat(formData.discountedPriceCents.toString());
      const discount = ((original - discounted) / original) * 100;
      return discount.toFixed(1);
    }
    return '0';
  };

  // Show loading state while user data is being fetched
  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Loading...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to create packages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is a coach
  if (user.role !== 'coach') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You must be a coach to create packages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if coach is approved
  if (!user.isApproved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Your coach account is pending approval. Please wait for admin approval to create packages.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            Create Class Package
          </CardTitle>
          <CardDescription>
            Create a discounted bundle of classes to attract committed students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Package Name */}
            <div className="space-y-2">
              <Label htmlFor="packageName">Package Name *</Label>
              <Input
                id="packageName"
                placeholder="e.g., Summer Soccer Bundle, 10-Class Yoga Pass"
                value={formData.packageName}
                onChange={(e) => setFormData({ ...formData, packageName: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe what's included in this package and any special benefits..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Class Count */}
            <div className="space-y-2">
              <Label htmlFor="classCount">Number of Classes *</Label>
              <Select
                value={formData.classCount}
                onValueChange={(value: '5' | '10' | '20') => 
                  setFormData({ ...formData, classCount: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Classes</SelectItem>
                  <SelectItem value="10">10 Classes</SelectItem>
                  <SelectItem value="20">20 Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (per class) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="originalPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    value={formData.originalPriceCents || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      originalPriceCents: parseFloat(e.target.value) || 0 
                    })}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: ${((formData.originalPriceCents || 0) * parseInt(formData.classCount)).toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountedPrice">Discounted Price (per class) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="pl-9"
                    value={formData.discountedPriceCents || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      discountedPriceCents: parseFloat(e.target.value) || 0 
                    })}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: ${((formData.discountedPriceCents || 0) * parseInt(formData.classCount)).toFixed(2)}
                  {formData.originalPriceCents > formData.discountedPriceCents && (
                    <span className="text-green-600 font-medium ml-2">
                      ({calculateDiscount()}% off)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-2">
              <Label htmlFor="validityDays">Package Validity</Label>
              <Select
                value={formData.validityDays.toString()}
                onValueChange={(value) => 
                  setFormData({ ...formData, validityDays: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">3 Months (Quarter)</SelectItem>
                  <SelectItem value="120">4 Months (Semester)</SelectItem>
                  <SelectItem value="180">6 Months</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Students must use all classes within this time period
              </p>
            </div>

            {/* Max Students */}
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maximum Students per Class</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="maxStudents"
                  type="number"
                  min="1"
                  placeholder="15"
                  className="pl-9"
                  value={formData.maxStudents}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxStudents: parseInt(e.target.value) || 1 
                  })}
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2">
              <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
              <Textarea
                id="terms"
                placeholder="Add any specific terms, refund policy, or usage restrictions..."
                value={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, isActive: checked })
                }
              />
              <Label htmlFor="isActive">Package is active and available for purchase</Label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPackageMutation.isPending}
              >
                {createPackageMutation.isPending ? 'Creating...' : 'Create Package'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}