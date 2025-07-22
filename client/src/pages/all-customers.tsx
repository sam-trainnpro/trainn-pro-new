import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/use-auth-simple";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";

interface CustomerBooking {
  id: number;
  className: string;
  classDate: string;
  startTime: string;
  coachName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  spots: number;
  completedClassesCount: number;
  status: string;
}

export default function AllCustomersPage() {
  const { user } = useAuth();

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, []);

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [user]);

  const { data: customerBookings, isLoading, error } = useQuery({
    queryKey: ['/api/admin/all-customers'],
    enabled: user?.role === 'admin',
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(`2000-01-01T${timeString}`);
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>All Customers - Trainn Admin</title>
        <meta name="description" content="Admin view of all customer bookings and activity on Trainn platform" />
      </Helmet>

      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Users className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">All Customers</h1>
        </div>
        <p className="text-gray-600">View all customer bookings and activity across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Customer Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p>Failed to load customer data. Please try again.</p>
            </div>
          ) : !customerBookings || customerBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No customer bookings found</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Coach</TableHead>
                    <TableHead>Class Name</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-center">Spots</TableHead>
                    <TableHead className="text-center">Completed Classes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerBookings.map((booking: CustomerBooking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{formatDate(booking.classDate)}</div>
                          <div className="text-sm text-gray-500">{formatTime(booking.startTime)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{booking.coachName}</TableCell>
                      <TableCell className="font-medium">{booking.className}</TableCell>
                      <TableCell>{booking.customerName}</TableCell>
                      <TableCell className="text-sm">{booking.customerEmail}</TableCell>
                      <TableCell className="text-sm">{booking.customerPhone || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {booking.spots}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {booking.completedClassesCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={
                            booking.status === 'confirmed' 
                              ? "bg-green-100 text-green-800 border-green-200"
                              : booking.status === 'cancelled'
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }
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