import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth-simple";
import { Helmet } from "react-helmet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Badge component will be imported inline
import { Users, Calendar, Clock, User, Phone, TrendingUp } from "lucide-react";
import { format } from "date-fns";

interface CustomerBooking {
  id: number;
  classDate: string;
  classTime: string;
  className: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  quantity: number;
  status: string;
  completedClasses: number;
}

export default function CustomersPage() {
  const { user } = useAuth();

  // Redirect if not coach or admin
  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              This page is only accessible to coaches and administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { data: customers, isLoading, error } = useQuery({
    queryKey: ['/api/customers', user.id],
    enabled: !!user && (user.role === 'coach' || user.role === 'admin')
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Customers</CardTitle>
            <CardDescription>
              There was an error loading your customer data. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const customerBookings = customers || [];

  // Calculate summary statistics
  const totalBookings = customerBookings.length;
  const uniqueCustomers = new Set(customerBookings.map((booking: CustomerBooking) => 
    `${booking.customerFirstName} ${booking.customerLastName}`
  )).size;
  const totalCompletedClasses = customerBookings.reduce((sum: number, booking: CustomerBooking) => 
    sum + booking.completedClasses, 0
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Helmet>
        <title>My Customers - Trainn</title>
        <meta name="description" content="View and manage your fitness class customers and their booking history." />
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Customers</h1>
          <p className="text-muted-foreground">
            View customers who have booked your fitness classes
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              All-time customer bookings
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
            <CardTitle className="text-sm font-medium">Classes Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletedClasses}</div>
            <p className="text-xs text-muted-foreground">
              Total completed sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Bookings</CardTitle>
          <CardDescription>
            Detailed view of all customers who have booked your classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customerBookings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No customers yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                When customers book your classes, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Time
                      </div>
                    </TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Customer Name
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4" />
                        Phone
                      </div>
                    </TableHead>
                    <TableHead className="text-center">Completed Classes</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerBookings.map((booking: CustomerBooking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        {format(new Date(booking.classDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(`2000-01-01T${booking.classTime}`), 'h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.className}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {booking.customerFirstName} {booking.customerLastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {booking.customerPhone || 'Not provided'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {booking.completedClasses}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
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