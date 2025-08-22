import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  DollarSign,
  CheckCircle,
  XCircle 
} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { ClassPackage } from '@shared/schema';

export default function MyPackages() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deletePackageId, setDeletePackageId] = useState<number | null>(null);

  // Get current user
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['/api/auth/me']
  });

  // Debug logging
  console.log('MyPackages - User data:', user);

  // Get coach's packages
  const { data: packages, isLoading } = useQuery({
    queryKey: [`/api/coaches/${user?.id}/packages`],
    enabled: !!user?.id && user?.role === 'coach' && user?.isApproved
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (packageId: number) => {
      return apiRequest(`/api/packages/${packageId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Package deleted successfully'
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/coaches/${user?.id}/packages`] 
      });
      setDeletePackageId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete package',
        variant: 'destructive'
      });
    }
  });

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const calculateDiscount = (original: number, discounted: number) => {
    const discount = ((original - discounted) / original) * 100;
    return discount.toFixed(0);
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
              Please log in to view packages.
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
              You must be a coach to view packages.
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
              Your coach account is pending approval.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        
        <Button onClick={() => navigate('/create-package')}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Package
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          My Class Packages
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your class bundles and special offers
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : packages?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first class package to offer discounted bundles to students
            </p>
            <Button onClick={() => navigate('/create-package')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Package
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages?.map((pkg: ClassPackage) => (
            <Card key={pkg.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{pkg.packageName}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {pkg.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={pkg.isActive ? "default" : "secondary"}
                    className="ml-2"
                  >
                    {pkg.isActive ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Class Count */}
                  <div className="flex items-center text-sm">
                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-medium">{pkg.classCount} Classes</span>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <div>
                      <span className="line-through text-muted-foreground">
                        {formatPrice(pkg.originalPriceCents * pkg.classCount)}
                      </span>
                      <span className="font-bold text-green-600 ml-2">
                        {formatPrice(pkg.discountedPriceCents * pkg.classCount)}
                      </span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {calculateDiscount(pkg.originalPriceCents, pkg.discountedPriceCents)}% OFF
                      </Badge>
                    </div>
                  </div>

                  {/* Per Class Price */}
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(pkg.discountedPriceCents)} per class 
                    <span className="line-through ml-1">
                      {formatPrice(pkg.originalPriceCents)}
                    </span>
                  </div>

                  {/* Validity */}
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Valid for {pkg.validityDays} days</span>
                  </div>

                  {/* Max Students */}
                  {pkg.maxStudents && (
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Max {pkg.maxStudents} students per class</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/edit-package/${pkg.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setDeletePackageId(pkg.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={deletePackageId !== null} 
        onOpenChange={(open) => !open && setDeletePackageId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the package.
              Any students who have already purchased this package will still be able to use their remaining classes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePackageId && deletePackageMutation.mutate(deletePackageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}