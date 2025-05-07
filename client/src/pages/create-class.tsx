import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { ClassCategory } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation as useUserLocation } from "@/hooks/use-location";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon, Lock, AlertCircle } from "lucide-react";
import { format, addHours } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";

// Form schema with validation
const createClassSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.coerce.number({
    required_error: "Please select a category",
    invalid_type_error: "Please select a valid category",
  }),
  price: z.coerce.number().positive("Price must be a positive number"),
  capacity: z.coerce.number().int().positive("Capacity must be a positive integer"),
  location: z.string().min(3, "Location name is required"),
  address: z.string().min(5, "Full address is required"),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  startTime: z.date({
    required_error: "Start time is required",
    invalid_type_error: "Start time must be a date",
  }),
  endTime: z.date({
    required_error: "End time is required",
    invalid_type_error: "End time must be a date",
  }),
  image: z.string().optional(),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

export default function CreateClassPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { latitude, longitude, getUserLocation } = useUserLocation();
  const [submitting, setSubmitting] = useState(false);
  
  // Redirect if not logged in or not a coach
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  if (user.role !== "coach") {
    navigate("/");
    return null;
  }
  
  if (!user.isApproved) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="container mx-auto px-4 py-12 text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Approval Pending</h1>
            <p className="text-muted-foreground mb-6">
              Your coach account is waiting for admin approval. You'll be able to create classes once approved.
            </p>
            <Button asChild>
              <a href="/">Return to Home</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Get categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });
  
  // Create a class mutation
  const createClassMutation = useMutation({
    mutationFn: async (data: CreateClassFormValues) => {
      const response = await apiRequest("POST", "/api/classes", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/coaches/${user.id}/classes`] });
      
      toast({
        title: "Class created successfully",
        description: "Your class has been created and is now visible to customers",
      });
      
      // Redirect to classes list
      navigate("/classes");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create class",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  });
  
  // Set up form with validation
  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: undefined,
      price: undefined,
      capacity: 10,
      location: "",
      address: "",
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      startTime: new Date(new Date().setHours(new Date().getHours() + 24, 0, 0, 0)), // Tomorrow at current hour
      endTime: new Date(new Date().setHours(new Date().getHours() + 25, 0, 0, 0)),   // Tomorrow at current hour + 1
      image: "",
    },
  });
  
  // Update coordinates when user requests location
  const handleGetLocation = async () => {
    await getUserLocation();
    if (latitude && longitude) {
      form.setValue("latitude", latitude);
      form.setValue("longitude", longitude);
      toast({
        title: "Location updated",
        description: "Your current coordinates have been added to the class",
      });
    }
  };
  
  // Submit handler
  async function onSubmit(data: CreateClassFormValues) {
    setSubmitting(true);
    
    // Ensure end time is after start time
    if (data.endTime <= data.startTime) {
      form.setError("endTime", {
        type: "manual",
        message: "End time must be after start time",
      });
      setSubmitting(false);
      return;
    }
    
    await createClassMutation.mutateAsync(data);
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Create a Class - Elevate Fitness</title>
        <meta name="description" content="Create a new fitness class as a coach on Elevate. Set details, pricing, capacity, and more for your fitness sessions." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-6">Create a New Class</h1>
          
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl mx-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Intense HIIT Workout" {...field} />
                      </FormControl>
                      <FormDescription>
                        A catchy title that describes your class
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
                          placeholder="Describe what participants can expect from your class..." 
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include details about the class format, intensity, equipment needed, etc.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingCategories ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span>Loading categories...</span>
                              </div>
                            ) : categories && categories.length > 0 ? (
                              categories.map((category) => (
                                <SelectItem 
                                  key={category.id} 
                                  value={category.id.toString()}
                                >
                                  {category.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                No categories available
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" step="0.01" placeholder="e.g. 25" {...field} />
                        </FormControl>
                        <FormDescription>
                          Price per participant in USD
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="e.g. 10" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum number of participants
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Central Park, FitZone Gym" {...field} />
                        </FormControl>
                        <FormDescription>
                          Name of the venue or area
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
                        <FormLabel>Full Address</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 123 Main St, New York, NY 10001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Detailed address for participants
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            placeholder="e.g. 40.7128" 
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <div className="flex justify-between">
                          <FormDescription>
                            GPS coordinate (optional)
                          </FormDescription>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            onClick={handleGetLocation}
                            className="h-7 text-xs"
                          >
                            Use Current Location
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="any" 
                            placeholder="e.g. -74.0060" 
                            {...field}
                            value={field.value || ""}
                            onChange={e => field.onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          GPS coordinate (optional)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
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
                                  if (date) {
                                    // Preserve the time
                                    const newDate = new Date(date);
                                    newDate.setHours(
                                      field.value.getHours(),
                                      field.value.getMinutes()
                                    );
                                    field.onChange(newDate);
                                    
                                    // Also update end time to maintain duration
                                    const currentDuration = form.getValues("endTime").getTime() - field.value.getTime();
                                    const newEndTime = new Date(newDate.getTime() + currentDuration);
                                    form.setValue("endTime", newEndTime);
                                  }
                                }}
                                disabled={(date) => date < new Date()}
                              />
                            </div>
                            <div className="p-4 border-t flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">Time</div>
                                <div className="flex items-center mt-2">
                                  <Input
                                    type="time"
                                    value={format(field.value, "HH:mm")}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours), parseInt(minutes));
                                      field.onChange(newDate);
                                      
                                      // Also update end time to maintain duration
                                      const currentDuration = form.getValues("endTime").getTime() - field.value.getTime();
                                      const newEndTime = new Date(newDate.getTime() + currentDuration);
                                      form.setValue("endTime", newEndTime);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the class will begin
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date & Time</FormLabel>
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
                                  if (date) {
                                    // Preserve the time
                                    const newDate = new Date(date);
                                    newDate.setHours(
                                      field.value.getHours(),
                                      field.value.getMinutes()
                                    );
                                    field.onChange(newDate);
                                  }
                                }}
                                disabled={(date) => date < form.getValues("startTime")}
                              />
                            </div>
                            <div className="p-4 border-t flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">Time</div>
                                <div className="flex items-center mt-2">
                                  <Input
                                    type="time"
                                    value={format(field.value, "HH:mm")}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(":");
                                      const newDate = new Date(field.value);
                                      newDate.setHours(parseInt(hours), parseInt(minutes));
                                      field.onChange(newDate);
                                    }}
                                    className="w-full"
                                  />
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          When the class will end
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to an image that represents your class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
              </form>
            </Form>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
