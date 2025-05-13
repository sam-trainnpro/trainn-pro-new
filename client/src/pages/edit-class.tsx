import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Class, ClassCategory } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Helmet } from "react-helmet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  price: z.coerce.number().positive("Price must be positive"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
  location: z.string().min(3, "Location is required"),
  address: z.string().min(5, "Address is required"),
  image: z.string().url("Must be a valid URL").optional().nullable(),
  startTime: z.date().optional().nullable(),
  endTime: z.date().optional().nullable(),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
      startTime: null,
      endTime: null,
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
      
      form.reset({
        title: classData.title,
        description: classData.description,
        categoryId: classData.categoryId,
        price: classData.price,
        capacity: classData.capacity,
        location: classData.location,
        address: classData.address || "",
        image: classData.image,
        startTime,
        endTime,
      });
    }
  }, [classData, form]);
  
  // Check if user is authorized to edit this class
  const isAuthorized = user && classData && (user.id === classData.coachId || user.role === 'admin');
  
  // State for recurring class series
  const [isRecurringSeries, setIsRecurringSeries] = useState(false);
  const [updateSeries, setUpdateSeries] = useState(false);
  
  // Edit class mutation
  const editMutation = useMutation({
    mutationFn: async (data: EditClassFormValues) => {
      if (!id) throw new Error("Class ID is missing");
      
      // Log the received dates for debugging
      console.log('Form submission data (dates):', {
        startTime: data.startTime,
        endTime: data.endTime
      });
      
      // Format the dates properly, ensuring they are in UTC for storage
      const formattedData = {
        ...data,
        startTime: data.startTime ? data.startTime.toISOString() : null,
        endTime: data.endTime ? data.endTime.toISOString() : null,
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
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/classes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/coaches', user?.id, 'classes'] });
      
      // Navigate back to my classes page
      navigate("/my-classes");
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
        <title>Edit Class - Elevate</title>
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
              {/* Class Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter class title" {...field} />
                    </FormControl>
                    <FormDescription>
                      A descriptive title for your class
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Class Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what participants will learn and experience in your class"
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide details about your class, what to expect, and what to bring
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
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                      value={field.value.toString()}
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
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best fits your class
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Price and Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Cost per person
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
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          min="1" 
                          placeholder="10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of participants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Location and Address */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input className="pl-10" placeholder="e.g., Central Park, XYZ Gym" {...field} />
                      </div>
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full address" {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide the full address for participants
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Image URL */}
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Provide a URL to an image that represents your class
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
              
              <div className="pt-4 flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate("/my-classes")}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-white"
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
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