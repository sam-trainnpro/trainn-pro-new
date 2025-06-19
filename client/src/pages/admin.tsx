import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSafeAuth } from "../../../hooks/use-auth-safe";
import { useLocation } from "wouter";
import { User, Class, ClassWithSchedules } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Helmet } from "react-helmet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  UserIcon,
  Shield,
  Search,
  AlertTriangle,
  Loader2,
  Lock,
  CheckCircle,
  BookOpen,
  Edit,
  Trash2,
} from "lucide-react";
import { useToast } from "../../../hooks/use-toast";
import { format } from "date-fns";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user } = useSafeAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [classSearchQuery, setClassSearchQuery] = useState("");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassWithSchedules | null>(null);
  const [activeTab, setActiveTab] = useState("coaches");

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab === 'classes') {
      setActiveTab('classes');
    }
  }, []);
  
  // Redirect if not logged in or not an admin
  if (!user) {
    navigate("/auth");
    return null;
  }
  
  if (user.role !== "admin") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="container mx-auto px-4 py-12 text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin panel.
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
  
  // Get all users
  const { 
    data: users, 
    isLoading, 
    error,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Get all classes for admin management
  const { 
    data: classes, 
    isLoading: classesLoading, 
    error: classesError,
    refetch: refetchClasses
  } = useQuery<ClassWithSchedules[]>({
    queryKey: ['/api/classes'],
  });
  
  // Approve coach mutation
  const approveCoachMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const response = await apiRequest("PUT", `/api/admin/coaches/${coachId}/approve`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Coach approved",
        description: `${data.firstName} ${data.lastName} has been approved and can now create classes.`,
      });
      refetchUsers();
      setApprovalDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve coach. Please try again.",
        variant: "destructive",
      });
      setApprovalDialogOpen(false);
    },
  });

  // Delete class mutation
  const deleteClassMutation = useMutation({
    mutationFn: async (classId: number) => {
      const response = await apiRequest("DELETE", `/api/classes/${classId}`, {});
      // DELETE returns 204 with no content, so don't try to parse JSON
      return response.ok;
    },
    onSuccess: () => {
      toast({
        title: "Class deleted",
        description: "The class has been successfully deleted.",
      });
      refetchClasses();
      queryClient.invalidateQueries({ queryKey: ['/api/classes'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class. Please try again.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });
  
  // Handle coach approval
  const handleApproveCoach = () => {
    if (selectedCoach) {
      approveCoachMutation.mutate(selectedCoach.id);
    }
  };
  
  // Handle class deletion
  const handleDeleteClass = () => {
    if (selectedClass) {
      deleteClassMutation.mutate(selectedClass.id);
    }
  };
  
  // Open approval dialog
  const openApprovalDialog = (coach: User) => {
    setSelectedCoach(coach);
    setApprovalDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (classItem: ClassWithSchedules) => {
    setSelectedClass(classItem);
    setDeleteDialogOpen(true);
  };

  // Handle edit class
  const handleEditClass = (classItem: ClassWithSchedules) => {
    navigate(`/create-class?id=${classItem.id}`);
  };
  
  // Filter coaches based on search query
  const filteredCoaches = users?.filter(user => 
    user.role === "coach" && 
    (searchQuery === "" || 
     `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
     user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];
  
  // Filter classes based on search query
  const filteredClasses = classes?.filter(classItem => 
    classSearchQuery === "" || 
    classItem.title.toLowerCase().includes(classSearchQuery.toLowerCase()) ||
    classItem.location.toLowerCase().includes(classSearchQuery.toLowerCase())
  ) || [];
  
  // Get pending coaches count
  const pendingCoachesCount = filteredCoaches.filter(coach => !coach.isApproved).length;
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MMM d, yyyy");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Admin Dashboard - Trainn Fitness</title>
        <meta name="description" content="Manage coach approvals and monitor platform activity in the admin dashboard." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              {pendingCoachesCount > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                  {pendingCoachesCount} Coach{pendingCoachesCount !== 1 ? 'es' : ''} Pending Approval
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">Manage coach approvals and monitor platform activity</p>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="coaches">
                <UserIcon className="h-4 w-4 mr-2" />
                Coaches
              </TabsTrigger>
              <TabsTrigger value="classes">
                <BookOpen className="h-4 w-4 mr-2" />
                Class Management
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Shield className="h-4 w-4 mr-2" />
                Platform Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="coaches">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <CardTitle>Coach Management</CardTitle>
                      <CardDescription>
                        Approve coaches and manage their accounts
                      </CardDescription>
                    </div>
                    
                    <div className="flex-1 md:max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search coaches..."
                          className="pl-10"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-destructive">
                      <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                      <p>Failed to load coaches. Please try again.</p>
                    </div>
                  ) : filteredCoaches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No coaches found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCoaches.map((coach) => (
                            <TableRow key={coach.id}>
                              <TableCell className="font-medium">
                                {coach.firstName} {coach.lastName}
                              </TableCell>
                              <TableCell>{coach.email}</TableCell>
                              <TableCell>
                                {coach.isApproved ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                                    Pending Approval
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(coach.createdAt?.toString() || '')}</TableCell>
                              <TableCell className="text-right">
                                {!coach.isApproved && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openApprovalDialog(coach)}
                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="classes">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <CardTitle>Class Management</CardTitle>
                      <CardDescription>
                        View, edit, and delete classes created by coaches
                      </CardDescription>
                    </div>
                    
                    <div className="flex-1 md:max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search classes..."
                          className="pl-10"
                          value={classSearchQuery}
                          onChange={(e) => setClassSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {classesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : classesError ? (
                    <div className="text-center py-8 text-destructive">
                      <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                      <p>Failed to load classes. Please try again.</p>
                    </div>
                  ) : filteredClasses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No classes found</p>
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Class Title</TableHead>
                            <TableHead>Coach</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredClasses.map((classItem) => {
                            const coach = users?.find(u => u.id === classItem.coachId);
                            return (
                              <TableRow key={classItem.id}>
                                <TableCell className="font-medium">
                                  {classItem.title}
                                </TableCell>
                                <TableCell>
                                  {coach ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach'}
                                </TableCell>
                                <TableCell>{classItem.location}</TableCell>
                                <TableCell>${classItem.price}</TableCell>
                                <TableCell>
                                  {formatDate(classItem.createdAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditClass(classItem)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDeleteDialog(classItem)}
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>
                    Configure platform-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-6">
                    Platform settings coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
      
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Coach</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCoach && (
                <>
                  Are you sure you want to approve <span className="font-medium">{selectedCoach.firstName} {selectedCoach.lastName}</span> as a coach?
                  Once approved, they will be able to create classes and be visible to customers.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApproveCoach}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Approve Coach
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedClass && (
                <>
                  Are you sure you want to delete <span className="font-medium">"{selectedClass.title}"</span>?
                  This action cannot be undone and will also cancel any existing bookings for this class.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteClass}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteClassMutation.isPending}
            >
              {deleteClassMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Class'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}