import { useState } from 'react';
import { Link } from 'wouter';
import { 
  Class, 
  ClassWithSchedules,
  ClassCardDTO,
  ClassCategory as ClassCategoryType,
  User
} from "@shared/schema";
import { useQuery } from '@tanstack/react-query';
import { Star, MapPin, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatTime, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ClassListItemProps {
  classItem: Class | ClassWithSchedules | ClassCardDTO;
  showDetails?: boolean;
}

export default function ClassListItem({ classItem, showDetails = true }: ClassListItemProps) {
  // Check if classItem is a ClassCardDTO with embedded coach data
  const isClassCardDTO = 'coach' in classItem;
  const embeddedCoach = isClassCardDTO ? (classItem as ClassCardDTO).coach : null;
  
  // Fetch the coach information only if not already embedded
  const { 
    data: coach,
    isLoading: isLoadingCoach
  } = useQuery<User>({
    queryKey: [`/api/coaches/${(classItem as Class).coachId}`],
    enabled: !isClassCardDTO && !!(classItem as Class).coachId,
  });
  
  // Use embedded coach data if available, otherwise use fetched coach data
  const finalCoach = embeddedCoach || coach;
  const finalIsLoadingCoach = !isClassCardDTO && isLoadingCoach;
  
  // Check for embedded category data
  const embeddedCategory = isClassCardDTO ? (classItem as ClassCardDTO).category : null;
  
  // Fetch the category information only if not already embedded
  const { 
    data: category,
    isLoading: isLoadingCategory
  } = useQuery<ClassCategoryType>({
    queryKey: [`/api/categories/${(classItem as Class).categoryId}`],
    enabled: !isClassCardDTO && !!(classItem as Class).categoryId,
  });
  
  // Use embedded category data if available, otherwise use fetched category data
  const finalCategory = embeddedCategory || category;
  const finalIsLoadingCategory = !isClassCardDTO && isLoadingCategory;
  
  // Define type for booking count
  interface BookingCountData {
    total: number;
    active: number;
    capacity: number;
    spotsLeft: number;
  }
  
  // Check for embedded booking stats
  const embeddedBookingStats = isClassCardDTO ? (classItem as ClassCardDTO).bookingStats : null;
  
  // Fetch the booking count for capacity display only if not already embedded
  const {
    data: bookingCount,
    isLoading: isLoadingBookingCount
  } = useQuery<BookingCountData>({
    queryKey: [`/api/classes/${classItem.id}/bookings/count`],
    enabled: !isClassCardDTO && !!classItem.id,
  });
  
  // Use embedded booking stats if available, otherwise use fetched booking count
  const finalBookingCount = embeddedBookingStats ? {
    total: embeddedBookingStats.totalBookings,
    active: embeddedBookingStats.activeBookings,
    capacity: classItem.capacity,
    spotsLeft: embeddedBookingStats.spotsLeft
  } : bookingCount;
  const finalIsLoadingBookingCount = !isClassCardDTO && isLoadingBookingCount;
  
  // Calculate the class duration in minutes
  const getDuration = (): number => {
    if (!classItem.startTime || !classItem.endTime) return 60; // Default duration
    
    const start = new Date(classItem.startTime);
    const end = new Date(classItem.endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };
  
  const duration = getDuration();
  const startTime = classItem.startTime ? new Date(classItem.startTime) : null;
  
  // Check for embedded rating stats or fetch them
  const embeddedRatingStats = isClassCardDTO ? (classItem as ClassCardDTO).ratingStats : null;
  const coachId = isClassCardDTO ? (classItem as ClassCardDTO).coach.id : (classItem as Class).coachId;
  
  // Fetch coach rating data from Reviews table only if not already embedded
  const { data: coachRatingStats } = useQuery({
    queryKey: ['/api/reviews/coach', coachId, 'stats'],
    queryFn: () => fetch(`/api/reviews/coach/${coachId}/stats`).then(res => res.json()),
    enabled: !isClassCardDTO && !!coachId,
  });
  
  // Use embedded rating stats if available, otherwise use fetched rating stats
  const finalRatingStats = embeddedRatingStats || coachRatingStats;
  
  // Only show ratings if the coach has real reviews
  const hasRealCoachReviews = finalRatingStats?.totalReviews > 0;
  
  const formattedStartTime = startTime 
    ? formatTime(startTime)
    : '10:00 AM'; // Default time as fallback
  
  // Format date like "Sun 5/18"
  const formattedDateDisplay = startTime
    ? `${startTime.toLocaleDateString('en-US', { weekday: 'short' })} ${(startTime.getMonth() + 1)}/${startTime.getDate()}`
    : '';
  
  // Format time like "5:00 AM"
  const formattedTimeDisplay = startTime
    ? `${startTime.getHours() === 0 ? 12 : startTime.getHours() > 12 ? startTime.getHours() - 12 : startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')} ${startTime.getHours() >= 12 ? 'PM' : 'AM'}`
    : '10:00 AM';

  return (
    <Link href={`/classes/${classItem.id}`}>
      <div className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors flex flex-col md:flex-row gap-2 md:items-center">
        {/* Time and duration column */}
        <div className="w-full md:w-32 mr-4">
          {startTime && (
            <div className="text-gray-700 text-sm mb-1 flex items-center justify-between md:justify-start">
              <span>{formattedDateDisplay}</span>
              {/* Category badge shown on mobile, right-aligned */}
              <div className="md:hidden ml-auto">
                <Badge variant="outline" className="text-xs">
                  {finalIsLoadingCategory ? 'Loading...' : finalCategory?.name || 'Fitness'}
                </Badge>
              </div>
            </div>
          )}
          <div className="font-medium text-gray-900 flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
            {formattedTimeDisplay}
          </div>
          <div className="text-gray-500 text-sm ml-5">{duration} min</div>
        </div>
        
        {/* Class title, coach info, and location */}
        <div className="flex-1">
          <div className="font-medium text-gray-900">{classItem.title}</div>
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center">
              <div className="text-gray-600 text-sm">
                {finalIsLoadingCoach ? 'Loading provider...' : finalCoach?.firstName ? (
                  finalCoach.displayBusinessName && finalCoach.businessName 
                    ? finalCoach.businessName
                    : `${finalCoach.firstName} ${finalCoach.lastName}`
                ) : 'Unknown Provider'}
              </div>
              {hasRealCoachReviews && finalRatingStats && (
                <div className="ml-2 flex items-center text-sm">
                  <Star className="h-3.5 w-3.5 text-yellow-500 mr-1" fill="currentColor" />
                  <span>{(typeof finalRatingStats.averageRating === 'number' ? finalRatingStats.averageRating : parseFloat(finalRatingStats.averageRating || '0')).toFixed(1)}</span>
                  <span className="text-gray-400 ml-1">({finalRatingStats.totalReviews})</span>
                </div>
              )}
            </div>
            {/* Price shown on mobile only */}
            <div className="md:hidden font-medium text-gray-900">${classItem.price}</div>
          </div>
          
          {/* Location information */}
          <div className="text-gray-600 text-sm mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                <span>{classItem.location || 'Location not specified'}</span>
              </div>
              {/* Age badge on mobile */}
              {(() => {
                const minAge = isClassCardDTO ? (classItem as ClassCardDTO).minAge : null;
                const maxAge = isClassCardDTO ? (classItem as ClassCardDTO).maxAge : null;
                if (minAge == null && maxAge == null) return null;
                let label = '';
                if (minAge != null && maxAge != null) label = `Ages ${minAge}–${maxAge}`;
                else if (minAge != null) label = `Ages ${minAge}+`;
                else if (maxAge != null) label = `Up to age ${maxAge}`;
                return <Badge variant="secondary" className="md:hidden text-xs">{label}</Badge>;
              })()}
            </div>
            {/* Spots left indicator shown on mobile only */}
            <div className="md:hidden text-xs px-2 py-0.5 rounded-full bg-gray-100 flex items-center">
              <Users className="h-3 w-3 mr-1 text-gray-500" />
              {finalIsLoadingBookingCount ? (
                <Skeleton className="h-3 w-12" />
              ) : finalBookingCount ? (
                finalBookingCount.spotsLeft === 0 ? (
                  <span className="font-medium">Join Waitlist</span>
                ) : (
                  <span>
                    <span className="font-medium">{finalBookingCount?.spotsLeft || 0}</span> spots left
                  </span>
                )
              ) : (
                <span>{classItem.capacity} spots left</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Category and spots left column */}
        <div className="flex flex-col items-end">
          {/* Category badge shown on desktop only */}
          <div className="hidden md:flex flex-wrap gap-1 mb-1">
            <Badge variant="outline">
              {finalIsLoadingCategory ? 'Loading...' : finalCategory?.name || 'Fitness'}
            </Badge>
            {(() => {
              const minAge = isClassCardDTO ? (classItem as ClassCardDTO).minAge : null;
              const maxAge = isClassCardDTO ? (classItem as ClassCardDTO).maxAge : null;
              if (minAge == null && maxAge == null) return null;
              let label = '';
              if (minAge != null && maxAge != null) label = `Ages ${minAge}–${maxAge}`;
              else if (minAge != null) label = `Ages ${minAge}+`;
              else if (maxAge != null) label = `Up to age ${maxAge}`;
              return <Badge variant="secondary" className="text-xs">{label}</Badge>;
            })()}
          </div>
          
          {/* Price shown on desktop only */}
          <div className="hidden md:block font-medium text-gray-900 mb-1">${classItem.price}</div>
          
          {/* Spots left indicator shown on desktop only */}
          <div className="hidden md:flex text-xs mt-1 px-2 py-0.5 rounded-full bg-gray-100 items-center">
            <Users className="h-3 w-3 mr-1 text-gray-500" />
            {finalIsLoadingBookingCount ? (
              <Skeleton className="h-3 w-12" />
            ) : finalBookingCount ? (
              finalBookingCount.spotsLeft === 0 ? (
                <span className="font-medium">Join Waitlist</span>
              ) : (
                <span>
                  <span className="font-medium">{finalBookingCount?.spotsLeft || 0}</span> spots left
                </span>
              )
            ) : (
              <span>{classItem.capacity} spots left</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}