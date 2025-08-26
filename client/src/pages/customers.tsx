import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth-simple";
import Header from "@/components/layout/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, Clock, User, Phone, TrendingUp, Package } from "lucide-react";
import { format, addMonths } from "date-fns";

interface CustomerBooking {
  id: number;
  classDate: string | Date;
  classTime: string | Date;
  className: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  quantity: number;
  status: string;
  completedClasses: number;
  coachFirstName?: string;
  coachLastName?: string;
}

interface PackageBooking {
  id: number;
  purchaseDate: string | Date;
  expirationDate: string | Date;
  packageName: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  status: string;
  completedClasses: number;
  totalClasses: number;
  coachFirstName?: string;
  coachLastName?: string;
}

// Simple Badge component
const Badge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "secondary" | "success" | "destructive" }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    success: "bg-green-100 text-green-800",
    destructive: "bg-red-100 text-red-800"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("class-bookings");

  // Redirect if not coach or admin
  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only accessible to coaches and administrators.</p>
          </div>
        </div>
      </>
    );
  }

  const { data: customerBookings = [], isLoading, error } = useQuery<CustomerBooking[]>({
    queryKey: ['/api/customers'],
    enabled: !!(user && (user.role === 'coach' || user.role === 'admin')),
  });

  // TODO: Add actual API endpoint for package bookings
  const { data: packageBookings = [], isLoading: isLoadingPackages } = useQuery<PackageBooking[]>({
    queryKey: ['/api/package-bookings'],
    queryFn: async () => {
      // For now, return empty array until backend is implemented
      return [];
    },
    enabled: !!(user && (user.role === 'coach' || user.role === 'admin')),
  });

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-red-600">Failed to load customer data. Please try again.</p>
          </div>
        </div>
      </>
    );
  }

  // Calculate stats
  const totalCustomers = customerBookings.length;
  const uniqueCustomers = new Set(customerBookings.map((booking: CustomerBooking) => 
    booking.customerEmail
  )).size;
  
  // Count completed classes taught by coach (classes with at least 1 attendee that occurred in the past)
  const completedClassesSet = new Set();
  customerBookings.forEach((booking: CustomerBooking) => {
    const classDate = new Date(booking.classDate);
    if (classDate < new Date()) {
      completedClassesSet.add(booking.className + '_' + booking.classDate);
    }
  });
  const totalCompletedClasses = completedClassesSet.size;

  const formatDateTime = (dateTime: string | Date) => {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateTime: string | Date) => {
    if (!dateTime) return 'N/A';
    try {
      const date = new Date(dateTime);
      return format(date, 'h:mm a');
    } catch {
      return 'Invalid Time';
    }
  };

  // Calculate expiration date for set packs
  const calculateExpirationDate = (purchaseDate: string | Date, classCount: number) => {
    const purchase = new Date(purchaseDate);
    let months = 0;
    
    // Set pack expiration rules
    if (classCount === 5) months = 2;
    else if (classCount === 10) months = 3;
    else if (classCount === 20) months = 6;
    else months = 3; // Default
    
    return addMonths(purchase, months);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">
            {user.role === 'admin' 
              ? 'View all customer bookings and class attendance data'
              : 'View customers who have booked your classes'
            }
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Active customer bookings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground">
                Count of unique customers who have taken your class
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Classes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompletedClasses}</div>
              <p className="text-xs text-muted-foreground">
                Classes taught with attendees
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Customer Management */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="class-bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Class Bookings
            </TabsTrigger>
            <TabsTrigger value="package-bookings" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Package Bookings
            </TabsTrigger>
          </TabsList>

          {/* Class Bookings Tab */}
          <TabsContent value="class-bookings">
            <Card>
              <CardHeader>
                <CardTitle>Class Bookings</CardTitle>
                <CardDescription>
                  Overview of all customer bookings and class attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customerBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No class bookings found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Class bookings will appear here once classes are booked
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Class Date</TableHead>
                          <TableHead>Class Time</TableHead>
                          <TableHead>Class Name</TableHead>
                          {user.role === 'admin' && <TableHead>Coach</TableHead>}
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Spots</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed Classes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customerBookings.map((booking: CustomerBooking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {formatDateTime(booking.classDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                {formatTime(booking.classTime)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {booking.className}
                            </TableCell>
                            {user.role === 'admin' && (
                              <TableCell>
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  {booking.coachFirstName} {booking.coachLastName}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                {booking.customerFirstName} {booking.customerLastName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                {booking.customerPhone || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {booking.customerEmail}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="default" className="bg-purple-50 text-purple-700 border-purple-200">
                                {booking.quantity}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={booking.status === 'confirmed' ? 'success' : 'secondary'}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {booking.completedClasses || 0}
                              </Badge>
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

          {/* Package Bookings Tab */}
          <TabsContent value="package-bookings">
            <Card>
              <CardHeader>
                <CardTitle>Package Bookings</CardTitle>
                <CardDescription>
                  Overview of all customer package purchases and usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packageBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No package bookings found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Package bookings will appear here once packages are purchased
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Purchase Date</TableHead>
                          <TableHead>Expiration Date</TableHead>
                          <TableHead>Package Name</TableHead>
                          {user.role === 'admin' && <TableHead>Coach</TableHead>}
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Completed Classes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packageBookings.map((booking: PackageBooking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                {formatDateTime(booking.purchaseDate)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                {formatDateTime(booking.expirationDate)}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {booking.packageName}
                            </TableCell>
                            {user.role === 'admin' && (
                              <TableCell>
                                <div className="flex items-center">
                                  <User className="h-4 w-4 text-gray-400 mr-2" />
                                  {booking.coachFirstName} {booking.coachLastName}
                                </div>
                              </TableCell>
                            )}
                            <TableCell>
                              <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-2" />
                                {booking.customerFirstName} {booking.customerLastName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                {booking.customerPhone || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {booking.customerEmail}
                            </TableCell>
                            <TableCell>
                              <Badge variant={booking.status === 'active' ? 'success' : 'secondary'}>
                                {booking.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="default">
                                {booking.completedClasses}/{booking.totalClasses}
                              </Badge>
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
        </Tabs>
      </div>
    </>
  );
}