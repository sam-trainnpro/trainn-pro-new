import { useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/use-auth-simple';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO, isToday } from 'date-fns';
import { Link } from 'wouter';

interface Class {
  id: number;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  location: string;
  maxParticipants: number;
  price: number;
  imageUrl?: string;
  categoryId: number;
  coachId: number;
  isRecurring: boolean;
  parentClassId?: number;
}

interface ClassWithBookings extends Class {
  totalBookings: number;
  activeBookings: number;
}

export default function MyCalendarPage() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());

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
  const { data: classes = [], isLoading } = useQuery<ClassWithBookings[]>({
    queryKey: [`/api/coaches/${user.id}/classes`],
    enabled: !!user?.id,
  });

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd
  });

  // Get classes for a specific day
  const getClassesForDay = (day: Date) => {
    return classes.filter(classItem => {
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
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Calendar</h1>
            <p className="text-gray-600">Manage your class schedule and view upcoming sessions</p>
          </div>
          <Link href="/create-class">
            <Button className="flex items-center gap-2">
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
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading calendar...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {/* Weekday Headers */}
                {weekdays.map(day => (
                  <div key={day} className="bg-gray-50 p-3 text-center font-medium text-sm text-gray-700 border-b border-gray-200">
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
                      className={`min-h-[120px] p-2 border-b border-r border-gray-200 last:border-r-0 ${
                        !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                      } ${isDayToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                      } ${isDayToday ? 'text-blue-600 font-bold' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      
                      <div className="space-y-1">
                        {dayClasses.slice(0, 3).map(classItem => (
                          <div
                            key={classItem.id}
                            className="text-xs p-1 rounded bg-primary/10 text-primary border border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                          >
                            <div className="font-medium truncate">
                              {classItem.title}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(classItem.startTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {classItem.activeBookings}/{classItem.maxParticipants}
                            </div>
                          </div>
                        ))}
                        
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
              Upcoming Classes This Month
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
                    return isSameMonth(classDate, currentMonth);
                  })
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .slice(0, 10)
                  .map(classItem => (
                    <div key={classItem.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">{classItem.title}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
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
                              {classItem.activeBookings}/{classItem.maxParticipants}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              ${classItem.price}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}