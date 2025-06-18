import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { useAuth } from "../../../hooks/use-auth-simple";
import { ClassCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation as useUserLocation } from "../../../hooks/use-location";
import PlacesAutocomplete from "@/components/maps/places-autocomplete";
import LocationPreview from "@/components/maps/location-preview";
import InteractiveLocationPicker from "@/components/maps/interactive-location-picker";
import GoogleMapsScript from "@/components/maps/google-maps-script";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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
import { useToast } from "../../../hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Separator
} from "@/components/ui/separator";
import {
  CalendarIcon,
  Loader2
} from "lucide-react";
import * as z from "zod";

// Form validation schema
const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  location: z.string().min(1, "Location name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  // Keep address field for backwards compatibility
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(), // Added for API compatibility
  whatToBring: z.string().optional(),
  image: z.string().optional(),
  isRecurring: z.boolean().default(false),
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

// CreateClassPage component
export default function CreateClassPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<ClassCategory[]>([]);
  const { latitude, longitude, getUserLocation } = useUserLocation();
  
  // Check if we're in edit mode
  const urlParams = new URLSearchParams(window.location.search);
  const editClassId = urlParams.get('edit');
  const isEditMode = !!editClassId;

  // Fetch class data for editing
  const { data: existingClass, isLoading: loadingClass } = useQuery({
    queryKey: ['/api/classes', editClassId],
    queryFn: ({ queryKey }) => {
      if (!editClassId) return null;
      return fetch(`/api/classes/${editClassId}`).then(res => res.json());
    },
    enabled: isEditMode && !!editClassId,
  });

  // Handle getting user's current location
  const handleGetLocation = async () => {
    try {
      // getUserLocation will update the latitude and longitude values from the hook
      await getUserLocation();
      
      // Access the updated values from the hook
      if (latitude && longitude) {
        // Update form values
        form.setValue('latitude', latitude);
        form.setValue('longitude', longitude);
        
        // Show success message
        toast({
          title: "Location captured",
          description: "Your coordinates have been set successfully."
        });
        
        // If Google Maps API is loaded, try to get the address from coordinates
        if (window.google && window.google.maps) {
          try {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === 'OK' && results && results.length > 0) {
                  const address = results[0].formatted_address;
                  
                  // Update the address field
                  form.setValue('address', address);
                  
                  // Also update location name if it's empty
                  const currentLocation = form.getValues('location');
                  if (!currentLocation) {
                    // Use the first part of the address as the location name
                    const addressParts = address.split(',') || [];
                    if (addressParts.length > 0) {
                      form.setValue('location', addressParts[0].trim());
                    }
                  }
                }
              }
            );
          } catch (geoError) {
            console.error("Error during geocoding:", geoError);
          }
        }
      }
    } catch (error) {
      console.error("Error getting location:", error);
      toast({
        title: "Location error",
        description: "Unable to get your location. Please check your browser permissions.",
        variant: "destructive"
      });
    }
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

  // Form definition
  const form = useForm<z.infer<typeof createClassSchema>>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      location: "",
      addressLine1: "",
      city: "",
      state: "",
      zipCode: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      price: 0,
      duration: 60,
      capacity: 10,
      startDate: new Date(),
      startTime: "09:00",
      endTime: "",
      whatToBring: "",
      image: "",
      isRecurring: false,
    },
  });

  // Create class mutation
  const { mutateAsync: createClass } = useMutation({
    mutationFn: async (data: z.infer<typeof createClassSchema>) => {
      const response = await apiRequest("POST", "/api/classes", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Class created",
        description: "Your class has been created successfully.",
      });
      navigate("/my-classes");
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating class",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // State for image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for location selection
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);

  // Handle image file selection
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  // Auto-populate address fields when location name changes
  const handleLocationNameChange = async (locationName: string) => {
    if (locationName.length < 3) return;
    
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: locationName }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const place = results[0];
          const addressComponents = place.address_components || [];
          
          let addressLine1 = '';
          let city = '';
          let state = '';
          let zipCode = '';
          
          // Extract address components
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
          
          // If no street address found, use the place name
          if (!addressLine1.trim() && place.name) {
            addressLine1 = place.name;
          }
          
          // Auto-populate the address fields
          if (addressLine1) form.setValue('addressLine1', addressLine1.trim());
          if (city) form.setValue('city', city);
          if (state) form.setValue('state', state);
          if (zipCode) form.setValue('zipCode', zipCode);
          
          // Set coordinates
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          form.setValue('latitude', lat);
          form.setValue('longitude', lng);
        }
      });
    } catch (error) {
      console.log('Geocoding not available:', error);
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

  // Form submission handler
  async function onSubmit(data: z.infer<typeof createClassSchema>) {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data received:", data);
    console.log("Form errors:", form.formState.errors);
    
    try {
      setSubmitting(true);
      setUploadingImage(true);
      
      // Create a copy of the data to modify
      const formattedData = { ...data };

      // Upload image if selected
      if (selectedImage) {
        try {
          console.log("Uploading image:", selectedImage.name);
          formattedData.image = await uploadImage(selectedImage);
          console.log("Image uploaded successfully:", formattedData.image);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast({
            title: "Image upload failed",
            description: "Your class will be created without an image",
            variant: "destructive",
          });
        }
      }
    
      // Combine address fields into a single address string for API compatibility
      formattedData.address = `${data.addressLine1}, ${data.city}, ${data.state} ${data.zipCode}`;
      
      // If coordinates are not set, we'll use the combined address string
      // The backend can handle classes with just the address string
      // This approach is more resilient when the Maps API has issues
      if (!data.latitude || !data.longitude) {
        console.log("No coordinates set, using address string only");
        
        toast({
          title: "Using address only",
          description: "Your class will be created with the address you provided.",
          variant: "default"
        });
        
        // Set default coordinates if needed (these can be zeroed out on the backend)
        if (!formattedData.latitude) formattedData.latitude = 0;
        if (!formattedData.longitude) formattedData.longitude = 0;
      }
      
      // Format the startTime from the startDate field
      const startDate = new Date(data.startDate);
      const [hours, minutes] = data.startTime.split(':').map(Number);
      startDate.setHours(hours, minutes, 0, 0);
      
      // Format the startTime field as an ISO string
      formattedData.startTime = startDate.toISOString();
      
      // Calculate end time by adding duration in minutes
      const endDate = new Date(startDate.getTime() + data.duration * 60000);
      // Add endTime to formattedData as it's expected by the API
      formattedData.endTime = endDate.toISOString();
      
      console.log("Class - Start time:", formattedData.startTime);
      console.log("Class - End time:", formattedData.endTime);
      console.log("Class - Address:", formattedData.address);
      
      // Submit the processed data
      console.log("Submitting class with data:", formattedData);
      await createClass(formattedData);
      
      // Show success message
      toast({
        title: "Class created",
        description: "Your class has been created successfully",
      });
      
      // Redirect to my-classes page
      navigate('/my-classes');
    } catch (error) {
      console.error("Error creating class:", error);
      toast({
        title: "Error creating class",
        description: "There was an error creating your class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  }

  // If not a coach, redirect to home
  if (user && user.role !== "coach") {
    navigate("/");
    return null;
  }

  // If not approved as a coach, show message
  if (user && user.role === "coach" && !user.isApproved) {
    return (
      <>
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Create a Class</h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold text-yellow-800">Awaiting Approval</h2>
              <p className="text-yellow-700 mt-1">
                Your coach account is still pending approval by an administrator. 
                You'll be able to create classes once your account has been approved.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create a Class | Trainn</title>
        <meta name="description" content="Create a new fitness class to share your expertise with students. Set up class details, schedule, and location." />
      </Helmet>
      <Header />
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create a Class</h1>
          
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
                            Provide details about your class, benefits, and experience level
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
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
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
                            Choose the category that best fits your class
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
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                        />
                        {selectedImage && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Selected: {selectedImage.name}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload an image that represents your class (max 5MB)
                      </p>
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
                              step="5" 
                              placeholder="e.g. 60" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            How long will your class last?
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
                                onChange={(e) => {
                                  field.onChange(e);
                                  // Auto-populate address when location name is typed
                                  const value = e.target.value;
                                  if (value.length > 3) {
                                    handleLocationNameChange(value);
                                  }
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Type a location name and we'll try to auto-fill the address details below
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="border rounded-md p-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Address Details</h4>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            className="h-8" 
                            onClick={handleGetLocation}
                          >
                            Use Current Location
                          </Button>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="addressLine1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1 <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 123 Main St" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. New York" {...field} />
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
                                <FormLabel>State <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. NY" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ZIP Code <span className="text-destructive">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. 10001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-sm text-muted-foreground mt-2">
                          To help users find your class, ensure your address is accurate and complete.
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Preview:</p>
                        <p className="text-sm text-muted-foreground">
                          {form.getValues('latitude') && form.getValues('longitude') 
                            ? `${form.getValues('latitude').toFixed(6)}, ${form.getValues('longitude').toFixed(6)}`
                            : 'No coordinates set'
                          }
                        </p>
                      </div>
                      
                      <GoogleMapsScript>
                        <LocationPreview 
                          latitude={form.watch('latitude')} 
                          longitude={form.watch('longitude')}
                        />
                      </GoogleMapsScript>
                    </div>
                    

                  </div>
                </div>
                
                <Separator />
                
                {/* Split Start Date & Time into separate fields */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
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
                                onSelect={(date) => {
                                  if (date) {
                                    // Preserve the time when changing date
                                    const newDate = new Date(date);
                                    if (field.value) {
                                      newDate.setHours(
                                        field.value.getHours(),
                                        field.value.getMinutes()
                                      );
                                    }
                                    field.onChange(newDate);
                                  }
                                }}
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select time" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timeSlots.map((slot) => (
                                <SelectItem key={slot.value} value={slot.value}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the time when your class will start
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* What to Bring Section - moved to its own row */}
                  <div>
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
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting || uploadingImage}
                    onClick={() => {
                      console.log("=== CREATE CLASS BUTTON CLICKED ===");
                      console.log("Form valid:", form.formState.isValid);
                      console.log("Form errors:", form.formState.errors);
                    }}
                  >
                    {submitting || uploadingImage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {uploadingImage ? "Uploading..." : "Creating..."}
                      </>
                    ) : (
                      "Create Class"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}