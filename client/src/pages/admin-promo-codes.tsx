import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "../../../hooks/use-toast";
import { useState } from "react";
import { CheckCircle, XCircle, Plus, BarChart3, Eye, Trash2, Clock, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";

interface PromoCode {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  coachId: number | null;
  isActive: boolean;
  requiresApproval: boolean;
  isApproved: boolean;
  approvedBy: number | null;
  approvedAt: string | null;
  firstBookingOnly: boolean;
  minimumQuantity: number;
  usageLimit: number | null;
  usageCount: number;
  validFrom: string;
  validUntil: string;
  platformSubsidized: boolean;
  commissionOverride: number | null;
  budgetLimit: number | null;
  budgetUsed: number;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPromoCodes() {
  const { toast } = useToast();
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAnalyticsDialog, setShowAnalyticsDialog] = useState(false);
  const [selectedPromoCode, setSelectedPromoCode] = useState<PromoCode | null>(null);
  const [editingPromoCode, setEditingPromoCode] = useState<PromoCode | null>(null);

  // Fetch promo codes with filters
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['/api/promo-codes', selectedFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFilter === 'pending') {
        params.append('requiresApproval', 'true');
        params.append('isApproved', 'false');
      } else if (selectedFilter === 'approved') {
        params.append('isApproved', 'true');
      } else if (selectedFilter === 'active') {
        params.append('isActive', 'true');
      } else if (selectedFilter === 'inactive') {
        params.append('isActive', 'false');
      }
      
      const url = `/api/promo-codes${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiRequest('GET', url);
      return response.json();
    }
  });

  // Fetch analytics for selected promo code
  const { data: analytics } = useQuery({
    queryKey: ['/api/promo-codes', selectedPromoCode?.id, 'analytics'],
    queryFn: async () => {
      if (!selectedPromoCode) return null;
      const response = await apiRequest('GET', `/api/promo-codes/${selectedPromoCode.id}/analytics`);
      return response.json();
    },
    enabled: !!selectedPromoCode
  });

  // Approve promo code mutation
  const approveMutation = useMutation({
    mutationFn: async (promoCodeId: number) => {
      const response = await apiRequest('POST', `/api/promo-codes/${promoCodeId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({
        title: "Success",
        description: "Promo code approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve promo code",
        variant: "destructive",
      });
    }
  });

  // Reject promo code mutation
  const rejectMutation = useMutation({
    mutationFn: async (promoCodeId: number) => {
      const response = await apiRequest('POST', `/api/promo-codes/${promoCodeId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({
        title: "Success",
        description: "Promo code rejected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject promo code",
        variant: "destructive",
      });
    }
  });

  // Delete promo code mutation
  const deleteMutation = useMutation({
    mutationFn: async (promoCodeId: number) => {
      const response = await apiRequest('DELETE', `/api/promo-codes/${promoCodeId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      toast({
        title: "Success",
        description: "Promo code deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete promo code",
        variant: "destructive",
      });
    }
  });

  // Create promo code mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/promo-codes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Promo code created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive",
      });
    }
  });

  // Update promo code mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/promo-codes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes'] });
      setShowEditDialog(false);
      setEditingPromoCode(null);
      toast({
        title: "Success",
        description: "Promo code updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update promo code",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreatePromoCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      code: formData.get('code'),
      name: formData.get('name'),
      description: formData.get('description'),
      discountType: formData.get('discountType'),
      discountValue: parseInt(formData.get('discountValue') as string),
      firstBookingOnly: formData.get('firstBookingOnly') === 'on',
      usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit') as string) : null,
      validFrom: formData.get('validFrom'),
      validUntil: formData.get('validUntil'),
      platformSubsidized: formData.get('platformSubsidized') === 'on',
      commissionOverride: formData.get('commissionOverride') ? parseInt(formData.get('commissionOverride') as string) : null,
      budgetLimit: formData.get('budgetLimit') ? parseInt(formData.get('budgetLimit') as string) * 100 : null, // Convert to cents
    };

    createMutation.mutate(data);
  };

  const handleUpdatePromoCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPromoCode) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      discountType: formData.get('discountType'),
      discountValue: parseInt(formData.get('discountValue') as string),
      firstBookingOnly: formData.get('firstBookingOnly') === 'on',
      usageLimit: formData.get('usageLimit') ? parseInt(formData.get('usageLimit') as string) : null,
      validFrom: formData.get('validFrom'),
      validUntil: formData.get('validUntil'),
      platformSubsidized: formData.get('platformSubsidized') === 'on',
      commissionOverride: formData.get('commissionOverride') ? parseInt(formData.get('commissionOverride') as string) : null,
      budgetLimit: formData.get('budgetLimit') ? parseInt(formData.get('budgetLimit') as string) * 100 : null, // Convert to cents
      isActive: formData.get('isActive') === 'on',
    };

    updateMutation.mutate({ id: editingPromoCode.id, data });
  };

  const openEditDialog = (promoCode: PromoCode) => {
    setEditingPromoCode(promoCode);
    setShowEditDialog(true);
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
          <h1 className="text-3xl font-bold">Promo Code Management</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
              <DialogDescription>
                Create a new promotional code for customers or coaches.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Promo Code</Label>
                  <Input
                    id="code"
                    name="code"
                    placeholder="SAVE20"
                    required
                    className="uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="20% Off First Class"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Optional description for internal use"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select name="discountType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    placeholder="20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    name="validFrom"
                    type="datetime-local"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    name="validUntil"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                  <Input
                    id="usageLimit"
                    name="usageLimit"
                    type="number"
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="minimumQuantity">Minimum Tickets Required</Label>
                  <Input
                    id="minimumQuantity"
                    name="minimumQuantity"
                    type="number"
                    placeholder="1"
                    min="1"
                    defaultValue="1"
                  />
                </div>
                <div>
                  <Label htmlFor="commissionOverride">Commission Override %</Label>
                  <Input
                    id="commissionOverride"
                    name="commissionOverride"
                    type="number"
                    placeholder="5"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="budgetLimit">Platform Budget Limit (USD)</Label>
                <Input
                  id="budgetLimit"
                  name="budgetLimit"
                  type="number"
                  placeholder="1000"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="firstBookingOnly" name="firstBookingOnly" />
                  <Label htmlFor="firstBookingOnly">First Booking Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="platformSubsidized" name="platformSubsidized" />
                  <Label htmlFor="platformSubsidized">Platform Subsidized</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Promo Code"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Codes' },
          { key: 'pending', label: 'Pending Approval' },
          { key: 'approved', label: 'Approved' },
          { key: 'active', label: 'Active' },
          { key: 'inactive', label: 'Inactive' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? "default" : "outline"}
            onClick={() => setSelectedFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Promo Codes Grid */}
      <div className="grid gap-4">
        {promoCodes.map((promoCode: PromoCode) => (
          <Card key={promoCode.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {promoCode.code}
                    </code>
                    <Badge variant={promoCode.isActive ? "default" : "secondary"}>
                      {promoCode.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {promoCode.requiresApproval && !promoCode.isApproved && (
                      <Badge variant="outline" className="text-orange-600">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                    {promoCode.platformSubsidized && (
                      <Badge variant="secondary">Platform Subsidized</Badge>
                    )}
                  </CardTitle>
                  <p className="text-gray-600">{promoCode.name}</p>
                </div>
                <div className="flex gap-2">
                  {promoCode.requiresApproval && !promoCode.isApproved && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => approveMutation.mutate(promoCode.id)}
                        disabled={approveMutation.isPending || rejectMutation.isPending}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => rejectMutation.mutate(promoCode.id)}
                        disabled={rejectMutation.isPending || approveMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(promoCode)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedPromoCode(promoCode);
                      setShowAnalyticsDialog(true);
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(promoCode.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <strong>Discount:</strong>
                  <br />
                  {promoCode.discountType === 'percentage' 
                    ? `${promoCode.discountValue}%` 
                    : `$${(promoCode.discountValue / 100).toFixed(2)}`
                  }
                </div>
                <div>
                  <strong>Usage:</strong>
                  <br />
                  {promoCode.usageCount}
                  {promoCode.usageLimit && ` / ${promoCode.usageLimit}`}
                </div>
                <div>
                  <strong>Valid Period:</strong>
                  <br />
                  {formatDate(promoCode.validFrom)} - {formatDate(promoCode.validUntil)}
                </div>
                <div>
                  <strong>Budget Used:</strong>
                  <br />
                  {promoCode.platformSubsidized 
                    ? `${formatCurrency(promoCode.budgetUsed)}${promoCode.budgetLimit ? ` / ${formatCurrency(promoCode.budgetLimit)}` : ''}`
                    : 'N/A'
                  }
                </div>
              </div>
              {promoCode.description && (
                <p className="text-sm text-gray-600 mt-2">{promoCode.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {promoCodes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No promo codes found for the selected filter.</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Promo Code</DialogTitle>
            <DialogDescription>
              Make changes to the promotional code settings.
            </DialogDescription>
          </DialogHeader>
          {editingPromoCode && (
            <form onSubmit={handleUpdatePromoCode} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-code">Promo Code</Label>
                  <Input
                    id="edit-code"
                    name="code"
                    defaultValue={editingPromoCode.code}
                    placeholder="SAVE20"
                    required
                    className="uppercase"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Code cannot be changed after creation</p>
                </div>
                <div>
                  <Label htmlFor="edit-name">Display Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingPromoCode.name}
                    placeholder="20% Off First Class"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingPromoCode.description || ''}
                  placeholder="Optional description for internal use"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-discountType">Discount Type</Label>
                  <Select name="discountType" defaultValue={editingPromoCode.discountType} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-discountValue">Discount Value</Label>
                  <Input
                    id="edit-discountValue"
                    name="discountValue"
                    type="number"
                    defaultValue={editingPromoCode.discountType === 'fixed' 
                      ? (editingPromoCode.discountValue / 100).toString()
                      : editingPromoCode.discountValue.toString()}
                    placeholder="20"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-validFrom">Valid From</Label>
                  <Input
                    id="edit-validFrom"
                    name="validFrom"
                    type="datetime-local"
                    defaultValue={new Date(editingPromoCode.validFrom).toISOString().slice(0, 16)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-validUntil">Valid Until</Label>
                  <Input
                    id="edit-validUntil"
                    name="validUntil"
                    type="datetime-local"
                    defaultValue={new Date(editingPromoCode.validUntil).toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-usageLimit">Usage Limit (optional)</Label>
                <Input
                  id="edit-usageLimit"
                  name="usageLimit"
                  type="number"
                  defaultValue={editingPromoCode.usageLimit || ''}
                  placeholder="Leave blank for unlimited"
                />
              </div>

              <div>
                <Label htmlFor="edit-commissionOverride">Commission Override (%)</Label>
                <Input
                  id="edit-commissionOverride"
                  name="commissionOverride"
                  type="number"
                  defaultValue={editingPromoCode.commissionOverride || ''}
                  placeholder="Leave blank for default (15%)"
                />
              </div>

              <div>
                <Label htmlFor="edit-budgetLimit">Platform Budget Limit (USD)</Label>
                <Input
                  id="edit-budgetLimit"
                  name="budgetLimit"
                  type="number"
                  defaultValue={editingPromoCode.budgetLimit ? editingPromoCode.budgetLimit / 100 : ''}
                  placeholder="1000"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-firstBookingOnly" 
                    name="firstBookingOnly" 
                    defaultChecked={editingPromoCode.firstBookingOnly}
                  />
                  <Label htmlFor="edit-firstBookingOnly">First Booking Only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-platformSubsidized" 
                    name="platformSubsidized" 
                    defaultChecked={editingPromoCode.platformSubsidized}
                  />
                  <Label htmlFor="edit-platformSubsidized">Platform Subsidized</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="edit-isActive" 
                    name="isActive" 
                    defaultChecked={editingPromoCode.isActive}
                  />
                  <Label htmlFor="edit-isActive">Active</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingPromoCode(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Promo Code"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalyticsDialog} onOpenChange={setShowAnalyticsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Analytics for {selectedPromoCode?.code}
            </DialogTitle>
          </DialogHeader>
          {analytics && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{analytics.totalUsage}</div>
                  <div className="text-sm text-gray-600">Total Uses</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{analytics.uniqueUsers}</div>
                  <div className="text-sm text-gray-600">Unique Users</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {formatCurrency(analytics.totalDiscountGiven)}
                  </div>
                  <div className="text-sm text-gray-600">Total Discount</div>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">
                    {formatCurrency(analytics.totalSubsidyPaid)}
                  </div>
                  <div className="text-sm text-gray-600">Platform Subsidy</div>
                </div>
              </div>
              <div className="text-center p-4 border rounded">
                <div className="text-2xl font-bold">{analytics.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversion Rate</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}