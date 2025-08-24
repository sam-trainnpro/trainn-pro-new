import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { useAuth } from "../../../hooks/use-auth-simple";
import { ClassCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "../../../hooks/use-toast";
import { ArrowLeft, Package } from 'lucide-react';
import * as z from "zod";

// Form validation schema
const createPackageSchema = z.object({
  title: z.string().min(3, "Package title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  packageType: z.enum(['set_pack', 'time_bound'], {
    required_error: "Please select a package type"
  }),
  // Class counts - classCount1 is mandatory for set_pack, others optional
  classCount1: z.coerce.number().min(1, "First class count is required"),
  classCount2: z.coerce.number().min(1).optional(),
  classCount3: z.coerce.number().min(1).optional(),
  // Prices - price1 is mandatory for set_pack, others optional  
  price1: z.coerce.number().min(0, "First price is required"),
  price2: z.coerce.number().min(0).optional(),
  price3: z.coerce.number().min(0).optional(),
  // Eligible classes - mandatory selection
  eligibleClasses: z.string().min(1, "Please select eligible classes"),
  // Fields from Create Class form
  ageGroup: z.enum(['Adults', 'Kids', 'Both']).default('Adults'),
  outdoors: z.boolean().default(false),
}).refine((data) => {
  // Custom validation for set_pack type
  if (data.packageType === 'set_pack') {
    if (!data.classCount1 || data.classCount1 < 1) {
      return false;
    }
    if (!data.price1 || data.price1 < 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Class count and price are required for set pack type",
  path: ["classCount1"]
});

export default function CreatePackage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [coachClasses, setCoachClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Form definition
  const form = useForm<z.infer<typeof createPackageSchema>>({
    resolver: zodResolver(createPackageSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      packageType: "set_pack",
      classCount1: 5,
      classCount2: undefined,
      classCount3: undefined,
      price1: 0,
      price2: undefined,
      price3: undefined,
      eligibleClasses: "",
      ageGroup: "Adults",
      outdoors: false,
    },
  });

  // Watch packageType to show/hide conditional fields
  const packageType = form.watch("packageType");
  const classCount1 = form.watch("classCount1");
  const classCount2 = form.watch("classCount2");
  const classCount3 = form.watch("classCount3");

  // Load categories on mount
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

  // Load coach's classes with actual future instance counts
  useEffect(() => {
    async function loadCoachClasses() {
      if (!user?.id) return;
      try {
        // Get coach classes with future instance counts from backend
        const res = await fetch(`/api/coaches/${user.id}/classes/with-future-counts`);
        if (res.ok) {
          const classesWithCounts = await res.json();
          setCoachClasses(classesWithCounts);
        } else {
          // Fallback to regular API if new endpoint doesn't exist yet
          const fallbackRes = await fetch(`/api/classes`);
          if (fallbackRes.ok) {
            const allClasses = await fallbackRes.json();
            const now = new Date();
            
            // Filter to only classes by this coach with future dates
            const coachClasses = allClasses.filter((cls: any) => {
              if (cls.coachId !== user.id) return false;
              if (cls.startTime) {
                return new Date(cls.startTime) > now;
              }
              return true; // Keep classes without start time for now
            });
            
            // Group by title/series and count actual future instances
            const classGroups = new Map();
            
            coachClasses.forEach((cls: any) => {
              const groupKey = cls.recurringSeriesId || cls.title;
              if (!classGroups.has(groupKey)) {
                classGroups.set(groupKey, {
                  id: cls.id,
                  title: cls.title,
                  isRecurring: cls.isRecurring || !!cls.recurringSeriesId,
                  futureOccurrences: 0
                });
              }
              // Count this as a future occurrence
              classGroups.get(groupKey).futureOccurrences++;
            });
            
            const uniqueClasses = Array.from(classGroups.values()).map(group => ({
              ...group,
              estimatedFutureOccurrences: group.futureOccurrences
            }));
            
            setCoachClasses(uniqueClasses);
          }
        }
      } catch (error) {
        console.error("Error loading coach classes:", error);
      }
    }
    loadCoachClasses();
  }, [user?.id]);

  // Validate total future occurrences against largest set pack
  const validateEligibleClasses = () => {
    if (packageType !== 'set_pack') return true;
    
    const largestSetPack = Math.max(
      classCount1 || 0,
      classCount2 || 0, 
      classCount3 || 0
    );
    
    if (largestSetPack === 0) return true;
    
    const requiredOccurrences = largestSetPack * 2;
    
    // Calculate total future occurrences from selected classes
    let totalFutureOccurrences = 0;
    
    if (selectedClasses.length === 1 && selectedClasses[0] === 'all') {
      // If "all" is selected, sum all class occurrences
      totalFutureOccurrences = coachClasses.reduce((total, cls) => total + (cls.estimatedFutureOccurrences || cls.futureOccurrences || 0), 0);
    } else {
      // Sum occurrences from specifically selected classes - FIX: Convert string ID to number
      totalFutureOccurrences = selectedClasses.reduce((total, classId) => {
        const classData = coachClasses.find(cls => cls.id === parseInt(classId));
        return total + (classData?.estimatedFutureOccurrences || classData?.futureOccurrences || 0);
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
  const handleClassSelection = (classId: string, checked: boolean) => {
    if (classId === 'all') {
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
        newSelection.push(classId);
      } else {
        newSelection = newSelection.filter(id => id !== classId);
      }
      setSelectedClasses(newSelection);
      form.setValue('eligibleClasses', JSON.stringify(newSelection));
    }
  };

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPackageSchema>) => {
      if (!validateEligibleClasses()) {
        throw new Error("Validation failed");
      }
      
      const packageData = {
        ...data,
        coachId: user?.id,
        futureClassCount: selectedClasses.includes('all') ? coachClasses.length : selectedClasses.length,
        status: 'enabled',
        isActive: true
      };
      
      return apiRequest('POST', '/api/packages', packageData);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Package created successfully!'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      navigate('/my-packages');
    },
    onError: (error: any) => {
      if (error.message !== "Validation failed") {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create package',
          variant: 'destructive'
        });
      }
    }
  });

  const onSubmit = (data: z.infer<typeof createPackageSchema>) => {
    setSubmitting(true);
    createPackageMutation.mutate(data);
    setSubmitting(false);
  };

  // Check if user is logged in and is an approved coach
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to create packages.</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'coach') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">You must be a coach to create packages.</p>
        </div>
      </div>
    );
  }

  if (!user.isApproved) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Your coach account is pending approval.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <div className="bg-card rounded-lg shadow-sm p-6 border">
        <div className="flex items-center gap-2 mb-6">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Create Package</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                {/* Package Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Title <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 5-Class Yoga Bundle" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your package as it will appear to students
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the category that best fits your package
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age Group */}
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Adults">Adults</SelectItem>
                          <SelectItem value="Kids">Kids</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether this package is designed for adults, kids, or both
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your package, what's included, benefits, etc." 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about your package and what students can expect
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Package Type */}
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type <span className="text-destructive">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select package type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="set_pack">A SET PACK</SelectItem>
                          <SelectItem value="time_bound">TIME BOUND</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose whether this is a set number of classes or time-based package
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Conditional Class Count and Price Fields for SET PACK */}
            {packageType === 'set_pack' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Package Options</h3>
                
                {/* Class Count 1 and Price 1 - Mandatory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classCount1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Count <span className="text-destructive">*</span></FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value?.toString()}
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
                          First class count option (mandatory)
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
                        <FormLabel>Price <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              placeholder="e.g. 100.00" 
                              {...field}
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
                          value={field.value?.toString() || "none"}
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
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
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
                          value={field.value?.toString() || "none"}
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
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
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
                  <div key={classItem.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`class-${classItem.id}`}
                      checked={selectedClasses.includes(classItem.id.toString()) || selectedClasses.includes('all')}
                      onCheckedChange={(checked) => handleClassSelection(classItem.id.toString(), !!checked)}
                      disabled={selectedClasses.includes('all')}
                    />
                    <label htmlFor={`class-${classItem.id}`} className="text-sm">
                      {classItem.title}
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
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting || createPackageMutation.isPending}
              >
                {submitting || createPackageMutation.isPending ? 'Creating...' : 'Create Package'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}