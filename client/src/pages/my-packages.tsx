import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "../../../hooks/use-toast";
import { useState } from "react";
import { Plus, Edit, Trash2, Calendar, Package, CheckCircle, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { useLocation } from "wouter";

interface ClassPackage {
  id: number;
  coachId: number;
  title: string;
  packageType: 'set_pack' | 'time_bound';
  classCount1: number | null;
  classCount2: number | null;
  classCount3: number | null;
  price1: number | null;
  price2: number | null;
  price3: number | null;
  eligibleClasses: string | null;
  description: string | null;
  categoryId: number | null;
  ageGroup: string;
  isActive: boolean;
  status: string;
  creationDate: string;
  futureClassCount: number | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
}

export default function MyPackages() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [deletePackageId, setDeletePackageId] = useState<number | null>(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/user']
  });

  // Fetch coach's packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['/api/packages/my'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/packages/my');
      return response.json();
    },
    enabled: !!user && user.id && user.role === 'coach'
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    }
  });

  // Update package status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ packageId, isActive }: { packageId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/packages/${packageId}/status`, {
        isActive
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages/my'] });
      toast({
        title: "Success",
        description: "Package status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update package status",
        variant: "destructive",
      });
    }
  });

  // Check if package has bookings
  const checkPackageBookings = async (packageId: number) => {
    try {
      const response = await apiRequest('GET', `/api/packages/${packageId}/bookings/check`);
      const data = await response.json();
      return data.hasBookings;
    } catch (error) {
      console.error('Error checking package bookings:', error);
      return false;
    }
  };

  // Delete package mutation
  const deleteMutation = useMutation({
    mutationFn: async (packageId: number) => {
      // First check if package has bookings
      const hasBookings = await checkPackageBookings(packageId);
      if (hasBookings) {
        throw new Error("Cannot delete package with existing bookings. You can deactivate it instead.");
      }
      
      const response = await apiRequest('DELETE', `/api/packages/${packageId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/packages/my'] });
      setDeletePackageId(null);
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete package",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return `$${Math.floor(price)}`;
  };

  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return 'No Category';
    const category = categories.find((cat: Category) => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const renderPackageDetails = (pkg: ClassPackage) => {
    if (pkg.packageType === 'set_pack') {
      const options = [];
      if (pkg.classCount1 && pkg.price1) {
        options.push(`${pkg.classCount1} classes: ${formatPrice(pkg.price1)}`);
      }
      if (pkg.classCount2 && pkg.price2) {
        options.push(`${pkg.classCount2} classes: ${formatPrice(pkg.price2)}`);
      }
      if (pkg.classCount3 && pkg.price3) {
        options.push(`${pkg.classCount3} classes: ${formatPrice(pkg.price3)}`);
      }
      return options.join(' | ');
    } else {
      return 'Time-bound package';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Packages</h1>
            <p className="text-gray-600 mt-2">Manage your class packages and bundles</p>
          </div>
          <Button onClick={() => navigate('/create-package')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Package
          </Button>
        </div>

        {/* Status Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>Inactive</span>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid gap-4">
          {packages.length === 0 ? (
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
            // Sort packages: active first, then inactive
            [...packages].sort((a, b) => {
              if (a.isActive === b.isActive) return 0;
              return a.isActive ? -1 : 1;
            }).map((pkg: ClassPackage) => (
              <Card key={pkg.id}>
                <CardHeader className="pb-3">
                  {/* Mobile Layout: Full width title and description */}
                  <div className="md:hidden">
                    <CardTitle className="text-lg mb-3">
                      <span className="break-words">{pkg.title}</span>
                    </CardTitle>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Status:</span>
                        <Switch
                          checked={pkg.isActive}
                          onCheckedChange={(checked) => 
                            updateStatusMutation.mutate({ packageId: pkg.id, isActive: checked })
                          }
                          disabled={updateStatusMutation.isPending}
                        />
                        <Badge variant={pkg.isActive ? "default" : "secondary"} className={pkg.isActive ? "bg-green-600" : "bg-red-600 text-white"}>
                          {pkg.isActive ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                          ) : (
                            <><XCircle className="w-3 h-3 mr-1" />Inactive</>
                          )}
                        </Badge>
                      </div>
                    </div>
                    {pkg.description && (
                      <p className="text-gray-600 break-words leading-relaxed">{pkg.description}</p>
                    )}
                  </div>

                  {/* Desktop Layout: Side by side with buttons */}
                  <div className="hidden md:flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg mb-2">
                        {pkg.title}
                      </CardTitle>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Status:</span>
                          <Switch
                            checked={pkg.isActive}
                            onCheckedChange={(checked) => 
                              updateStatusMutation.mutate({ packageId: pkg.id, isActive: checked })
                            }
                            disabled={updateStatusMutation.isPending}
                          />
                          <Badge variant={pkg.isActive ? "default" : "secondary"} className={pkg.isActive ? "bg-green-600" : "bg-red-600 text-white"}>
                            {pkg.isActive ? (
                              <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" />Inactive</>
                            )}
                          </Badge>
                        </div>
                      </div>
                      {pkg.description && (
                        <p className="text-gray-600 mt-1">{pkg.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/edit-package/${pkg.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletePackageId(pkg.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Date Posted:</strong>
                      <br />
                      {formatDate(pkg.creationDate || pkg.createdAt)}
                    </div>
                    <div>
                      <strong>Category:</strong>
                      <br />
                      {getCategoryName(pkg.categoryId)}
                    </div>
                    <div>
                      <strong>Age Group:</strong>
                      <br />
                      {pkg.ageGroup || 'Adults'}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <strong>Package Type:</strong>
                      <br />
                      <span className="text-gray-600">
                        {pkg.packageType === 'set_pack' ? 'Set Pack' : 'Time-bound'} - {renderPackageDetails(pkg)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Buttons - Only show on mobile */}
                  <div className="md:hidden mt-4 pt-4 border-t flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/edit-package/${pkg.id}`)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletePackageId(pkg.id)}
                      disabled={deleteMutation.isPending}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletePackageId} onOpenChange={() => setDeletePackageId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Package</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this package? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletePackageId) {
                    deleteMutation.mutate(deletePackageId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>

      <Footer />
      <MobileNavigation />
    </div>
  );
}