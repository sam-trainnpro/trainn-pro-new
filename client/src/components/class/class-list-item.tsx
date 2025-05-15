import { useState } from 'react';
import { Link } from 'wouter';
import { 
  Class, 
  ClassWithSchedules,
  ClassCategory as ClassCategoryType,
  User
} from "@shared/schema";
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassListItemProps {
  classItem: Class | ClassWithSchedules;
  showDetails?: boolean;
}

export default function ClassListItem({ classItem, showDetails = true }: ClassListItemProps) {
  // Fetch the coach information
  const { 
    data: coach,
    isLoading: isLoadingCoach
  } = useQuery<User>({
    queryKey: [`/api/coaches/${classItem.coachId}`],
    enabled: !!classItem.coachId,
  });
  
  // Fetch the category information
  const { 
    data: category,
    isLoading: isLoadingCategory
  } = useQuery<ClassCategoryType>({
    queryKey: [`/api/categories/${classItem.categoryId}`],
    enabled: !!classItem.categoryId,
  });
  
  // Define type for booking count
  interface BookingCountData {
    total: number;
    active: number;
    capacity: number;
    spotsLeft: number;
  }
  
  // Fetch the booking count for capacity display
  const {
    data: bookingCount,
    isLoading: isLoadingBookingCount
  } = useQuery<BookingCountData>({
    queryKey: [`/api/classes/${classItem.id}/bookings/count`],
    enabled: !!classItem.id,
  });
  
  // Calculate the class duration in minutes
  const getDuration = (): number => {
    if (!classItem.startTime || !classItem.endTime) return 60; // Default duration
    
    const start = new Date(classItem.startTime);
    const end = new Date(classItem.endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };
  
  const duration = getDuration();
  const startTime = classItem.startTime ? new Date(classItem.startTime) : null;
  
  // Calculate average rating (would come from reviews in a real app)
  // These are placeholder values since we don't have actual rating data yet
  const rating = 4.5;
  const reviewCount = Math.floor(Math.random() * 100) + 5;
  
  const formattedStartTime = startTime 
    ? formatTime(startTime)
    : '10:00 AM'; // Default time as fallback
  
  // Format time like "5:00 AM"
  const formattedTimeDisplay = startTime
    ? `${startTime.getHours() === 0 ? 12 : startTime.getHours() > 12 ? startTime.getHours() - 12 : startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')} ${startTime.getHours() >= 12 ? 'PM' : 'AM'}`
    : '10:00 AM';

  return (
    <Link href={`/classes/${classItem.id}`}>
      <div className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors flex flex-col md:flex-row gap-2 md:items-center">
        {/* Time and duration column */}
        <div className="w-32 mr-4">
          <div className="font-medium text-gray-900 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
            {formattedTimeDisplay}
          </div>
          <div className="text-gray-500 text-sm ml-5">{duration} min</div>
        </div>
        
        {/* Class title, coach info, and location */}
        <div className="flex-1">
          <div className="font-medium text-gray-900">{classItem.title}</div>
          <div className="flex items-center mt-1">
            <div className="text-gray-600 text-sm">
              {isLoadingCoach ? 'Loading coach...' : coach?.firstName ? `${coach.firstName} ${coach.lastName}` : 'Unknown Coach'}
            </div>
            <div className="ml-2 flex items-center text-sm">
              <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" fill="currentColor" />
              <span>{rating.toFixed(1)}</span>
              <span className="text-gray-400 ml-1">({reviewCount})</span>
            </div>
          </div>
          
          {/* Location information */}
          <div className="text-gray-600 text-sm mt-1 flex items-center">
            <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <span>{classItem.location || 'Location not specified'}</span>
          </div>
        </div>
        
        {/* Price, category, and spots left column */}
        <div className="flex flex-col items-end">
          <Badge variant="outline" className="mb-1">
            {isLoadingCategory ? 'Loading...' : category?.name || 'Fitness'}
          </Badge>
          <div className="font-medium text-gray-900">${classItem.price}</div>
          
          {/* Spots left indicator */}
          <div className="text-xs mt-1 px-2 py-0.5 rounded-full bg-gray-100 flex items-center">
            <Users className="h-3 w-3 mr-1 text-gray-500" />
            {isLoadingBookingCount ? (
              <Skeleton className="h-3 w-12" />
            ) : bookingCount ? (
              <span>
                <span className="font-medium">{bookingCount?.spotsLeft || 0}/{bookingCount?.capacity || classItem.capacity}</span> spots
              </span>
            ) : (
              <span>{classItem.capacity} spots</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}