import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { format, addWeeks, addMinutes } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { ClassCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation as useUserLocation } from "@/hooks/use-location";
import PlacesAutocomplete from "@/components/maps/places-autocomplete";
import LocationPreview from "@/components/maps/location-preview";
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
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Separator
} from "@/components/ui/separator";
import {
  CalendarIcon,
  X,
  Plus,
  Loader2,
  MapPin
} from "lucide-react";
import * as z from "zod";

// Form validation schema
const createClassSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().min(1, "Please select a category"),
  location: z.string().min(1, "Location name is required"),
  address: z.string().min(1, "Full address is required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  duration: z.coerce.number().min(15, "Duration must be at least 15 minutes"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  startDate: z.date({
    required_error: "Start date and time is required",
  }),
  startTime: z.string().optional(), // Will be calculated from startDate
  endTime: z.string().optional(),   // Will be calculated from startDate + duration
  isRecurring: z.boolean().default(false),
  endDate: z.date().optional(),
  seriesStartDate: z.date().optional(), // For recurring classes - use startDate
  seriesEndDate: z.date().optional(),   // For recurring classes - use endDate
  image: z.string().url("Please enter a valid image URL").optional(),
  schedules: z.array(
    z.object({
      dayOfWeek: z.string().min(1, "Day of week is required"),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().optional(), // Will be calculated based on startTime + duration
    })
  ).optional(),
});

