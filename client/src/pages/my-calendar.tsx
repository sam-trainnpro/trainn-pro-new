import { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/use-auth-simple';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { Link, useLocation } from 'wouter';
import ClassDetailModal from '@/components/class-detail-modal';
import { DeleteRecurringModal, DeleteOption } from '@/components/delete-recurring-modal';
import BookingWarningModal from '@/components/booking-warning-modal';
import { useToast } from '../../../hooks/use-toast';

interface Class {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  price: number;
  image?: string;
  categoryId: number;
  coachId: number;
  isRecurring: boolean;
  parentClassId?: number;
  recurringSeriesId?: string;
  maxParticipants?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  whatToBring?: string;
  createdAt?: string;
}

interface BookingCounts {
  total: number;
  active: number;
  totalSpotsBooked: number;
}

interface ClassWithBookings extends Class {
  totalBookings?: number;
  activeBookings?: number;
}

export default function MyCalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [showBookingWarningModal, setShowBookingWarningModal] = useState(false);
  const [pendingDeleteClass, setPendingDeleteClass] = useState<Class | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Redirect if not a coach
  if (!user || user.role !== 'coach') {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only accessible to coaches.</p>
          </div>
        </div>
      </>
    );
  }

  // Fetch coach's classes
  const { data: classes = [], isLoading, refetch } = useQuery<Class[]>({
    queryKey: [`/api/coaches/${user.id}/classes`],
    enabled: !!user?.id,
  });

  const handleClassClick = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsModalOpen(true);
  };

  const handleDuplicate = async (classId: number) => {
    try {
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const classData = await response.json();
        // Navigate to create class page with the class data for duplication
        setLocation('/create-class', { 
          state: { 
            duplicateData: classData,
            isDuplicating: true
          } 
        });
      } else {
        throw new Error('Failed to fetch class data');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load class data for duplication. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = (classItem: Class) => {
    console.log('handleDelete called with:', classItem);
    console.log('recurringSeriesId:', classItem.recurringSeriesId);
    
    // Check if class has active bookings
    const bookingCount = bookingCounts[classItem.id];
    const hasActiveBookings = bookingCount && bookingCount.active > 0;
    
    if (hasActiveBookings) {
      console.log('Class has active bookings, showing warning modal');
      setPendingDeleteClass(classItem);
      setShowBookingWarningModal(true);
      setIsModalOpen(false); // Close the detail modal
      return;
    }
    
    // Proceed with normal delete flow if no active bookings
    proceedWithDelete(classItem);
  };

  const proceedWithDelete = (classItem: Class) => {
    // Check if this is a recurring class
    if (classItem.recurringSeriesId) {
      console.log('This is a recurring class, showing delete modal');
      setClassToDelete(classItem);
      setShowDeleteModal(true);
    } else {
      console.log('This is a non-recurring class, showing confirmation');
      // Non-recurring class - show simple confirmation
      if (confirm(`Are you sure you want to delete "${classItem.title}"?`)) {
        performDelete(classItem.id, 'this');
      }
    }
  };

  const handleBookingWarningConfirm = () => {
    console.log('Booking warning confirmed, proceeding with delete');
    setShowBookingWarningModal(false);
    if (pendingDeleteClass) {
      proceedWithDelete(pendingDeleteClass);
      setPendingDeleteClass(null);
    }
  };

  const handleDeleteConfirm = (option: DeleteOption) => {
    console.log('Delete confirmed with option:', option);
    if (classToDelete) {
      performDelete(classToDelete.id, option);
      setClassToDelete(null);
    }
  };

  const performDelete = async (classId: number, option: DeleteOption) => {
    try {
      const url = option === 'following' 
        ? `/api/classes/${classId}?deleteOption=following`
        : `/api/classes/${classId}`;
        
      console.log('Deleting class with URL:', url);
        
      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete class');
      }

      // Refresh the classes list
      await refetch();
      setIsModalOpen(false);
      
      const message = option === 'following' 
        ? "Class and following classes deleted successfully"
        : "Class deleted successfully";
        
      toast({
        title: "Success",
        description: message
      });
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: "Error",
        description: "Failed to delete class. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Fetch booking counts for each class
  const { data: bookingCounts = {} } = useQuery<Record<number, BookingCounts>>({
    queryKey: ['booking-counts', classes.map(c => c.id)],
    queryFn: async () => {
      const counts: Record<number, BookingCounts> = {};
      await Promise.all(
        classes.map(async (classItem) => {
          try {
            const response = await fetch(`/api/classes/${classItem.id}/bookings/count`);
            if (response.ok) {
              counts[classItem.id] = await response.json();
            }
          } catch (error) {
            console.error(`Error fetching booking count for class ${classItem.id}:`, error);
          }
        })
      );
      return counts;
    },
    enabled: classes.length > 0,
  });

  // Calendar calculations - include leading/trailing days for proper grid alignment
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Get the start of the calendar grid (start of week containing first day of month)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday = 0
  
  // Get the end of the calendar grid (end of week containing last day of month)
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  
  // Generate all days in the calendar grid (including leading/trailing days)
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // Get classes for a specific day
  const getClassesForDay = (day: Date) => {
    return classes.filter(classItem => {
      // Skip classes without valid start times (like parent recurring classes)
      if (!classItem.startTime) {
        return false;
      }
      const classDate = parseISO(classItem.startTime);
      return isSameDay(classDate, day);
    });
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  // Get weekday names
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <Header />
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Calendar</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your class schedule and view upcoming sessions</p>
          </div>
          <Link href="/create-class">
            <Button className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" />
              Add Class
            </Button>
          </Link>
        </div>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentMonth, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96 p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0 border-0 overflow-hidden w-full">
                {/* Weekday Headers */}
                {weekdays.map(day => (
                  <div key={day} className="bg-gray-50 p-2 sm:p-3 text-center font-medium text-xs sm:text-sm text-gray-700 border-b border-gray-200">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map(day => {
                  const dayClasses = getClassesForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isDayToday = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[100px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-gray-200 last:border-r-0 ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${isDayToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className="mb-1">
                        {isDayToday ? (
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mx-auto">
                            {format(day, 'd')}
                          </div>
                        ) : (
                          <div className={`text-xs sm:text-sm font-medium ${
                            !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                          }`}>
                            {format(day, 'd')}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayClasses.slice(0, 3).map(classItem => {
                          const bookingData = bookingCounts[classItem.id];
                          const classDate = parseISO(classItem.startTime);
                          const isPastEvent = classDate < new Date();
                          const isPastDay = day < new Date() && !isSameDay(day, new Date());
                          
                          const eventClasses = isPastEvent || isPastDay
                            ? "text-[10px] sm:text-xs p-0.5 sm:p-1 rounded bg-gray-100 text-gray-500 border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors opacity-60"
                            : "text-[10px] sm:text-xs p-0.5 sm:p-1 rounded bg-blue-50 text-black border border-blue-200 cursor-pointer hover:bg-blue-100 transition-colors";
                          
                          return (
                            <div 
                              key={classItem.id} 
                              className={eventClasses}
                              onClick={() => handleClassClick(classItem)}
                            >
                              <div className="font-medium truncate">
                                {classItem.title}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-2 w-2 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">{formatTime(classItem.startTime)}</span>
                                <span className="sm:hidden">{format(parseISO(classItem.startTime), 'h:mm')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-2 w-2 sm:h-3 sm:w-3" />
                                {bookingData?.active || 0}/{classItem.maxParticipants || classItem.capacity}
                              </div>
                            </div>
                          );
                        })}
                        
                        {dayClasses.length > 3 && (
                          <div className="text-xs text-gray-500 font-medium">
                            +{dayClasses.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Classes Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes scheduled</h3>
                <p className="text-gray-600 mb-4">Start by creating your first class</p>
                <Link href="/create-class">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Class
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {classes
                  .filter(classItem => {
                    const classDate = parseISO(classItem.startTime);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                    endOfMonth.setHours(23, 59, 59, 999);
                    
                    return classDate >= today && classDate <= endOfMonth;
                  })
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 10)
                  .map(classItem => {
                    const classDate = parseISO(classItem.startTime);
                    const isPastEvent = classDate < new Date();
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const classDay = new Date(classDate);
                    classDay.setHours(0, 0, 0, 0);
                    const isPastDay = classDay < today;
                    
                    const titleClasses = isPastEvent || isPastDay ? "font-medium text-gray-500" : "font-medium text-gray-900";
                    const detailClasses = isPastEvent || isPastDay ? "text-sm text-gray-400" : "text-sm text-gray-600";
                    const containerClasses = isPastEvent || isPastDay 
                      ? "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer opacity-60"
                      : "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer";
                    
                    return (
                      <div 
                        key={classItem.id} 
                        className={containerClasses}
                        onClick={() => handleClassClick(classItem)}
                      >
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className={titleClasses}>{classItem.title}</h4>
                              <div className={`flex items-center gap-4 mt-1 ${detailClasses}`}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(parseISO(classItem.startTime), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {formatTime(classItem.startTime)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {classItem.location}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                {bookingCounts[classItem.id]?.active || 0}/{classItem.maxParticipants || classItem.capacity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ${classItem.price}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Class Detail Modal */}
      <ClassDetailModal
        classItem={selectedClass}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        bookingCount={selectedClass ? bookingCounts[selectedClass.id] : undefined}
      />

      {/* Delete Recurring Modal */}
      <DeleteRecurringModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setClassToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        classTitle={classToDelete?.title || ''}
      />

      {/* Booking Warning Modal */}
      <BookingWarningModal
        isOpen={showBookingWarningModal}
        onClose={() => {
          setShowBookingWarningModal(false);
          setPendingDeleteClass(null);
        }}
        onConfirm={handleBookingWarningConfirm}
        classTitle={pendingDeleteClass?.title || ''}
        activeBookings={pendingDeleteClass ? (bookingCounts[pendingDeleteClass.id]?.active || 0) : 0}
      />
    </>
  );
}