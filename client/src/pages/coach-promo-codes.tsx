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
import { Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

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

export default function CoachPromoCodes() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch coach's promo codes
  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ['/api/promo-codes/my'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/promo-codes/my');
      return response.json();
    }
  });

  // Create promo code mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/promo-codes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/promo-codes/my'] });
      setShowCreateDialog(false);
      toast({
        title: "Success",
        description: "Promo code submitted for approval. You'll be notified once it's reviewed.",
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
    };

    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Promo Codes</h1>
          <p className="text-gray-600 mt-2">Create promotional codes for your classes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Promo Code</DialogTitle>
              <DialogDescription>
                Create a promotional code for your classes. All promo codes require admin approval before they go live.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePromoCode} className="space-y-4">
              <div>
                <Label htmlFor="code">Promo Code</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="SAVE20"
                  required
                  className="uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use a memorable code like SAVE20 or NEWSTUDENT
                </p>
              </div>
              
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="20% Off First Class"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is what customers will see
                </p>
              </div>
              
              <div>
                <Label htmlFor="description">Internal Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Notes for admin review..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select name="discountType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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

              <div>
                <Label htmlFor="usageLimit">Usage Limit (Optional)</Label>
                <Input
                  id="usageLimit"
                  name="usageLimit"
                  type="number"
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="firstBookingOnly" name="firstBookingOnly" />
                <Label htmlFor="firstBookingOnly">First Booking Only</Label>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  All promo codes require admin approval before they become active. 
                  You'll receive a notification once your code is reviewed.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting..." : "Submit for Approval"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Pending Approval</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-gray-400"></div>
          <span>Inactive</span>
        </div>
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
                    {promoCode.requiresApproval && !promoCode.isApproved ? (
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending Approval
                      </Badge>
                    ) : promoCode.isActive ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Inactive
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-gray-600">{promoCode.name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong>Discount:</strong>
                  <br />
                  {promoCode.discountType === 'percentage' 
                    ? `${promoCode.discountValue}%` 
                    : formatCurrency(promoCode.discountValue)
                  }
                </div>
                <div>
                  <strong>Usage:</strong>
                  <br />
                  {promoCode.usageCount}
                  {promoCode.usageLimit && ` / ${promoCode.usageLimit}`}
                  {!promoCode.usageLimit && ' (unlimited)'}
                </div>
                <div>
                  <strong>Valid Period:</strong>
                  <br />
                  {formatDate(promoCode.validFrom)} - {formatDate(promoCode.validUntil)}
                </div>
              </div>
              
              {promoCode.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                  <strong>Internal Notes:</strong> {promoCode.description}
                </div>
              )}

              {promoCode.firstBookingOnly && (
                <div className="mt-3">
                  <Badge variant="outline">First Booking Only</Badge>
                </div>
              )}

              {promoCode.requiresApproval && !promoCode.isApproved && (
                <Alert className="mt-3">
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    This promo code is awaiting admin approval. Once approved, it will be available for your customers to use.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {promoCodes.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium mb-2">No Promo Codes Yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first promotional code to offer discounts to your customers.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Promo Code
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}