// Schedule form schema
const scheduleSchema = z.object({
  dayOfWeek: z.string().min(1, "Day of week is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
});

// Days of the week options
const daysOfWeek = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

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
      address: "",
      latitude: undefined,
      longitude: undefined,
      price: 0,
      duration: 60,
      capacity: 10,
      startDate: new Date(),
      startTime: "",
      endTime: "",
      isRecurring: false,
      endDate: addWeeks(new Date(), 4),
      seriesStartDate: new Date(),
      seriesEndDate: addWeeks(new Date(), 4),
      image: "",
      schedules: [],
    },
  });

  // Setup schedule field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  // Add a new schedule
  const addNewSchedule = () => {
    append({ dayOfWeek: "", startTime: "" });
  };

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

  // Form submission handler
  async function onSubmit(data: z.infer<typeof createClassSchema>) {
    // Prevent submission if coordinates are missing
    if (!data.latitude || !data.longitude) {
      toast({
        title: "Location required",
        description: "Please provide a valid location on the map.",
        variant: "destructive",
      });
      return;
    }
    
    // Check for recurring classes without schedules
    if (data.isRecurring && (!data.schedules || data.schedules.length === 0)) {
      toast({
        title: "Schedule required",
        description: "Please add at least one schedule for recurring classes",
        variant: "destructive",
      });
      return;
    }
    
    // Create a copy of the data to modify
    const formattedData = { ...data };
    
    if (!data.isRecurring) {
      // SINGLE CLASS
      // Get the date part from startDate
      const startDate = new Date(data.startDate);
      
      // Format the startTime field as an ISO string
      formattedData.startTime = startDate.toISOString();
      
      // Calculate end time by adding duration in minutes
      const endDate = new Date(startDate.getTime() + data.duration * 60000);
      formattedData.endTime = endDate.toISOString();
      
      // Remove recurring class fields
      delete formattedData.schedules;
      
    } else {
      // RECURRING CLASS
      // Rename fields for the server
      formattedData.seriesStartDate = data.startDate;
      formattedData.seriesEndDate = data.endDate;
      
      // Process schedules to include end times based on duration
      if (formattedData.schedules) {
        formattedData.schedules = formattedData.schedules.map(schedule => {
          // Parse the time string (HH:MM)
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          
          // Calculate end time based on duration
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          const endDate = new Date(startDate.getTime() + data.duration * 60000);
          
          // Format end time as HH:MM
          const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
          
          return {
            ...schedule,
            endTime
          };
        });
      }
    }
    
    setSubmitting(true);
    
    try {
      console.log("Submitting class with data:", formattedData);
      
      // Submit the processed data
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
        <title>Create a Class | Elevate</title>
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
                            Provide details about your class, benefits, and what students should bring
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
                    
                    <FormField
                      control={form.control}
                      name="image"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g. https://example.com/image.jpg" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>
                            Provide a URL to an image representing your class
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Name <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Central Park" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of the venue or location
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
                          <GoogleMapsScript>
                            <PlacesAutocomplete 
                              placeholder="e.g. 123 Main St, New York, NY 10001" 
                              defaultValue={field.value}
                              onAddressSelect={(address, lat, lng) => {
                                // Update the address field
                                field.onChange(address);
                                
                                // Update latitude and longitude
                                form.setValue('address', address);
                                form.setValue('latitude', lat);
                                form.setValue('longitude', lng);
                                
                                // Trigger validation
                                form.trigger('address');
                                
                                // Also update location name if it's empty
                                const currentLocation = form.getValues('location');
                                if (!currentLocation) {
                                  // Use the first part of the address as the location name
                                  const addressParts = address.split(',') || [];
                                  if (addressParts.length > 0) {
                                    form.setValue('location', addressParts[0].trim());
                                  }
                                }
                              }}
                            />
                          </GoogleMapsScript>
                        </FormControl>
                        <div className="flex justify-between items-center">
                          <FormDescription>
                            Start typing for suggestions from Google Maps
                          </FormDescription>
                          
                          <GoogleMapsScript>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={async () => {
                                if (navigator.geolocation) {
                                  try {
                                    navigator.geolocation.getCurrentPosition(async (position) => {
                                      const { latitude, longitude } = position.coords;
                                      
                                      // Update form with coordinates
                                      form.setValue('latitude', latitude);
                                      form.setValue('longitude', longitude);
                                      
                                      // Use Google Maps Geocoder directly for reverse geocoding
                                      try {
                                        // Maps API should now be loaded via GoogleMapsScript
                                        if (!window.google || !window.google.maps) {
                                          // Fallback in case script isn't loaded yet
                                          toast({
                                            title: "Location captured",
                                            description: "Your coordinates have been set. Please provide the address manually.",
                                          });
                                          return;
                                        }
                                        
                                        const geocoder = new window.google.maps.Geocoder();
                                        geocoder.geocode(
                                          { location: { lat: latitude, lng: longitude } },
                                          (results, status) => {
                                            if (status === 'OK' && results && results.length > 0) {
                                              const address = results[0].formatted_address;
                                              form.setValue('address', address);
                                              
                                              // Set location name if empty
                                              if (!form.getValues('location')) {
                                                const addressParts = address.split(',');
                                                if (addressParts.length > 0) {
                                                  form.setValue('location', addressParts[0].trim());
                                                }
                                              }
                                            } else {
                                              toast({
                                                title: "Geocoding failed",
                                                description: "We couldn't determine your address. Please enter it manually.",
                                                variant: "destructive"
                                              });
                                            }
                                          }
                                        );
                                      } catch (error) {
                                        console.error("Error during reverse geocoding:", error);
                                        toast({
                                          title: "Location error",
                                          description: "Your coordinates were captured, but we couldn't get your address. Please enter it manually.",
                                          variant: "destructive"
                                        });
                                      }
                                    }, 
                                    (error) => {
                                      console.error("Error getting location:", error);
                                      toast({
                                        title: "Location error",
                                        description: "Unable to get your current location. Please check your browser permissions.",
                                        variant: "destructive"
                                      });
                                    });
                                  } catch (error) {
                                    console.error("Geolocation error:", error);
                                  }
                                } else {
                                  toast({
                                    title: "Location not supported",
                                    description: "Geolocation is not supported by your browser",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="text-xs px-2 py-1"
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              Use My Location
                            </Button>
                          </GoogleMapsScript>
                        </div>
                        <FormMessage />
                        
                        {/* Show map preview when coordinates are available */}
                        {form.watch('latitude') && form.watch('longitude') && (
                          <div className="mt-2">
                            <GoogleMapsScript>
                              <LocationPreview 
                                latitude={form.watch('latitude')} 
                                longitude={form.watch('longitude')}
                                height="250px"
                                interactive={true}
                                onLocationUpdate={(lat, lng, address) => {
                                  form.setValue('latitude', lat);
                                  form.setValue('longitude', lng);
                                  form.setValue('address', address);
                                  
                                  // If location name is empty, try to set it from the address
                                  if (!form.getValues('location')) {
                                    const addressParts = address.split(',');
                                    if (addressParts.length > 0) {
                                      form.setValue('location', addressParts[0].trim());
                                    }
                                  }
                                }}
                              />
                            </GoogleMapsScript>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($) <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="e.g. 25.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cost per session in USD
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
                        <FormLabel>Duration (min) <span className="text-destructive">*</span></FormLabel>
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
                          Length of each session in minutes
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
                          Maximum number of students
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal justify-start"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP p")
                                  ) : (
                                    <span>Select date and time</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-4 border-b">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    if (date && field.value) {
                                      // Preserve the time
                                      const newDate = new Date(date);
                                      newDate.setHours(
                                        field.value.getHours(),
                                        field.value.getMinutes()
                                      );
                                      field.onChange(newDate);
                                    }
                                  }}
                                  initialFocus
                                />
                              </div>
                              <div className="p-3 border-t">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">Time:</div>
                                  <select
                                    value={format(field.value, "HH:mm")}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(':');
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours), parseInt(minutes));
                                      field.onChange(newDate);
                                    }}
                                    className="border border-input bg-background px-3 py-1 rounded-md text-sm"
                                  >
                                    {timeSlots.map((slot) => (
                                      <option key={slot.value} value={slot.value}>
                                        {slot.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            When will your class start?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isRecurring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Recurring Class</FormLabel>
                            <FormDescription>
                              Is this a recurring class with regular schedule?
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
                  
                  {/* Show end date picker and schedule if isRecurring is true */}
                  {form.watch('isRecurring') && (
                    <>
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
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
                                      <span>Select end date</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < form.getValues('startDate')}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When will the recurring class end?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Weekly Schedule</h3>
                          <Button 
                            type="button" 
                            onClick={addNewSchedule} 
                            variant="outline"
                            size="sm"
                            className="flex items-center"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add Schedule
                          </Button>
                        </div>
                        
                        {fields.length === 0 ? (
                          <div className="text-center p-6 border rounded-md bg-muted/20">
                            <p className="text-muted-foreground mb-2">No schedules added yet</p>
                            <Button 
                              type="button" 
                              onClick={addNewSchedule} 
                              variant="secondary"
                              size="sm"
                            >
                              <Plus className="h-4 w-4 mr-1" /> Add a Schedule
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {fields.map((item, index) => (
                              <Card key={item.id} className="overflow-hidden">
                                <CardHeader className="p-4 pb-2">
                                  <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-medium">Schedule #{index + 1}</h4>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => remove(index)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Remove</span>
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <FormField
                                    control={form.control}
                                    name={`schedules.${index}.dayOfWeek`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Day of Week</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select day" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {daysOfWeek.map((day) => (
                                              <SelectItem key={day.value} value={day.value}>
                                                {day.label}
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
                                    name={`schedules.${index}.startTime`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Start Time</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select time" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {timeSlots.map((time) => (
                                              <SelectItem key={time.value} value={time.value}>
                                                {time.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-white"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Class"
                    )}
                  </Button>
                </div>
                </div> {/* Close the grid div */}
              </form>
            </Form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}