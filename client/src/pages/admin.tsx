import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { User, Class } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  User as UserIcon,
  Shield,
  MoreVertical,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  MapPin,
  Loader2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Helmet } from "react-helmet";

export default function AdminPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [coachSearch, setCoachSearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [actioningCoachId, setActioningCoachId] = useState<number | null>(null);
  
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
    isLoading: isLoadingUsers, 
    error: usersError,
    refetch: refetchUsers
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });
  
  // Get all classes
  const { 
    data: classes, 
    isLoading: isLoadingClasses, 
    error: classesError 
  } = useQuery<Class[]>({
    queryKey: ['/api/classes'],
  });
  
  // Approve coach mutation
  const approveCoachMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const response = await apiRequest("PUT", `/api/admin/coaches/${coachId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Coach approved",
        description: "The coach has been approved successfully",
      });
      refetchUsers();
      setActioningCoachId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message || "Could not approve coach. Please try again.",
        variant: "destructive",
      });
      setActioningCoachId(null);
    },
  });
  
  // Handle coach approval
  const handleApproveCoach = (coachId: number) => {
    setActioningCoachId(coachId);
    approveCoachMutation.mutate(coachId);
  };
  
  // Filter coaches based on search query
  const filteredCoaches = users?.filter(user => 
    user.role === "coach" && 
    (coachSearch === "" || 
     `${user.firstName} ${user.lastName}`.toLowerCase().includes(coachSearch.toLowerCase()) ||
     user.email.toLowerCase().includes(coachSearch.toLowerCase()))
  ) || [];
  
  // Get pending coaches
  const pendingCoaches = filteredCoaches.filter(coach => !coach.isApproved);
  
  // Filter classes based on search query
  const filteredClasses = classes?.filter(classItem =>
    classSearch === "" ||
    classItem.title.toLowerCase().includes(classSearch.toLowerCase()) ||
    classItem.location.toLowerCase().includes(classSearch.toLowerCase())
  ) || [];
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MM/dd/yyyy");
  };
  
  // Format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Admin Dashboard - Elevate Fitness</title>
        <meta name="description" content="Admin dashboard for managing Elevate fitness platform. Approve coaches, monitor classes, and manage platform operations." />
      </Helmet>
      
      <Header />
      
      <main className="flex-grow bg-[#F7F7F7] py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage coaches, classes and platform operations</p>
            </div>
            
            {pendingCoaches.length > 0 && (
              <Badge className="bg-amber-500 px-3 py-1 text-white">
                {pendingCoaches.length} Pending Approval{pendingCoaches.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <Tabs defaultValue="coaches">
            <TabsList className="mb-6">
              <TabsTrigger value="coaches">
                <UserIcon className="h-4 w-4 mr-2" />
                Coaches
              </TabsTrigger>
              <TabsTrigger value="classes">
                <Calendar className="h-4 w-4 mr-2" />
                Classes
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="coaches">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <CardTitle>Coaches Management</CardTitle>
                      <CardDescription>
                        Approve and manage coach accounts
                      </CardDescription>
                    </div>
                    
                    <div className="flex-1 md:max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search coaches..."
                          className="pl-10"
                          value={coachSearch}
                          onChange={(e) => setCoachSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {pendingCoaches.length > 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
                      <AlertTriangle className="text-amber-500 h-5 w-5 mr-2" />
                      <div>
                        <p className="font-medium text-amber-800">Coach Approval Required</p>
                        <p className="text-sm text-amber-700">
                          {pendingCoaches.length} coach{pendingCoaches.length !== 1 ? 'es' : ''} waiting for your approval
                        </p>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {isLoadingUsers ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : usersError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-destructive">Failed to load coaches</p>
                    </div>
                  ) : filteredCoaches.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Joined</TableHead>
                            <TableHead className="text-center"># Classes</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCoaches.map((coach) => (
                            <TableRow key={coach.id}>
                              <TableCell className="font-medium">
                                {coach.firstName} {coach.lastName}
                              </TableCell>
                              <TableCell>{coach.email}</TableCell>
                              <TableCell className="text-center">
                                {coach.isApproved ? (
                                  <Badge className="bg-green-500">Approved</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-amber-500 border-amber-500">
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {coach.createdAt ? formatDate(coach.createdAt.toString()) : "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {classes?.filter(c => c.coachId === coach.id).length || 0}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    {!coach.isApproved && (
                                      <DropdownMenuItem
                                        onClick={() => handleApproveCoach(coach.id)}
                                        disabled={actioningCoachId === coach.id}
                                        className="text-green-600 cursor-pointer"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Approve Coach
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="cursor-pointer">
                                      <UserIcon className="mr-2 h-4 w-4" />
                                      View Profile
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive cursor-pointer">
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Suspend Account
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No coaches found</p>
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
                      <CardTitle>Classes Management</CardTitle>
                      <CardDescription>
                        Monitor and manage all classes on the platform
                      </CardDescription>
                    </div>
                    
                    <div className="flex-1 md:max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          placeholder="Search classes..."
                          className="pl-10"
                          value={classSearch}
                          onChange={(e) => setClassSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingClasses ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : classesError ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                      <p className="text-destructive">Failed to load classes</p>
                    </div>
                  ) : filteredClasses.length > 0 ? (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Class Name</TableHead>
                            <TableHead>Coach</TableHead>
                            <TableHead>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                Location
                              </div>
                            </TableHead>
                            <TableHead>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Date/Time
                              </div>
                            </TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
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
                                  {coach ? `${coach.firstName} ${coach.lastName}` : `Coach #${classItem.coachId}`}
                                </TableCell>
                                <TableCell>{classItem.location}</TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <div>{formatDate(classItem.startTime)}</div>
                                    <div className="text-muted-foreground">
                                      {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  ${classItem.price.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem className="cursor-pointer">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        View Class
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="cursor-pointer">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        View Coach
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive cursor-pointer">
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Remove Class
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No classes found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
