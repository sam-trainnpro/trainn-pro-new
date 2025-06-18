import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Class, ClassCategory } from "@shared/schema";
import { useAuth } from "../../../hooks/use-auth-simple";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import ClassCard from "@/components/class/class-card";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Loader2, Edit, Trash2, Plus } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "../../../hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function MyClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch classes created by this coach
  const { 
    data: classes, 
    isLoading, 
    error,
    refetch 
  } = useQuery<Class[]>({
    queryKey: ['/api/coaches', user?.id, 'classes'],
    queryFn: async ({ queryKey }) => {
      const response = await fetch(`/api/coaches/${queryKey[1]}/classes`);
      if (!response.ok) {
        throw new Error('Failed to fetch your classes');
      }
      return response.json();
    },
    enabled: !!user && user.role === 'coach',
  });
  
  // Group classes by parent (recurring classes together)
  const groupedClasses = classes ? classes.reduce<Record<string, Class[]>>((acc, classItem) => {
    // Use parentClassId if available, otherwise use the class's own id
    const groupId = classItem.parentClassId || classItem.id;
    
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    
    acc[groupId].push(classItem);
    return acc;
  }, {}) : {};
  
  // Extract parent classes for display (the first class in each group)
  const parentClasses = Object.values(groupedClasses).map(group => {
    // Find the parent class (the one with isRecurring=true) or use the first one
    return group.find(c => c.isRecurring) || group[0];
  });
  
  // Mutation to delete a class
  const deleteMutation = useMutation({
    mutationFn: async (classId: number) => {
      // Just directly send the delete request to the backend
      // The backend logic already handles deleting entire series
      const response = await apiRequest("DELETE", `/api/classes/${classId}`);
      if (!response.ok) {
        throw new Error('Failed to delete class');
      }
      
      return classId;
    },
    onSuccess: (_, classId) => {
      // Find the class that was deleted
      const deletedClass = classes?.find(c => c.id === classId);
      
      // Check if it's a child class that triggered a parent deletion
      const isPartOfSeries = deletedClass?.parentClassId != null;
      const isRecurringSeries = deletedClass?.isRecurring ?? false;
      
      // For the toast message, consider both actual recurring series and child classes
      // that triggered parent deletions as "series deletions"
      const isSeriesDeletion = isRecurringSeries || isPartOfSeries;
      
      toast({
        title: isSeriesDeletion ? "Class series deleted" : "Class deleted",
        description: isSeriesDeletion
          ? "Your class series and all its sessions have been deleted successfully" 
          : "Your class has been deleted successfully",
      });
      
      // Invalidate queries to refresh the class list
      queryClient.invalidateQueries({ queryKey: ['/api/coaches', user?.id, 'classes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      
      // Force immediate refetch to update the UI
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Function to determine if a class is a one-time class or a recurring series
  const getClassType = (classItem: Class) => {
    if (classItem.isRecurring) {
      return <Badge className="bg-blue-500">Recurring Series</Badge>;
    } else if (classItem.parentClassId) {
      return <Badge className="bg-green-500">Session in Series</Badge>;
    } else {
      return <Badge>One-time Class</Badge>;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>My Classes - Trainn</title>
        <meta name="description" content="Manage your fitness classes. View, edit, or create new classes." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold font-heading">My Classes</h1>
          <Link href="/create-class">
            <Button className="bg-primary text-white">
              <Plus className="mr-2 h-4 w-4" />
              Create New Class
            </Button>
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-red-50 rounded-lg">
            <p className="text-red-600">Error loading your classes. Please try again.</p>
          </div>
        ) : parentClasses.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">You haven't created any classes yet</h3>
            <p className="text-gray-600 mb-4">Create your first class to start sharing your expertise with others</p>
            <Link href="/create-class">
              <Button className="bg-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Class
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parentClasses.map(classItem => (
              <Card key={classItem.id} className="overflow-hidden">
                <div className="h-40 overflow-hidden">
                  <img 
                    src={classItem.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb"}
                    alt={classItem.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-heading">{classItem.title}</CardTitle>
                      <CardDescription className="mt-1">${classItem.price.toFixed(2)} per session</CardDescription>
                    </div>
                    <div>
                      {getClassType(classItem)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 truncate">{classItem.description}</p>
                  
                  {classItem.isRecurring && (
                    <div className="mt-2">
                      <p className="text-sm font-medium">Sessions in this series: {groupedClasses[classItem.id]?.length || 1}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={`/classes/${classItem.id}`}>
                    <Button variant="outline">View Details</Button>
                  </Link>
                  <div className="flex space-x-2">
                    <Link href={`/edit-class/${classItem.id}`}>
                      <Button variant="outline" className="px-3">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={(classItem.isRecurring || classItem.parentClassId)
                            ? "px-3 text-red-700 border-red-300 hover:bg-red-50 hover:text-red-800 font-medium"
                            : "px-3 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                          {(classItem.isRecurring || classItem.parentClassId) && (
                            <span className="ml-1 text-xs">All</span>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {classItem.isRecurring 
                              ? "This will permanently delete this entire recurring class series and all of its sessions."
                              : classItem.parentClassId
                                ? "This will permanently delete this entire recurring class series and all of its sessions, not just this individual session."
                                : "This will permanently delete this class."
                            } 
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className={classItem.isRecurring 
                              ? "bg-red-700 text-white hover:bg-red-800 font-medium" 
                              : "bg-red-600 text-white hover:bg-red-700"}
                            onClick={() => deleteMutation.mutate(classItem.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : classItem.isRecurring || classItem.parentClassId
                                ? "Delete Entire Series" 
                                : "Delete Class"
                            }
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
      <MobileNavigation />
    </div>
  );
}