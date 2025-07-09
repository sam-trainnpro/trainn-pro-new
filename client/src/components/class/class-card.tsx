import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Class, User, ClassCategory, ClassSchedule, ClassWithSchedules } from "@shared/schema";
import { MapPin, Clock, Star, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatInTimeZone } from "date-fns-tz";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ClassCardProps {
  classItem: Class | ClassWithSchedules;
  schedules?: ClassSchedule[];
}

export default function ClassCard({ classItem, schedules }: ClassCardProps) {
  // Check if this is a recurring class
  const isRecurring = 'isRecurring' in classItem && classItem.isRecurring;
  
  // Get class schedules from props or from the class item if it's a ClassWithSchedules
  const classSchedules = schedules || ('schedules' in classItem ? classItem.schedules : undefined);
  
  // Get coach data
  const { data: coach, isLoading: isLoadingCoach } = useQuery<User>({
    queryKey: [`/api/coaches/${classItem.coachId}`],
  });
  
  // Get category data
  const { data: category, isLoading: isLoadingCategory } = useQuery<ClassCategory>({
    queryKey: [`/api/categories/${classItem.categoryId}`],
  });
  
  // Get booking count data
  const { data: bookingCount, isLoading: isLoadingBookingCount } = useQuery<{
    total: number;
    active: number;
    totalSpotsBooked: number;
    capacity: number;
    spotsLeft: number;
  }>({
    queryKey: [`/api/classes/${classItem.id}/bookings/count`],
  });

  // Get rating statistics for the coach
  const { data: coachRatingStats } = useQuery({
    queryKey: ['/api/reviews/coach', classItem.coachId, 'stats'],
    queryFn: () => fetch(`/api/reviews/coach/${classItem.coachId}/stats`).then(res => res.json()),
    enabled: !!classItem.coachId,
  });
  
  // Get day name from day number
  const getDayName = (dayNum: number): string => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayNum];
  };
  
  // Format time (HH:MM format) for display
  const formatTimeString = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  // Format schedule for recurring classes
  const formatSchedule = (schedule: ClassSchedule): string => {
    return `${getDayName(schedule.dayOfWeek)} ${formatTimeString(schedule.startTime)} - ${formatTimeString(schedule.endTime)}`;
  };
  
  // Format the date and time for single occurrence classes
  const formatClassTime = () => {
    if (!classItem.startTime || !classItem.endTime) {
      return 'Schedule not available';
    }
    
    const startDate = new Date(classItem.startTime);
    const endDate = new Date(classItem.endTime);
    
    // Use Pacific Time for all classes in San Francisco
    const timeZone = 'America/Los_Angeles'; // Pacific Time Zone
    
    // Format date as "Sun 5/18"
    const dayOfWeek = formatInTimeZone(startDate, timeZone, 'EEE');
    const month = startDate.getMonth() + 1; // getMonth is 0-indexed
    const day = startDate.getDate();
    const formattedDate = `${dayOfWeek} ${month}/${day}`;
    
    // Format times
    const startFormatted = formatInTimeZone(startDate, timeZone, 'h:mm a');
    const endFormatted = formatInTimeZone(endDate, timeZone, 'h:mm a');
    
    // Combine date and time: "Sun 5/18 9:00 AM - 10:00 AM PT"
    const displayText = `${formattedDate} ${startFormatted} - ${endFormatted} PT`;
    
    return displayText;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={classItem.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
          alt={classItem.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3 bg-primary text-white text-sm font-medium px-2 py-1 rounded">
          {isLoadingCategory ? <Skeleton className="h-4 w-16" /> : category?.name || "Class"}
        </div>
        <button className="absolute top-3 right-3 bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition">
          <Heart className="text-primary h-5 w-5" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-heading font-bold text-lg">{classItem.title}</h3>
            {'parentClassId' in classItem && classItem.parentClassId && (
              <div className="text-xs text-primary font-medium mt-0.5">
                Single class session
              </div>
            )}
          </div>
          <span className="font-bold text-lg">${classItem.price.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <MapPin className="mr-1 h-4 w-4" />
          <span>{classItem.location}</span>
        </div>
        
        {isRecurring ? (
          <div className="mt-1 space-y-1">
            <div className="flex items-center text-sm text-gray-600 font-medium">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Recurring Class</span>
            </div>
            {classSchedules && classSchedules.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {classSchedules.map((schedule, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {getDayName(schedule.dayOfWeek)} {formatTimeString(schedule.startTime)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                <Clock className="inline-block mr-1 h-4 w-4" />
                <span>Schedule not available</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <Clock className="mr-1 h-4 w-4" />
            <span>{formatClassTime()}</span>
          </div>
        )}
        
        <div className="flex items-center mt-2">
          {isLoadingCoach ? (
            <Skeleton className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
              {coach?.profileImage ? (
                <img 
                  src={coach.profileImage} 
                  alt={`${coach?.firstName} ${coach?.lastName}`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium">
                  {coach?.firstName?.[0]}{coach?.lastName?.[0]}
                </span>
              )}
            </div>
          )}
          
          <span className="ml-2 font-medium">
            {isLoadingCoach ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              coach ? `Coach ${coach.firstName}` : "Coach"
            )}
          </span>
          
          {coachRatingStats?.totalReviews > 0 && (
            <div className="ml-auto flex items-center">
              <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
              <span className="ml-1">
                {coachRatingStats.averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-center py-2 bg-[#F7F7F7] rounded-lg text-sm">
            {isLoadingBookingCount ? (
              <Skeleton className="h-4 w-16 mx-auto" />
            ) : bookingCount ? (
              <span className="font-medium">
                {bookingCount.spotsLeft}/{bookingCount.capacity}
              </span>
            ) : (
              <span className="font-medium">{classItem.capacity}</span>
            )} spots left
          </div>
          {bookingCount?.spotsLeft === 0 ? (
            <Button disabled className="w-full bg-gray-300 text-gray-500 cursor-not-allowed">
              Class Full
            </Button>
          ) : (
            <Link href={`/classes/${classItem.id}`}>
              <Button className="w-full bg-primary text-white hover:bg-primary/90">
                Book Now
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
