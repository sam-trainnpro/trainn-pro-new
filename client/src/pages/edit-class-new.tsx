import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "../../../hooks/use-auth-simple";
import { useToast } from "../../../hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import EditRecurringModal, { type EditOption } from "@/components/edit-recurring-modal";
import type { Class, ClassCategory } from "@shared/schema";

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
  classDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.coerce.number().positive("Duration must be positive"),
  whatToBring: z.string().optional().nullable(),
});

type EditClassFormValues = z.infer<typeof editClassSchema>;

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for image upload
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // State for recurring class edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<EditClassFormValues | null>(null);
  
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
      classDate: new Date(),
      startTime: "09:00",
      duration: 60,
      whatToBring: "",
    }
  });
  
  // Populate form when class data is loaded
  useEffect(() => {
    if (classData) {
      // Extract date and time information from existing class data
      const startDateTime = classData.startTime ? new Date(classData.startTime) : new Date();
      const endDateTime = classData.endTime ? new Date(classData.endTime) : new Date();
      
      // Extract date (just the date part)
      const classDate = new Date(startDateTime.getFullYear(), startDateTime.getMonth(), startDateTime.getDate());
      
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
        classDate: classDate,
        startTime: timeString,
        duration: duration > 0 ? duration : 60, // Default to 60 minutes if calculation fails
        whatToBring: classData.whatToBring || "",
      });
    }
  }, [classData, form]);
  
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
  
  // Helper function to process form data
  const processFormData = async (data: EditClassFormValues) => {
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
    
    // Format the data for the server
    return {
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
    };
  };

  // Edit single class mutation
  const editSingleClassMutation = useMutation({
    mutationFn: async (data: EditClassFormValues) => {
      const formattedData = await processFormData(data);
      const response = await apiRequest("PUT", `/api/classes/${id}`, formattedData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update class");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Class updated successfully",
      });
      
      // Invalidate and refetch class data to show updates immediately
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
    },
  });

  // Edit class series mutation
  const editSeriesMutation = useMutation({
    mutationFn: async (data: EditClassFormValues) => {
      const formattedData = await processFormData(data);
      const response = await apiRequest("PUT", `/api/classes/${id}/series`, formattedData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update class series");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Class series updated successfully",
      });
      
      // Invalidate and refetch class data to show updates immediately
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
    },
  });

  // Handle modal confirmation
  const handleEditConfirm = (option: EditOption) => {
    if (!pendingFormData) return;
    
    if (option === "this") {
      editSingleClassMutation.mutate(pendingFormData);
    } else {
      editSeriesMutation.mutate(pendingFormData);
    }
    
    setPendingFormData(null);
  };

  const onSubmit = (data: EditClassFormValues) => {
    // Check if this is a recurring class (has recurring_series_id)
    if (classData?.recurring_series_id) {
      // Show modal for recurring class
      setPendingFormData(data);
      setShowEditModal(true);
    } else {
      // Directly update single class
      editSingleClassMutation.mutate(data);
    }
  };

  if (isLoadingClass || isLoadingCategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (classError || !classData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Class Not Found</h1>
          <p className="text-gray-600 mb-4">The class you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/my-classes")}>Back to My Classes</Button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to edit this class.</p>
          <Button onClick={() => navigate("/classes")}>Browse Classes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Class</h1>
          <p className="text-gray-600">Update your class information</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Class Information</CardTitle>
            <CardDescription>
              Update the details for your class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Yoga" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your class a catchy, descriptive title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your class, what to expect, skill level, etc." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help students understand what your class is about
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Category and Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the type of fitness class
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
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          Set your class price in dollars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Capacity */}
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum number of students for this class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Location and Address */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Central Park, Downtown Gym" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name or description of where your class takes place
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
                          <Input placeholder="123 Main St, City, State ZIP" {...field} />
                        </FormControl>
                        <FormDescription>
                          Complete address for students to find your class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Class Image */}
                <div className="space-y-4">
                  <Label htmlFor="image">Class Image</Label>
                  
                  {/* Current Image Preview */}
                  {classData.image && !selectedImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Current image:</p>
                      <img 
                        src={classData.image} 
                        alt="Current class image" 
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          // If the image fails to load, use fallback
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
                        }}
                      />
                    </div>
                  )}
                  
                  {/* New Image Preview */}
                  {selectedImage && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">New image preview:</p>
                      <img 
                        src={URL.createObjectURL(selectedImage)} 
                        alt="New class image preview" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => setSelectedImage(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-gray-600">
                    Upload a photo that represents your class. Accepted formats: JPG, PNG, GIF
                  </p>
                </div>

                {/* Date and Time Section */}
                <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold">Schedule Details</h3>
                  
                  {/* Class Date */}
                  <FormField
                    control={form.control}
                    name="classDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Class Date</FormLabel>
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
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
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
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Select the date for your class
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Start Time and Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Start Time</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                              className="w-full"
                            />
                          </FormControl>
                          <FormDescription>
                            What time does your class start?
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
                          <FormLabel>Class Duration (minutes)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="75">1 hour 15 minutes</SelectItem>
                              <SelectItem value="90">1 hour 30 minutes</SelectItem>
                              <SelectItem value="105">1 hour 45 minutes</SelectItem>
                              <SelectItem value="120">2 hours</SelectItem>
                              <SelectItem value="150">2 hours 30 minutes</SelectItem>
                              <SelectItem value="180">3 hours</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            How long will your class last?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* What to Bring */}
                <FormField
                  control={form.control}
                  name="whatToBring"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What to Bring</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., water bottle, yoga mat, comfortable workout clothes, towel..."
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Let students know what items they should bring to your class
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4 flex justify-between">
                  <Button type="button" variant="outline" onClick={() => navigate("/my-classes")}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-white"
                    disabled={editSingleClassMutation.isPending || editSeriesMutation.isPending || uploadingImage}
                  >
                    {(editSingleClassMutation.isPending || editSeriesMutation.isPending || uploadingImage) ? (
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
          </CardContent>
        </Card>
      </main>
      
      <Footer />
      <MobileNavigation />

      {/* Edit Recurring Modal */}
      <EditRecurringModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setPendingFormData(null);
        }}
        onConfirm={handleEditConfirm}
        classTitle={classData?.title || ''}
      />
    </div>
  );
}