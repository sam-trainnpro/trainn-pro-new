import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
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
import GoogleMapsScript from '@/components/maps/google-maps-script';
import InteractiveLocationPicker from '@/components/maps/interactive-location-picker';
import { ArrowLeft, CalendarIcon, MapPin, Plus, X, Upload, ImageIcon } from 'lucide-react';

interface ClassData {
  id: number;
  title: string;
  packageIdentifier?: string;
  recurringSeriesId?: string;
  estimatedFutureOccurrences?: number;
  futureOccurrences?: number;
}

// Session schema for time_bound packages
const sessionSchema = z.object({
  id: z.number().optional(),
  sessionNumber: z.number(),
  date: z.date(),
  startTime: z.string(),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  useDifferentLocation: z.boolean().default(false),
  sessionType: z.string().optional(),
  location: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
  // Time-bound fields
  totalSessions: true,
  price: true,
  capacity: true,
  allowLateJoin: true,
  image: true,
  location: true,
  addressLine1: true,
  city: true,
  state: true,
  zipCode: true,
  address: true,
  latitude: true,
  longitude: true,
  whatToBring: true,
  outdoors: true,
}).extend({
  title: z.string().min(1, 'Title is required'),
  packageType: z.enum(['set_pack', 'time_bound']),
  ageGroup: z.enum(['Kids', 'Adults', 'Both']).default('Adults'),
  // Convert string prices to numbers for set_pack
  price1: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }).optional(),
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
  // Time-bound package price
  price: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return val || 0;
  }).optional(),
  sessions: z.array(sessionSchema).optional(),
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
  
  // Time-bound package specific state
  const [sessions, setSessions] = useState<z.infer<typeof sessionSchema>[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const form = useForm<z.infer<typeof editPackageSchema>>({
    resolver: zodResolver(editPackageSchema),
    defaultValues: {
      title: '',
      packageType: 'set_pack',
      description: '',
      ageGroup: 'Adults',
      eligibleClasses: '',
      // Time-bound defaults
      totalSessions: 1,
      price: 0,
      capacity: 10,
      allowLateJoin: false,
      image: '',
      location: '',
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      address: '',
      latitude: undefined,
      longitude: undefined,
      whatToBring: '',
      outdoors: false,
      sessions: [],
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

  // Load form data when both package data and categories are available
  useEffect(() => {
    if (packageData && categories.length > 0) {
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
        // Time-bound fields
        totalSessions: packageData.totalSessions || 1,
        price: packageData.price || 0,
        capacity: packageData.capacity || 10,
        allowLateJoin: packageData.allowLateJoin || false,
        image: packageData.image || '',
        location: packageData.location || '',
        addressLine1: packageData.addressLine1 || '',
        city: packageData.city || '',
        state: packageData.state || '',
        zipCode: packageData.zipCode || '',
        address: packageData.address || '',
        latitude: packageData.latitude || undefined,
        longitude: packageData.longitude || undefined,
        whatToBring: packageData.whatToBring || '',
        outdoors: packageData.outdoors || false,
      });

      // Set image preview if exists
      if (packageData.image) {
        setImagePreviewUrl(packageData.image);
      }

      // Set selected classes for set_pack
      if (packageData.packageType === 'set_pack') {
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
      
      // Load sessions for time_bound packages
      if (packageData.packageType === 'time_bound') {
        loadPackageSessions();
      }
    }
  }, [packageData, categories, form]);

  // Load sessions for time-bound package
  const loadPackageSessions = async () => {
    try {
      const res = await fetch(`/api/time-bound-packages/${packageId}/sessions`);
      if (res.ok) {
        const sessionsData = await res.json();
        // Convert session data to form format
        const formattedSessions = sessionsData.map((session: any) => {
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000); // Duration in minutes
          
          return {
            id: session.id,
            sessionNumber: session.sessionNumber,
            date: new Date(session.date),
            startTime: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
            duration,
            useDifferentLocation: !!(session.location || session.address),
            sessionType: session.sessionType || '',
            location: session.location || '',
            addressLine1: session.addressLine1 || '',
            city: session.city || '',
            state: session.state || '',
            zipCode: session.zipCode || '',
            address: session.address || '',
            latitude: session.latitude || undefined,
            longitude: session.longitude || undefined,
          };
        });
        setSessions(formattedSessions);
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

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

  // Helper functions for time_bound packages
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
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
      duration: 60,
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
          futureClassCount: totalFutureOccurrences,
          price1: data.price1 || null,
          price2: data.price2 || null,
          price3: data.price3 || null,
        };
        
        return apiRequest('PUT', `/api/packages/${packageId}`, packageData);
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
              description: "Your package will be updated without changing the image",
              variant: "destructive",
            });
          } finally {
            setUploadingImage(false);
          }
        }

        // Compute startDate and endDate from sessions
        const sessionTimes = sessions.map(s => {
          const sessionDate = new Date(s.date);
          const [startHour, startMinute] = s.startTime.split(':').map(Number);
          
          const start = new Date(sessionDate);
          start.setHours(startHour, startMinute, 0, 0);
          
          const end = new Date(start.getTime() + s.duration * 60000);
          
          return { start, end };
        });
        
        const startDate = new Date(Math.min(...sessionTimes.map(t => t.start.getTime())));
        const endDate = new Date(Math.max(...sessionTimes.map(t => t.end.getTime())));

        // Prepare package data with sessions
        const packageData = {
          ...data,
          image: imageUrl,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalSessions: sessions.length,
          sessions: sessions.map(session => {
            const sessionDate = new Date(session.date);
            const [startHour, startMinute] = session.startTime.split(':').map(Number);
            
            const startDateTime = new Date(sessionDate);
            startDateTime.setHours(startHour, startMinute, 0, 0);
            
            const endDateTime = new Date(startDateTime.getTime() + session.duration * 60000);
            
            return {
              id: session.id, // Include ID if updating existing session
              sessionNumber: session.sessionNumber,
              date: sessionDate.toISOString(),
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString(),
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
        };
        
        return apiRequest('PUT', `/api/packages/${packageId}`, packageData);
      }
      
      throw new Error("Invalid package type");
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

                  {/* Time-Bound Package Configuration */}
                  {packageType === 'time_bound' && (
                    <GoogleMapsScript>
                      <div className="space-y-6">
                        <h3 className="text-lg font-medium">Time-Bound Package Details</h3>

                        {/* Image Upload */}
                        <div className="space-y-2">
                          <Label>Package Image</Label>
                          <div className="flex items-center gap-4">
                            {imagePreviewUrl && (
                              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                                <img 
                                  src={imagePreviewUrl} 
                                  alt="Package preview" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="cursor-pointer"
                                data-testid="image-upload"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Upload a photo that represents your package
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Package Price, Capacity, Allow Late Join */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                      step="0.01"
                                      min="0"
                                      className="pl-7"
                                      placeholder="199" 
                                      {...field}
                                      value={field.value || ""}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

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
                                    placeholder="10" 
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Max customers
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="allowLateJoin"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-between">
                                <div>
                                  <FormLabel>Allow Late Join</FormLabel>
                                  <FormDescription>
                                    Let customers join after start date
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

                        {/* What to Bring and Outdoors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="whatToBring"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>What to Bring</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Water bottle, yoga mat, towel..."
                                    className="resize-none"
                                    rows={2}
                                    {...field}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="outdoors"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-between">
                                <div>
                                  <FormLabel>Outdoors</FormLabel>
                                  <FormDescription>
                                    Is this an outdoor activity?
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

                        {/* Package Location */}
                        <div className="space-y-4">
                          <h4 className="font-medium">Package Location</h4>
                          <InteractiveLocationPicker
                            onLocationSelect={(locationData) => {
                              form.setValue('location', locationData.locationName || '');
                              form.setValue('addressLine1', locationData.addressLine1 || '');
                              form.setValue('city', locationData.city || '');
                              form.setValue('state', locationData.state || '');
                              form.setValue('zipCode', locationData.zipCode || '');
                              form.setValue('address', locationData.fullAddress || '');
                              form.setValue('latitude', locationData.latitude || 0);
                              form.setValue('longitude', locationData.longitude || 0);
                            }}
                            initialLocation={{
                              locationName: form.getValues('location') || '',
                              addressLine1: form.getValues('addressLine1') || '',
                              city: form.getValues('city') || '',
                              state: form.getValues('state') || '',
                              zipCode: form.getValues('zipCode') || '',
                              fullAddress: form.getValues('address') || '',
                              latitude: form.getValues('latitude') || 37.7749,
                              longitude: form.getValues('longitude') || -122.4194,
                            }}
                          />
                        </div>

                        {/* Session Schedule */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Session Schedule</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddSession}
                              data-testid="add-session-button"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Session
                            </Button>
                          </div>

                          {sessions.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                              <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No sessions added yet. Click "Add Session" to get started.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {sessions.map((session, index) => (
                                <Card key={index} className="p-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium">Session {session.sessionNumber}</h5>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveSession(index)}
                                        data-testid={`remove-session-${index}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      {/* Date */}
                                      <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className="w-full justify-start text-left font-normal"
                                              data-testid={`session-date-${index}`}
                                            >
                                              <CalendarIcon className="mr-2 h-4 w-4" />
                                              {session.date ? format(session.date, "PPP") : "Pick a date"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0">
                                            <Calendar
                                              mode="single"
                                              selected={session.date}
                                              onSelect={(date) => date && updateSession(index, 'date', date)}
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>

                                      {/* Start Time */}
                                      <div className="space-y-2">
                                        <Label>Start Time</Label>
                                        <Select
                                          value={session.startTime}
                                          onValueChange={(value) => updateSession(index, 'startTime', value)}
                                        >
                                          <SelectTrigger data-testid={`session-start-time-${index}`}>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="max-h-60">
                                            {timeSlots.map((slot) => (
                                              <SelectItem key={slot.value} value={slot.value}>
                                                {slot.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      {/* Duration */}
                                      <div className="space-y-2">
                                        <Label>Duration (minutes)</Label>
                                        <Input
                                          type="number"
                                          min="15"
                                          step="15"
                                          value={session.duration}
                                          onChange={(e) => updateSession(index, 'duration', parseInt(e.target.value) || 60)}
                                          data-testid={`session-duration-${index}`}
                                        />
                                      </div>
                                    </div>

                                    {/* Session Type */}
                                    <div className="space-y-2">
                                      <Label>Session Type (Optional)</Label>
                                      <Input
                                        placeholder="e.g., Practice, Game, Workshop"
                                        value={session.sessionType || ''}
                                        onChange={(e) => updateSession(index, 'sessionType', e.target.value)}
                                        data-testid={`session-type-${index}`}
                                      />
                                    </div>

                                    {/* Different Location Toggle */}
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={session.useDifferentLocation}
                                        onCheckedChange={(checked) => updateSession(index, 'useDifferentLocation', checked)}
                                        data-testid={`use-different-location-${index}`}
                                      />
                                      <Label>Use different location for this session</Label>
                                    </div>

                                    {/* Session Location */}
                                    {session.useDifferentLocation && (
                                      <div className="mt-4">
                                        <InteractiveLocationPicker
                                          onLocationSelect={(locationData) => {
                                            updateSession(index, 'location', locationData.locationName || '');
                                            updateSession(index, 'addressLine1', locationData.addressLine1 || '');
                                            updateSession(index, 'city', locationData.city || '');
                                            updateSession(index, 'state', locationData.state || '');
                                            updateSession(index, 'zipCode', locationData.zipCode || '');
                                            updateSession(index, 'address', locationData.fullAddress || '');
                                            updateSession(index, 'latitude', locationData.latitude || 0);
                                            updateSession(index, 'longitude', locationData.longitude || 0);
                                          }}
                                          initialLocation={{
                                            locationName: session.location || '',
                                            addressLine1: session.addressLine1 || '',
                                            city: session.city || '',
                                            state: session.state || '',
                                            zipCode: session.zipCode || '',
                                            fullAddress: session.address || '',
                                            latitude: session.latitude || 37.7749,
                                            longitude: session.longitude || -122.4194,
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </GoogleMapsScript>
                  )}

                  {/* Select Eligible Classes - Only for Set Pack */}
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