import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '../../../hooks/use-toast';
import { useParams, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { createInsertSchema } from 'drizzle-zod';
import { classPackages } from '@shared/schema';
import { z } from 'zod';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import MobileNavigation from '@/components/layout/mobile-navigation';
import { ArrowLeft } from 'lucide-react';

interface ClassData {
  id: number;
  title: string;
  packageIdentifier?: string;
  recurringSeriesId?: string;
  estimatedFutureOccurrences?: number;
  futureOccurrences?: number;
}

const editPackageSchema = createInsertSchema(classPackages).pick({
  title: true,
  packageType: true,
  classCount1: true,
  classCount2: true,
  classCount3: true,
  price1: true,
  price2: true,
  price3: true,
  description: true,
  categoryId: true,
  ageGroup: true,
  eligibleClasses: true,
}).extend({
  title: z.string().min(1, 'Title is required'),
  packageType: z.enum(['set_pack', 'time_bound']),
  ageGroup: z.enum(['Kids', 'Adults', 'Both']).default('Adults'),
  // Convert string prices to numbers
  price1: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }),
  price2: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }).optional(),
  price3: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? undefined : parsed;
    }
    return val;
  }).optional(),
});

export default function EditPackage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const packageId = parseInt(id!);

  const [categories, setCategories] = useState<any[]>([]);
  const [coachClasses, setCoachClasses] = useState<ClassData[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof editPackageSchema>>({
    resolver: zodResolver(editPackageSchema),
    defaultValues: {
      title: '',
      packageType: 'set_pack',
      description: '',
      ageGroup: 'Adults',
      eligibleClasses: '',
    },
  });

  const packageType = form.watch('packageType');
  const classCount1 = form.watch('classCount1');
  const classCount2 = form.watch('classCount2');
  const classCount3 = form.watch('classCount3');

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/user');
      return response.json();
    }
  });

  // Fetch package details
  const { data: packageData, isLoading: packageLoading } = useQuery({
    queryKey: [`/api/packages/${packageId}`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/packages/${packageId}`);
      return response.json();
    },
    enabled: !!packageId
  });

  // Load form data when package is fetched
  useEffect(() => {
    if (packageData) {
      form.reset({
        title: packageData.title || '',
        packageType: packageData.packageType || 'set_pack',
        classCount1: packageData.classCount1 || undefined,
        classCount2: packageData.classCount2 || undefined,
        classCount3: packageData.classCount3 || undefined,
        price1: packageData.price1 || undefined,
        price2: packageData.price2 || undefined,
        price3: packageData.price3 || undefined,
        description: packageData.description || '',
        categoryId: packageData.categoryId || undefined,
        ageGroup: packageData.ageGroup || 'Adults',
        eligibleClasses: packageData.eligibleClasses || '',
      });

      // Set selected classes
      if (packageData.eligibleClasses === 'all') {
        setSelectedClasses(['all']);
      } else if (packageData.eligibleClasses) {
        try {
          const parsed = JSON.parse(packageData.eligibleClasses);
          setSelectedClasses(Array.isArray(parsed) ? parsed : []);
        } catch {
          setSelectedClasses([]);
        }
      }
    }
  }, [packageData, form]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      }
    }
    loadCategories();
  }, []);

  // Load coach's classes with future instance counts
  useEffect(() => {
    async function loadCoachClasses() {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/coaches/${user.id}/classes/with-future-counts`);
        if (res.ok) {
          const classesWithCounts = await res.json();
          setCoachClasses(classesWithCounts);
        }
      } catch (error) {
        console.error("Error loading coach classes:", error);
      }
    }
    loadCoachClasses();
  }, [user?.id]);

  // Validate eligible classes selection
  const validateEligibleClasses = () => {
    if (packageType !== 'set_pack') return true;
    
    const largestSetPack = Math.max(
      classCount1 || 0,
      classCount2 || 0, 
      classCount3 || 0
    );
    
    if (largestSetPack === 0) return true;
    
    const requiredOccurrences = largestSetPack * 2;
    
    let totalFutureOccurrences = 0;
    
    if (selectedClasses.length === 1 && selectedClasses[0] === 'all') {
      totalFutureOccurrences = coachClasses.reduce((total, cls) => total + (cls.estimatedFutureOccurrences || cls.futureOccurrences || 0), 0);
    } else {
      // Try both packageIdentifier and id-based matching
      totalFutureOccurrences = selectedClasses.reduce((total, identifier) => {
        let classData = coachClasses.find(cls => cls.packageIdentifier === identifier);
        // If not found by packageIdentifier, try by id
        if (!classData) {
          classData = coachClasses.find(cls => cls.id.toString() === identifier);
        }
        const occurrences = classData?.estimatedFutureOccurrences || classData?.futureOccurrences || 0;
        return total + occurrences;
      }, 0);
    }
    
    if (totalFutureOccurrences < requiredOccurrences) {
      toast({
        title: "Insufficient Future Class Occurrences",
        description: `You need at least ${requiredOccurrences} future class occurrences (twice the largest set pack of ${largestSetPack}). Currently available: ${totalFutureOccurrences} future occurrences.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  // Handle eligible classes selection
  const handleClassSelection = (identifier: string, checked: boolean) => {
    if (identifier === 'all') {
      if (checked) {
        setSelectedClasses(['all']);
        form.setValue('eligibleClasses', 'all');
      } else {
        setSelectedClasses([]);
        form.setValue('eligibleClasses', '');
      }
    } else {
      let newSelection = [...selectedClasses.filter(id => id !== 'all')];
      if (checked) {
        newSelection.push(identifier);
      } else {
        newSelection = newSelection.filter(id => id !== identifier);
      }
      setSelectedClasses(newSelection);
      form.setValue('eligibleClasses', JSON.stringify(newSelection));
    }
  };

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editPackageSchema>) => {
      if (!validateEligibleClasses()) {
        throw new Error("Validation failed");
      }
      
      // Calculate total future occurrences from selected classes
      let totalFutureOccurrences = 0;
      if (selectedClasses.includes('all')) {
        totalFutureOccurrences = coachClasses.reduce((total, cls) => total + (cls.estimatedFutureOccurrences || cls.futureOccurrences || 0), 0);
      } else {
        totalFutureOccurrences = selectedClasses.reduce((total, identifier) => {
          const classData = coachClasses.find(cls => cls.packageIdentifier === identifier);
          return total + (classData?.estimatedFutureOccurrences || classData?.futureOccurrences || 0);
        }, 0);
      }
      
      const packageData = {
        ...data,
        futureClassCount: totalFutureOccurrences,
        // Store prices as regular dollar amounts
        price1: data.price1 || null,
        price2: data.price2 || null,
        price3: data.price3 || null,
      };
      
      return apiRequest('PUT', `/api/packages/${packageId}`, packageData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Package updated successfully!'
      });
      // Invalidate all package-related queries to ensure changes show up everywhere
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      queryClient.invalidateQueries({ queryKey: [`/api/packages/${packageId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages/my'] });
      navigate('/my-packages');
    },
    onError: (error: any) => {
      if (error.message !== "Validation failed") {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update package',
          variant: 'destructive'
        });
      }
    }
  });

  const onSubmit = async (data: z.infer<typeof editPackageSchema>) => {
    setSubmitting(true);
    try {
      updatePackageMutation.mutate(data);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (packageLoading) {
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

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Package not found.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/my-packages')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Packages
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Edit Package</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Package Information */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Title <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="5-Class Yoga Package" {...field} />
                        </FormControl>
                        <FormDescription>
                          Give your package a clear, descriptive name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what's included in this package..."
                            className="resize-none"
                            rows={3}
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Category and Age Group */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            value={field.value ? field.value.toString() : ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ageGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age Group</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select age group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Kids">Kids</SelectItem>
                              <SelectItem value="Adults">Adults</SelectItem>
                              <SelectItem value="Both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Package Type */}
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select package type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="set_pack">Set Pack (specific number of classes)</SelectItem>
                            <SelectItem value="time_bound">Time-bound (valid for specific period)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Set packs offer a specific number of classes, while time-bound packages are valid for a certain period
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Set Pack Configuration */}
                  {packageType === 'set_pack' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Set Pack Options</h3>
                      
                      {/* Class Count 1 and Price 1 - Required */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="classCount1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Count 1 <span className="text-destructive">*</span></FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                                value={field.value ? field.value.toString() : ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select class count" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="5">5-class pack</SelectItem>
                                  <SelectItem value="10">10-class pack</SelectItem>
                                  <SelectItem value="20">20-class pack</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                First class count option (required)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price 1 <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                                  <Input 
                                    type="text" 
                                    min="0"
                                    className="pl-7"
                                    placeholder="99" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Price for the first class count option
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Class Count 2 and Price 2 - Optional */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="classCount2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Count 2</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                                value={field.value ? field.value.toString() : "none"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Optional second class count" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="5">5-class pack</SelectItem>
                                  <SelectItem value="10">10-class pack</SelectItem>
                                  <SelectItem value="20">20-class pack</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Second class count option (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price 2</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                                  <Input 
                                    type="text" 
                                    min="0"
                                    className="pl-7"
                                    placeholder="Optional second price" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Price for the second class count option
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Class Count 3 and Price 3 - Optional */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="classCount3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class Count 3</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                                value={field.value ? field.value.toString() : "none"}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Optional third class count" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  <SelectItem value="5">5-class pack</SelectItem>
                                  <SelectItem value="10">10-class pack</SelectItem>
                                  <SelectItem value="20">20-class pack</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Third class count option (optional)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price3"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price 3</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                                  <Input 
                                    type="text" 
                                    min="0"
                                    className="pl-7"
                                    placeholder="Optional third price" 
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Price for the third class count option
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Select Eligible Classes */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium leading-none">
                        Select Eligible Classes <span className="text-destructive">*</span>
                      </label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Choose which classes can be booked with this package
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                      {/* Select All Option */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="select-all"
                          checked={selectedClasses.includes('all')}
                          onCheckedChange={(checked) => handleClassSelection('all', !!checked)}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium">
                          Select All Classes
                        </label>
                      </div>
                      
                      {/* Individual Classes */}
                      {coachClasses.map((classItem) => (
                        <div key={classItem.packageIdentifier || classItem.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`class-${classItem.packageIdentifier || classItem.id}`}
                            checked={selectedClasses.includes(classItem.packageIdentifier || classItem.id.toString()) || selectedClasses.includes('all')}
                            onCheckedChange={(checked) => handleClassSelection(classItem.packageIdentifier || classItem.id.toString(), !!checked)}
                            disabled={selectedClasses.includes('all')}
                          />
                          <label htmlFor={`class-${classItem.packageIdentifier || classItem.id}`} className="text-sm">
                            {classItem.title}
                            {classItem.recurringSeriesId && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Recurring Series)
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
                      
                      {coachClasses.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No future classes found. Create some classes first.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/my-packages')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || updatePackageMutation.isPending}
                    >
                      {submitting || updatePackageMutation.isPending ? 'Updating...' : 'Update Package'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
      <MobileNavigation />
    </div>
  );
}