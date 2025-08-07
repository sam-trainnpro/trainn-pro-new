import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Class, ClassCategory } from "@shared/schema";
import { useAuth } from "../../../hooks/use-auth-simple";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { EditRecurringModal, EditOption } from "@/components/edit-recurring-modal";
import InteractiveLocationPicker from "@/components/maps/interactive-location-picker";
import GoogleMapsScript from "@/components/maps/google-maps-script";
import { Helmet } from "react-helmet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { 
  CalendarIcon, 
  Loader2, 
  MapPin, 
  Clock, 
  ArrowLeftIcon,
  Save
} from "lucide-react";

// Define validation schema for editing a class
const editClassSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  categoryId: z.coerce.number(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
  location: z.string().min(3, "Location is required"),
  address: z.string().min(5, "Address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  image: z.string().optional().nullable(),
  ageGroup: z.enum(['Adults', 'Kids']).default('Adults'),
  classDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.coerce.number().int().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  whatToBring: z.string().optional(),
  toFindUs: z.string().optional(),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State for image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Helper function to extract address components from geocoding result
  const extractAddressComponents = (addressComponents: any[]) => {
    let addressLine1 = '';
    let city = '';
    let state = '';
    let zipCode = '';
    
    addressComponents.forEach((component: any) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressLine1 = component.long_name + ' ';
      } else if (types.includes('route')) {
        addressLine1 += component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.short_name;
      } else if (types.includes('postal_code')) {
        zipCode = component.long_name;
      }
    });
    
    return { addressLine1: addressLine1.trim(), city, state, zipCode };
  };

  // Handle pin movement on interactive map with reverse geocoding
  const handleMapPinChange = async (lat: number, lng: number) => {
    // Update coordinates immediately
    form.setValue('latitude', lat);
    form.setValue('longitude', lng);
    
    // Perform reverse geocoding to update address fields
    if (window.google && window.google.maps) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { location: { lat, lng } },
          (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
            if (status === 'OK' && results && results.length > 0) {
              const place = results[0];
              
              // Update address field with the formatted address
              form.setValue('address', place.formatted_address);
              
              // Show success message
              toast({
                title: "Address updated",
                description: "Address updated based on pin location."
              });
            }
          }
        );
      } catch (error) {
        console.error("Error during reverse geocoding:", error);
      }
    }
  };
  
  // Fetch the class to edit
  const {
    data: classData,
    isLoading: isLoadingClass,
    error: classError
  } = useQuery<Class>({
    queryKey: [`/api/classes/${id}`],
    enabled: !!id,
  });
  
  // Fetch categories for the select input
  const {
    data: categories,
    isLoading: isLoadingCategories
  } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Set up form
  const form = useForm<EditClassFormValues>({
    resolver: zodResolver(editClassSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: 0,
      price: 0,
      capacity: 1,
      location: "",
      address: "",
      latitude: 0,
      longitude: 0,
      image: "",
      ageGroup: "Adults",
      classDate: new Date(),
      startTime: "",
      duration: 60,
      whatToBring: "",
      toFindUs: "",
    },
  });

  // State for recurring class series
  const [isRecurringSeries, setIsRecurringSeries] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EditClassFormValues | null>(null);

  // Initialize form with class data when it loads (wait for both class data and categories)
  useEffect(() => {
    if (classData && categories && !isLoadingCategories) {
      // Initialize recurring series state  
      setIsRecurringSeries(!!classData.recurringSeriesId);
      
      // Extract date and time information from existing class data
      const startDateTime = classData.startTime ? new Date(classData.startTime) : new Date();
      const endDateTime = classData.endTime ? new Date(classData.endTime) : new Date();
      
      // Extract date (just the date part) - ensure it's a valid date
      let classDate = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
      
      // Validate the date
      if (isNaN(classDate.getTime())) {
        classDate = new Date(); // Fallback to today if invalid
      }
      
      // Extract time in HH:MM format
      const hours = startDateTime.getHours().toString().padStart(2, '0');
      const minutes = startDateTime.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      // Calculate duration in minutes
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes

      form.reset({
        title: classData.title,
        description: classData.description,
        categoryId: classData.categoryId,
        price: classData.price,
        capacity: classData.capacity,
        location: classData.location,
        address: classData.address || "",
        latitude: classData.latitude || 0,
        longitude: classData.longitude || 0,
        image: classData.image || "",
        ageGroup: (classData.ageGroup as "Adults" | "Kids") || "Adults",
        classDate: classDate,
        startTime: timeString,
        duration: duration > 0 ? duration : 60, // Default to 60 minutes if calculation fails
        whatToBring: classData.whatToBring || "",
        toFindUs: classData.toFindUs || "",
      });
    }
  }, [classData, categories, isLoadingCategories, form]);
  
  // Check if user is authorized to edit this class
  const isAuthorized = user && classData && (user.id === classData.coachId || user.role === 'admin');
  
  // Handle image file selection
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

    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const result = await response.json();
    return result.imageUrl;
  };
  
  // Edit class mutation
  const editMutation = useMutation({
    mutationFn: async (data: { formData: EditClassFormValues; updateSeries?: boolean }) => {
      if (!id) throw new Error("Class ID is missing");
      
      let imageUrl = data.formData.image;
      
      // Upload new image if one was selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage);
        } finally {
          setUploadingImage(false);
        }
      }

      // Convert classDate and startTime to a proper datetime
      const [hours, minutes] = data.formData.startTime.split(':').map(Number);
      const startDateTime = new Date(data.formData.classDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      // Calculate end time based on duration
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + data.formData.duration);

      const requestData = {
        title: data.formData.title,
        description: data.formData.description,
        categoryId: data.formData.categoryId,
        price: data.formData.price,
        capacity: data.formData.capacity,
        location: data.formData.location,
        address: data.formData.address,
        latitude: data.formData.latitude,
        longitude: data.formData.longitude,
        ageGroup: data.formData.ageGroup,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        whatToBring: data.formData.whatToBring,
        toFindUs: data.formData.toFindUs,
        ...(imageUrl && { image: imageUrl }),
      };

      // Use different endpoints based on whether we're updating a series or single class
      if (data.updateSeries === true) {
        return apiRequest('PUT', `/api/classes/${id}/series`, requestData);
      } else {
        return apiRequest('PUT', `/api/classes/${id}`, requestData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Class updated successfully.",
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches/1/classes'] });
      queryClient.invalidateQueries({ queryKey: ['my-calendar'] });
      
      // Navigate back to My Calendar
      navigate("/my-calendar");
    },
    onError: (error: any) => {
      console.error('Edit class error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditClassFormValues) => {
    if (!isAuthorized) {
      toast({
        title: "Error", 
        description: "You don't have permission to edit this class.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if this is a recurring class that should show the modal
    if (isRecurringSeries && classData?.recurringSeriesId) {
      setPendingFormData(data);
      setShowEditModal(true);
      return;
    }
    
    // For non-recurring classes, update directly
    editMutation.mutate({ formData: data });
  };

  // Handle the edit modal confirmation
  const handleEditModalConfirm = (option: EditOption) => {
    if (!pendingFormData) return;
    
    const updateSeries = option === 'following';
    editMutation.mutate({ 
      formData: pendingFormData, 
      updateSeries 
    });
    
    setShowEditModal(false);
    setPendingFormData(null);
  };

  const handleEditModalClose = () => {
    setShowEditModal(false);
    setPendingFormData(null);
  };

  // Show loading state
  if (isLoadingClass) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading class data...</span>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  // Show error state
  if (classError || !classData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The class you're looking for doesn't exist or you don't have permission to edit it.
            </p>
            <Button onClick={() => navigate("/my-calendar")}>
              Return to My Calendar
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <h1 className="text-2xl font-bold mb-4">Unauthorized</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to edit this class.
            </p>
            <Button onClick={() => navigate("/")}>
              Return to Home
            </Button>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Edit Class - Trainn</title>
        <meta name="description" content="Edit your fitness class details, schedule, and location." />
      </Helmet>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link href="/my-calendar" className="inline-flex items-center text-primary hover:text-primary/80">
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to My Calendar
            </Link>
          </div>
          
          <h1 className="text-2xl font-bold mb-6">Edit Class</h1>
          
          <div className="bg-card rounded-lg shadow-sm p-6 border">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Title <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Morning Yoga Flow" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your class as it will appear to students
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
                          <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your class, what to expect, who it's for, etc." 
                              className="min-h-32" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Provide details about your class, benefits, and experience level. Include URLs (e.g., https://linktr.ee/yourname) to share external links with students.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingCategories ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : (
                                categories?.map(category => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose the category that best fits your class
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Choose whether this class is designed for adults or kids
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Class Image (optional)
                      </label>
                      <div className="mt-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="h-16 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
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
                        Upload an image that represents your class (max 40MB)
                      </p>
                      
                      {/* Show current image or selected image preview */}
                      {(selectedImage || (classData?.image && !selectedImage)) && (
                        <div className="space-y-2 mt-4">
                          <Label>Image Preview</Label>
                          <div className="relative w-full h-48 border rounded-md overflow-hidden">
                            <img
                              src={selectedImage ? URL.createObjectURL(selectedImage) : classData?.image || ''}
                              alt="Class preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (!selectedImage) {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="price"
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
                                className="pl-7" 
                                placeholder="e.g. 25.00" 
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            How much will each participant pay?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              placeholder="e.g. 10" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of participants allowed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="15" 
                              step="1" 
                              placeholder="e.g. 35" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            How long will your class last? (e.g. 35, 55, 60)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col space-y-4">
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location Name <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. Central Park, 24 Hour Fitness, Dolores Park" 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the name of the venue or area
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Address <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. 123 Main St, San Francisco, CA 94102" {...field} />
                            </FormControl>
                            <FormDescription>
                              Provide the complete address for participants
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Interactive Map for Location Selection */}
                      {form.watch('latitude') && form.watch('longitude') && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Adjust Location</span>
                          </div>
                          <GoogleMapsScript>
                            <InteractiveLocationPicker
                              latitude={form.watch('latitude') || 0}
                              longitude={form.watch('longitude') || 0}
                              onLocationChange={handleMapPinChange}
                              height="300px"
                            />
                          </GoogleMapsScript>
                          <p className="text-sm text-muted-foreground">
                            Drag the red pin or click on the map to adjust the exact location. 
                            The address will update automatically.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="classDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date <span className="text-destructive">*</span></FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal justify-start"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              Select the date when your class will take place
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Select the time when your class will start
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Show recurring series info */}
                {isRecurringSeries && (
                  <div className="pt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h3 className="text-sm font-medium text-amber-800 mb-2">
                      This is part of a recurring class series
                    </h3>
                    <p className="text-xs text-amber-600">
                      When you click "Update Class", you'll choose whether to update just this class or the entire series.
                    </p>
                  </div>
                )}
                
                <FormField
                  control={form.control}
                  name="whatToBring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What to Bring</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List items participants should bring to class (e.g., yoga mat, water bottle, comfortable clothes)" 
                          className="min-h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help participants prepare by listing what they should bring to your class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="toFindUs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Find Us</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide specific instructions on how to find your exact location (e.g., meet at the picnic tables, north entrance near the playground)" 
                          className="min-h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help participants locate you at the class location with detailed directions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      navigate("/my-calendar");
                    }
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={!isAuthorized || uploadingImage}
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Class
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
      
      {/* Edit Recurring Modal */}
      <EditRecurringModal
        isOpen={showEditModal}
        onClose={handleEditModalClose}
        onConfirm={handleEditModalConfirm}
        classTitle={classData?.title || ""}
        isLoading={editMutation.isPending}
      />
    </>
  );
}