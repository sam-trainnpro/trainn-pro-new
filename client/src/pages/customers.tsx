import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth-simple";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, Clock, User, Phone, TrendingUp } from "lucide-react";
import { format } from "date-fns";

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

  // Redirect if not coach or admin
  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">This page is only accessible to coaches and administrators.</p>
        </div>
      </div>
    );
  }

  const { data: customerBookings = [], isLoading, error } = useQuery<CustomerBooking[]>({
    queryKey: ['/api/customers'],
    enabled: !!(user && (user.role === 'coach' || user.role === 'admin')),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600">Failed to load customer data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCustomers = customerBookings.length;
  const uniqueCustomers = new Set(customerBookings.map((booking: CustomerBooking) => 
    `${booking.customerFirstName} ${booking.customerLastName}`
  )).size;
  
  const totalCompletedClasses = customerBookings.reduce((sum: number, booking: CustomerBooking) => 
    sum + (booking.completedClasses || 0), 0
  );

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

  return (
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
              Individual customers served
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
              Total classes completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Bookings</CardTitle>
          <CardDescription>
            Overview of all customer bookings and class attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerBookings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No customer bookings found</p>
              <p className="text-sm text-gray-500 mt-1">
                Customer bookings will appear here once classes are booked
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
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
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
    </div>
  );
}