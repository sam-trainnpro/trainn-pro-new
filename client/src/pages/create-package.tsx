import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useAuth } from "../../../hooks/use-auth-simple";
import { ClassCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import GoogleMapsScript from "@/components/maps/google-maps-script";
import InteractiveLocationPicker from "@/components/maps/interactive-location-picker";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "../../../hooks/use-toast";
import { ArrowLeft, Package, CalendarIcon, MapPin, Plus, X } from 'lucide-react';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import * as z from "zod";

// Session schema for time_bound packages
const sessionSchema = z.object({
  sessionNumber: z.number(),
  date: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  useDifferentLocation: z.boolean().default(false),
  sessionType: z.string().optional(),
  // Location fields for individual sessions
  location: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Form validation schema
const createPackageSchema = z.object({
  title: z.string().min(3, "Package title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  packageType: z.enum(['set_pack', 'time_bound'], {
    required_error: "Please select a package type"
  }),
  // Class counts - classCount1 is mandatory for set_pack, others optional
  classCount1: z.coerce.number().min(1).optional(),
  classCount2: z.coerce.number().min(1).optional(),
  classCount3: z.coerce.number().min(1).optional(),
  // Prices - price1 is mandatory for set_pack, others optional  
  price1: z.coerce.number().min(0).optional(),
  price2: z.coerce.number().min(0).optional(),
  price3: z.coerce.number().min(0).optional(),
  // Eligible classes - mandatory for set_pack
  eligibleClasses: z.string().optional(),
  // Fields from Create Class form
  ageGroup: z.enum(['Kids', 'Adults', 'Both']).default('Adults'),
  outdoors: z.boolean().default(false),
  // Time-bound specific fields
  totalSessions: z.coerce.number().min(1).optional(),
  price: z.coerce.number().min(0).optional(),
  capacity: z.coerce.number().min(1).optional(),
  allowLateJoin: z.boolean().default(false),
  image: z.string().optional(),
  // Location fields for time_bound packages
  location: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  whatToBring: z.string().optional(),
  sessions: z.array(sessionSchema).optional(),
}).refine((data) => {
  // Custom validation for set_pack type
  if (data.packageType === 'set_pack') {
    if (!data.classCount1 || data.classCount1 < 1) {
      return false;
    }
    if (!data.price1 || data.price1 < 0) {
      return false;
    }
    if (!data.eligibleClasses || data.eligibleClasses === "") {
      return false;
    }
  }
  // Custom validation for time_bound type
  if (data.packageType === 'time_bound') {
    if (!data.totalSessions || data.totalSessions < 1) {
      return false;
    }
    if (data.price === undefined || data.price < 0) {
      return false;
    }
  }
  return true;
}, {
  message: "Required fields are missing for the selected package type",
  path: ["packageType"]
});

// Time slots for the day
const generateTimeSlots = () => {
  const slots = [];
  const totalMinutesInDay = 24 * 60;
  const intervalMinutes = 30;
  
  for (let minutes = 0; minutes < totalMinutesInDay; minutes += intervalMinutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const timeString = `${displayHours}:${mins.toString().padStart(2, '0')} ${period}`;
    slots.push({
      value: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`,
      label: timeString
    });
  }
  
  return slots;
};

const timeSlots = generateTimeSlots();

export default function CreatePackage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const [coachClasses, setCoachClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Time-bound package specific state
  const [sessions, setSessions] = useState<z.infer<typeof sessionSchema>[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
      // Time-bound defaults
      totalSessions: 1,
      price: 0,
      capacity: 10,
      allowLateJoin: false,
      image: "",
      location: "",
      addressLine1: "",
      city: "",
      state: "",
      zipCode: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      whatToBring: "",
      sessions: [],
    },
  });

  // Watch packageType to show/hide conditional fields
  const packageType = form.watch("packageType");
  const classCount1 = form.watch("classCount1");
  const classCount2 = form.watch("classCount2");
  const classCount3 = form.watch("classCount3");
  const totalSessions = form.watch("totalSessions");

  // Helper functions for time_bound packages
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Upload image and get URL
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch("/api/upload-image", {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.imageUrl;
  };

  // Add a new session
  const handleAddSession = () => {
    const newSession: z.infer<typeof sessionSchema> = {
      sessionNumber: sessions.length + 1,
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      useDifferentLocation: false,
      sessionType: "",
      location: "",
      addressLine1: "",
      city: "",
      state: "",
      zipCode: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
    };
    setSessions([...sessions, newSession]);
  };

  // Remove a session
  const handleRemoveSession = (index: number) => {
    const updatedSessions = sessions.filter((_, i) => i !== index);
    // Renumber remaining sessions
    const renumberedSessions = updatedSessions.map((session, i) => ({
      ...session,
      sessionNumber: i + 1
    }));
    setSessions(renumberedSessions);
  };

  // Update a session field
  const updateSession = (index: number, field: string, value: any) => {
    const updatedSessions = [...sessions];
    updatedSessions[index] = {
      ...updatedSessions[index],
      [field]: value
    };
    setSessions(updatedSessions);
  };

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
              estimatedFutureOccurrences: group.futureOccurrences,
              // Add packageIdentifier for backward compatibility with fallback
              packageIdentifier: group.recurringSeriesId || group.id.toString()
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
      // Sum occurrences from specifically selected classes using packageIdentifier
      totalFutureOccurrences = selectedClasses.reduce((total, identifier) => {
        const classData = coachClasses.find(cls => cls.packageIdentifier === identifier);
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

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPackageSchema>) => {
      // Handle set_pack validation
      if (data.packageType === 'set_pack') {
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
          coachId: user?.id,
          futureClassCount: totalFutureOccurrences,
          status: 'enabled',
          isActive: true
        };
        
        return apiRequest('POST', '/api/packages', packageData);
      }
      
      // Handle time_bound package
      if (data.packageType === 'time_bound') {
        // Validate sessions exist
        if (!sessions || sessions.length === 0) {
          throw new Error("Please add at least one session to the package");
        }
        
        // Upload image if selected
        let imageUrl = data.image || "";
        if (selectedImage) {
          try {
            setUploadingImage(true);
            imageUrl = await uploadImage(selectedImage);
          } catch (uploadError) {
            console.error("Image upload failed:", uploadError);
            toast({
              title: "Image upload failed",
              description: "Your package will be created without an image",
              variant: "destructive",
            });
          } finally {
            setUploadingImage(false);
          }
        }

        // Compute startDate and endDate from sessions
        // Combine date + time to create proper timestamps
        const sessionTimes = sessions.map(s => {
          const sessionDate = new Date(s.date);
          const [startHour, startMinute] = s.startTime.split(':').map(Number);
          const [endHour, endMinute] = s.endTime.split(':').map(Number);
          
          const start = new Date(sessionDate);
          start.setHours(startHour, startMinute, 0, 0);
          
          const end = new Date(sessionDate);
          end.setHours(endHour, endMinute, 0, 0);
          
          return { start, end };
        });
        
        const startDate = new Date(Math.min(...sessionTimes.map(t => t.start.getTime())));
        const endDate = new Date(Math.max(...sessionTimes.map(t => t.end.getTime())));

        // Prepare package data with sessions - combine date + time for each session
        const packageData = {
          ...data,
          coachId: user?.id,
          image: imageUrl,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          sessions: sessions.map(session => {
            const sessionDate = new Date(session.date);
            const [startHour, startMinute] = session.startTime.split(':').map(Number);
            const [endHour, endMinute] = session.endTime.split(':').map(Number);
            
            const startTime = new Date(sessionDate);
            startTime.setHours(startHour, startMinute, 0, 0);
            
            const endTime = new Date(sessionDate);
            endTime.setHours(endHour, endMinute, 0, 0);
            
            return {
              sessionNumber: session.sessionNumber,
              date: sessionDate.toISOString(),
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              location: session.location,
              addressLine1: session.addressLine1,
              city: session.city,
              state: session.state,
              zipCode: session.zipCode,
              address: session.address,
              latitude: session.latitude,
              longitude: session.longitude,
              sessionType: session.sessionType,
            };
          }),
          status: 'enabled',
          isActive: true
        };
        
        return apiRequest('POST', '/api/time-bound-packages', packageData);
      }
      
      throw new Error("Invalid package type");
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Package created successfully!'
      });
      // Invalidate both the general packages query and the coach's specific packages query
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/packages/my'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-bound-packages'] });
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

  const onSubmit = async (data: z.infer<typeof createPackageSchema>) => {
    setSubmitting(true);
    try {
      await createPackageMutation.mutateAsync(data);
    } finally {
      setSubmitting(false);
    }
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
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                          <SelectItem value="Kids">Kids</SelectItem>
                          <SelectItem value="Adults">Adults</SelectItem>
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

            {/* Conditional Fields for TIME BOUND */}
            {packageType === 'time_bound' && (
              <div className="space-y-6">
                <Separator />
                <h3 className="text-lg font-semibold">Time-Bound Package Details</h3>
                
                {/* Total Sessions and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="totalSessions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Sessions <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="e.g. 8" 
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Auto-adjust sessions array when totalSessions changes
                              const newTotal = parseInt(e.target.value) || 0;
                              if (newTotal > sessions.length) {
                                // Add more sessions
                                const sessionsToAdd = newTotal - sessions.length;
                                for (let i = 0; i < sessionsToAdd; i++) {
                                  handleAddSession();
                                }
                              } else if (newTotal < sessions.length) {
                                // Remove excess sessions
                                setSessions(sessions.slice(0, newTotal));
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Number of sessions in this package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Price <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                            <Input 
                              type="number" 
                              min="0" 
                              step="0.01"
                              className="pl-7 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                              placeholder="e.g. 200.00" 
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Total price for the entire package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Capacity and Allow Late Join */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            placeholder="e.g. 15" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of participants (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowLateJoin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Late Join
                          </FormLabel>
                          <FormDescription>
                            Can students join after the package has started?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium leading-none">
                    Package Image (optional)
                  </label>
                  <div className="mt-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="h-16 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      data-testid="input-package-image"
                    />
                    {selectedImage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedImage.name}
                      </p>
                    )}
                    {uploadingImage && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Uploading image...
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload an image that represents your package (max 40MB)
                  </p>
                </div>

                {/* Package Location */}
                <Separator />
                <h4 className="text-md font-semibold">Package Location</h4>
                <p className="text-sm text-muted-foreground">
                  Set the default location for all sessions. Individual sessions can override this.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Central Park, Community Center" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Name of the location for this package
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addressLine1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. San Francisco" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 94102" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* What To Bring */}
                <FormField
                  control={form.control}
                  name="whatToBring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What To Bring (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g. Water bottle, yoga mat, comfortable clothing..." 
                          className="min-h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        List items participants should bring to the sessions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Session Builder */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-semibold">Session Schedule</h4>
                      <p className="text-sm text-muted-foreground">
                        Define the date and time for each session
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSession}
                      className="flex items-center gap-2"
                      data-testid="button-add-session"
                    >
                      <Plus className="h-4 w-4" />
                      Add Session
                    </Button>
                  </div>

                  {sessions.map((session, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Session {session.sessionNumber}</h5>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSession(index)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-remove-session-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Picker */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date <span className="text-destructive">*</span></label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full pl-3 text-left font-normal justify-start"
                                data-testid={`button-session-date-${index}`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {session.date ? format(session.date, "PPP") : <span>Select date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={session.date}
                                onSelect={(date) => {
                                  if (date) updateSession(index, 'date', date);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Start Time */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Start Time <span className="text-destructive">*</span></label>
                          <Select 
                            value={session.startTime}
                            onValueChange={(value) => updateSession(index, 'startTime', value)}
                          >
                            <SelectTrigger data-testid={`select-session-start-time-${index}`}>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* End Time */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Time <span className="text-destructive">*</span></label>
                          <Select 
                            value={session.endTime}
                            onValueChange={(value) => updateSession(index, 'endTime', value)}
                          >
                            <SelectTrigger data-testid={`select-session-end-time-${index}`}>
                              <SelectValue placeholder="Select time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Session Type (optional) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Session Type (optional)</label>
                          <Input 
                            placeholder="e.g. Practice, Game, Workshop" 
                            value={session.sessionType || ""}
                            onChange={(e) => updateSession(index, 'sessionType', e.target.value)}
                            data-testid={`input-session-type-${index}`}
                          />
                        </div>

                        {/* Use Different Location Checkbox */}
                        <div className="flex items-center space-x-2 pt-6">
                          <Checkbox
                            id={`different-location-${index}`}
                            checked={session.useDifferentLocation}
                            onCheckedChange={(checked) => updateSession(index, 'useDifferentLocation', !!checked)}
                            data-testid={`checkbox-different-location-${index}`}
                          />
                          <label 
                            htmlFor={`different-location-${index}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Use different location for this session
                          </label>
                        </div>
                      </div>

                      {/* Session-specific Location Fields */}
                      {session.useDifferentLocation && (
                        <div className="border-t pt-4 mt-4 space-y-4">
                          <h6 className="text-sm font-medium">Session Location</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Location Name</label>
                              <Input 
                                placeholder="e.g. Different Park" 
                                value={session.location || ""}
                                onChange={(e) => updateSession(index, 'location', e.target.value)}
                                data-testid={`input-session-location-${index}`}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Address Line 1</label>
                              <Input 
                                placeholder="e.g. 456 Other St" 
                                value={session.addressLine1 || ""}
                                onChange={(e) => updateSession(index, 'addressLine1', e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">City</label>
                              <Input 
                                placeholder="City" 
                                value={session.city || ""}
                                onChange={(e) => updateSession(index, 'city', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">State</label>
                              <Input 
                                placeholder="State" 
                                value={session.state || ""}
                                onChange={(e) => updateSession(index, 'state', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">ZIP</label>
                              <Input 
                                placeholder="ZIP" 
                                value={session.zipCode || ""}
                                onChange={(e) => updateSession(index, 'zipCode', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <p className="text-muted-foreground">
                        No sessions added yet. Click "Add Session" to start building your schedule.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Select Eligible Classes - only for set_pack */}
            {packageType === 'set_pack' && (
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
            )}


            {/* Submit Buttons */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
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
      <Footer />
      <MobileNavigation />
    </>
  );
}