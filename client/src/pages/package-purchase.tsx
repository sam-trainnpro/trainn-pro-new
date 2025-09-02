import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth-simple";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";
import { Package, User, Calendar, CheckCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ClassPackage {
  id: number;
  coachId: number;
  coachName: string;
  coachBusinessName?: string;
  displayBusinessName?: boolean;
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
  categoryName?: string;
  ageGroup: string;
  isActive: boolean;
  status: string;
  creationDate: string;
  futureClassCount: number | null;
  createdAt: string;
}

interface PackageOption {
  classCount: number;
  price: number;
}

export default function PackagePurchasePage() {
  const [, navigate] = useLocation();
  const [_, params] = useRoute<{ packageId: string }>("/package/:packageId/purchase");
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<PackageOption | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const packageId = params?.packageId ? parseInt(params.packageId) : null;

  // Fetch package details
  const { 
    data: packageData, 
    isLoading, 
    error 
  } = useQuery<ClassPackage>({
    queryKey: [`/api/packages/${packageId}`],
    enabled: !!packageId,
  });

  const getAvailableOptions = (pkg: ClassPackage): PackageOption[] => {
    const options: PackageOption[] = [];
    
    if (pkg.classCount1 && pkg.price1) {
      options.push({ classCount: pkg.classCount1, price: pkg.price1 });
    }
    if (pkg.classCount2 && pkg.price2) {
      options.push({ classCount: pkg.classCount2, price: pkg.price2 });
    }
    if (pkg.classCount3 && pkg.price3) {
      options.push({ classCount: pkg.classCount3, price: pkg.price3 });
    }
    
    return options;
  };

  const formatPrice = (price: number) => {
    return `$${Math.floor(price)}`;
  };

  const getProviderDisplayName = (pkg: ClassPackage) => {
    return pkg.displayBusinessName && pkg.coachBusinessName ? pkg.coachBusinessName : pkg.coachName;
  };

  const handleProceedToCheckout = () => {
    if (!selectedOption || !packageData) return;
    
    // Navigate to a new package checkout page with the selected option
    navigate(`/package-checkout?packageId=${packageData.id}&classCount=${selectedOption.classCount}&price=${selectedOption.price}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Package Not Found</h1>
            <p className="text-gray-600 mb-6">The package you're looking for doesn't exist or is no longer available.</p>
            <Button onClick={() => navigate("/packages")}>
              Browse All Packages
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  const availableOptions = getAvailableOptions(packageData);

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Purchase {packageData.title} - Trainn</title>
        <meta name="description" content={`Purchase ${packageData.title} package from ${getProviderDisplayName(packageData)}`} />
      </Helmet>
      
      <Header />
      
      <main className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate("/packages")}
            className="mb-4"
          >
            ← Back to Packages
          </Button>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-primary" />
                    {packageData.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <User className="w-4 h-4" />
                    <span>by {packageData.coachName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Age group: {packageData.ageGroup}</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
            </CardHeader>
            
            <CardContent>
              {packageData.categoryName && (
                <Badge variant="outline" className="mb-3">
                  {packageData.categoryName}
                </Badge>
              )}
              
              {packageData.description && (
                <p className="text-gray-600 mb-4">{packageData.description}</p>
              )}
              
              {packageData.futureClassCount && (
                <p className="text-sm text-gray-500">
                  {packageData.futureClassCount} upcoming classes available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Package Options Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Package Option</CardTitle>
              <p className="text-gray-600">Choose the number of classes you'd like to purchase:</p>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {availableOptions.map((option, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedOption?.classCount === option.classCount && selectedOption?.price === option.price
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedOption(option)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedOption?.classCount === option.classCount && selectedOption?.price === option.price
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                        }`}>
                          {selectedOption?.classCount === option.classCount && selectedOption?.price === option.price && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{option.classCount} Classes</h3>
                          <p className="text-sm text-gray-600">
                            {formatPrice(option.price / option.classCount)} per class
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">
                          {formatPrice(option.price)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {availableOptions.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No package options are currently available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <div className="flex justify-end">
            <Button 
              size="lg"
              className="px-8"
              disabled={!selectedOption}
              onClick={handleProceedToCheckout}
            >
              Proceed to Checkout
              {selectedOption && (
                <span className="ml-2">
                  • {formatPrice(selectedOption.price)}
                </span>
              )}
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}