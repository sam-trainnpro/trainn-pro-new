import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Class, ClassCategory } from "@shared/schema";
import { useAuth } from "../../../hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
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
import { Switch } from "@/components/ui/switch";
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
  image: z.string().optional().nullable(),
  ageGroup: z.enum(['Adults', 'Kids']).default('Adults'),
  classDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.coerce.number().positive("Duration must be positive"),
  whatToBring: z.string().optional(),
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
      capacity: 0,
      location: "",
      address: "",
      image: "",
      ageGroup: "Adults",
      classDate: new Date(),
      startTime: "09:00",
      duration: 60,
      whatToBring: "",
    }
  });
  
  // Populate form when class data is loaded
  useEffect(() => {
    if (classData) {
      // Use Pacific Time Zone for all class times
      const timeZone = 'America/Los_Angeles';
      
      // Convert UTC times to Pacific Time for editing
      const startTime = classData.startTime ? new Date(classData.startTime) : null;
      const endTime = classData.endTime ? new Date(classData.endTime) : null;
      
      // Log the times for debugging
      console.log('Original startTime (UTC):', startTime);
      
      // Initialize recurring series state
      setIsRecurringSeries(classData.isRecurring || false);
      
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
        image: classData.image || "",
        ageGroup: (classData.ageGroup as "Adults" | "Kids") || "Adults",
        classDate: classDate,
        startTime: timeString,
        duration: duration > 0 ? duration : 60, // Default to 60 minutes if calculation fails
        whatToBring: classData.whatToBring || "",
      });
    }
  }, [classData, form]);
  
  // Check if user is authorized to edit this class
  const isAuthorized = user && classData && (user.id === classData.coachId || user.role === 'admin');
  
  // State for recurring class series
  const [isRecurringSeries, setIsRecurringSeries] = useState(false);
  const [updateSeries, setUpdateSeries] = useState(false);
  
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
    mutationFn: async (data: EditClassFormValues) => {
      if (!id) throw new Error("Class ID is missing");
      
      let imageUrl = data.image;
      
      // Upload new image if one was selected
      if (selectedImage) {
        setUploadingImage(true);
        try {
          imageUrl = await uploadImage(selectedImage);
        } finally {
          setUploadingImage(false);
        }
      }
      
      // Convert the new date/time format back to startTime and endTime
      const [hours, minutes] = data.startTime.split(':').map(Number);
      
      // Create start time by combining class date with start time
      const startTime = new Date(data.classDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      // Create end time by adding duration to start time
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + data.duration);
      
      // Log the calculated dates for debugging
      console.log('Form submission data (dates):', {
        classDate: data.classDate,
        startTime: data.startTime,
        duration: data.duration,
        calculatedStartTime: startTime.toISOString(),
        calculatedEndTime: endTime.toISOString()
      });
      
      // Format the data for the server
      const formattedData = {
        title: data.title,
        description: data.description,
        categoryId: data.categoryId,
        price: data.price,
        capacity: data.capacity,
        location: data.location,
        address: data.address,
        image: imageUrl,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        whatToBring: data.whatToBring,
        ageGroup: data.ageGroup,
      };
      
      console.log('Formatted data sent to server:', formattedData);
      
      // Determine if we need to update the entire series or just this instance
      const endpoint = updateSeries && classData?.isRecurring 
        ? `/api/classes/${id}/series` 
        : `/api/classes/${id}`;
      
      const response = await apiRequest("PUT", endpoint, formattedData);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if this is a recurring class error
        if (errorData.isRecurring) {
          setIsRecurringSeries(true);
          throw new Error(errorData.message);
        }
        
        throw new Error(errorData.message || "Failed to update class");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Class updated",
        description: "Your class has been updated successfully",
      });
      
      // Invalidate queries to refresh the data and show updates immediately
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/coaches/${user?.id}/classes`] });
      
      // Clear selected image after successful update
      setSelectedImage(null);
      
      // Navigate to My Calendar page to show updated class
      navigate("/my-calendar");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: EditClassFormValues) => {
    editMutation.mutate(data);
  };
  
  // If not authorized, show error
  if (classData && !isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-xl font-bold text-red-600 mb-2">Not Authorized</h2>
            <p className="mb-4">You don't have permission to edit this class.</p>
            <Link href="/my-classes">
              <Button variant="outline">Back to My Classes</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }
  
  // Handle loading state
  if (isLoadingClass) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }
  
  // Handle error state
  if (classError || !classData) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="mb-4">Failed to load class details. The class may no longer exist.</p>
            <Link href="/my-classes">
              <Button variant="outline">Back to My Classes</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }
  
  // Parent classes with recurring schedules cannot be edited with this form
  // as it's more complex to update all the instances
  if (classData.isRecurring) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center p-8 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-bold text-blue-600 mb-2">Recurring Class Series</h2>
            <p className="mb-4">
              Editing a recurring class series is not supported in this version. 
              You can edit individual sessions of this series.
            </p>
            <Link href="/my-classes">
              <Button variant="outline">Back to My Classes</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Edit Class - Trainn</title>
        <meta name="description" content="Edit your class details, schedule, pricing, and more." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/my-classes" className="inline-flex items-center text-primary hover:text-primary/80">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to My Classes
          </Link>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold font-heading mb-6">Edit Class</h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
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
                  </div>

                </div>
              </div>
              
              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            value={field.value ? format(field.value, "HH:mm") : ""}
                            onChange={(e) => {
                              const timeStr = e.target.value;
                              if (timeStr && field.value) {
                                const [hours, minutes] = timeStr.split(':').map(Number);
                                const newDate = new Date(field.value);
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                              }
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select when your class starts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Pick a date and time</span>
                            )}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                        <div className="p-3 border-t border-border">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border rounded-md text-sm"
                            value={field.value ? format(field.value, "HH:mm") : ""}
                            onChange={(e) => {
                              const timeStr = e.target.value;
                              if (timeStr && field.value) {
                                const [hours, minutes] = timeStr.split(':').map(Number);
                                const newDate = new Date(field.value);
                                newDate.setHours(hours, minutes);
                                field.onChange(newDate);
                              }
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select when your class ends
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Add recurring series update option if applicable */}
              {isRecurringSeries && (
                <div className="pt-4 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h3 className="text-sm font-medium text-amber-800 mb-2">
                    This is part of a recurring class series
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="update-series"
                      checked={updateSeries}
                      onCheckedChange={setUpdateSeries}
                    />
                    <Label htmlFor="update-series" className="text-sm text-amber-700">
                      {updateSeries 
                        ? "Update entire series (all future classes)" 
                        : "Update only this class instance"}
                    </Label>
                  </div>
                  <p className="text-xs text-amber-600 mt-2">
                    {updateSeries 
                      ? "Your changes will apply to all classes in this series." 
                      : "Your changes will only apply to this specific class."}
                  </p>
                </div>
              )}
              
              {/* What to Bring */}
              <FormField
                control={form.control}
                name="whatToBring"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What to Bring</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., water bottle, yoga mat, comfortable clothes, etc."
                        className="min-h-20"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Let participants know what they should bring to the class
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else {
                    navigate("/my-classes");
                  }
                }}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white"
                  disabled={editMutation.isPending || uploadingImage}
                >
                  {(editMutation.isPending || uploadingImage) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploadingImage ? "Uploading image..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}