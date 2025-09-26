// Removed useQuery - now using consolidated data from props to eliminate N+1 queries
import { Link, useLocation } from "wouter";
import { Class, User, ClassCategory, ClassSchedule, ClassWithSchedules, ClassCardDTO } from "@shared/schema";
import { MapPin, Clock, Star, Heart, Calendar, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatInTimeZone } from "date-fns-tz";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSafeAuth } from "../../../../hooks/use-auth-safe";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../../lib/queryClient";
import { useToast } from "../../../../hooks/use-toast";
import { useState } from "react";
import ClassShareModal from "@/components/class-share-modal";

interface ClassCardProps {
  classItem: ClassCardDTO | Class | ClassWithSchedules;
  schedules?: ClassSchedule[];
  coach?: User; // Optional coach data when not embedded in classItem
}

export default function ClassCard({ classItem, schedules, coach: providedCoach }: ClassCardProps) {
  const [, navigate] = useLocation();
  const { user } = useSafeAuth();
  const { toast } = useToast();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Fetch user's liked classes
  const { data: likedClasses = [] } = useQuery<number[]>({
    queryKey: ["/api/user/liked-classes"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only fetch if user is logged in
  });

  // Check if this class is liked
  const isLiked = likedClasses.includes(classItem.id);

  // Like a class mutation
  const likeMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await apiRequest("POST", `/api/classes/${classId}/like`);
      return await res.json();
    },
    onSuccess: (_, classId) => {
      // Update the cache by adding the class ID to the liked classes array
      queryClient.setQueryData(["/api/user/liked-classes"], (oldData: number[] = []) => {
        if (!oldData.includes(classId)) {
          return [...oldData, classId];
        }
        return oldData;
      });
      
      toast({
        title: "Class liked!",
        description: "Added to your favorites",
      });
    },
    onError: (error) => {
      console.error("Error liking class:", error);
      toast({
        title: "Error",
        description: "Failed to like class. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Unlike a class mutation
  const unlikeMutation = useMutation({
    mutationFn: async (classId: number) => {
      const res = await apiRequest("DELETE", `/api/classes/${classId}/like`);
      return await res.json();
    },
    onSuccess: (_, classId) => {
      // Update the cache by removing the class ID from the liked classes array
      queryClient.setQueryData(["/api/user/liked-classes"], (oldData: number[] = []) => {
        return oldData.filter(id => id !== classId);
      });
      
      toast({
        title: "Class unliked",
        description: "Removed from your favorites",
      });
    },
    onError: (error) => {
      console.error("Error unliking class:", error);
      toast({
        title: "Error",
        description: "Failed to unlike class. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle like button click
  const handleLikeClick = () => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to like classes",
      });
      return;
    }

    if (isLiked) {
      unlikeMutation.mutate(classItem.id);
    } else {
      likeMutation.mutate(classItem.id);
    }
  };
  
  // Check if this is a recurring class
  const isRecurring = classItem.isRecurring;
  
  // Get class schedules from props or from the classItem
  const classSchedules = schedules || classItem.schedules || [];
  
  // Check if we have embedded data (ClassCardDTO) or need to handle simpler class objects
  const isClassCardDTO = 'coach' in classItem && typeof classItem.coach === 'object';
  
  // Use consolidated data from props when available, otherwise provide fallbacks
  const coach = isClassCardDTO ? (classItem as ClassCardDTO).coach : providedCoach || null;
  const category = isClassCardDTO ? (classItem as ClassCardDTO).category : null;
  const bookingCount = {
    total: isClassCardDTO ? ((classItem as ClassCardDTO).bookingStats?.totalBookings || 0) : 0,
    active: isClassCardDTO ? ((classItem as ClassCardDTO).bookingStats?.activeBookings || 0) : 0,
    spotsLeft: isClassCardDTO ? ((classItem as ClassCardDTO).bookingStats?.spotsLeft || classItem.capacity) : classItem.capacity
  };
  const coachRatingStats = {
    averageRating: isClassCardDTO ? ((classItem as ClassCardDTO).ratingStats?.averageRating || 0) : 0,
    totalReviews: isClassCardDTO ? ((classItem as ClassCardDTO).ratingStats?.totalReviews || 0) : 0
  };
  
  // No loading states needed since all data is provided via props
  const isLoadingCoach = false;
  const isLoadingCategory = false;
  const isLoadingBookingCount = false;
  
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
  
  const handleCardClick = (e: React.MouseEvent) => {
    console.log("Card clicked!", classItem.id);
    // Don't navigate if user clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      console.log("Button clicked, not navigating");
      return;
    }
    console.log("Navigating to:", `/classes/${classItem.id}`);
    navigate(`/classes/${classItem.id}`);
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden cursor-pointer block"
      onClick={handleCardClick}
      style={{ userSelect: 'none' }}
    >
        <div className="h-48 overflow-hidden relative">
          <img 
          src={classItem.image || "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500"}
          alt={classItem.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // If the image fails to load, use fallback
            const target = e.target as HTMLImageElement;
            if (target.src !== "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500") {
              target.src = "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=500";
            }
          }}
          />
          <div className="absolute top-3 left-3 bg-primary text-white text-sm font-medium px-2 py-1 rounded">
            {isLoadingCategory ? <Skeleton className="h-4 w-16" /> : category?.name || "Class"}
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <button 
              className="bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition"
              onClick={(e) => {
                e.stopPropagation();
                setIsShareModalOpen(true);
              }}
              data-testid={`button-share-${classItem.id}`}
            >
              <Share2 className="text-primary h-5 w-5" />
            </button>
            <button 
              className="bg-white bg-opacity-80 p-2 rounded-full hover:bg-opacity-100 transition"
              onClick={(e) => {
                e.stopPropagation();
                handleLikeClick();
              }}
              data-testid={`button-like-${classItem.id}`}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
            >
              <Heart 
                className={`h-5 w-5 transition-colors ${
                  isLiked 
                    ? "text-red-500 fill-red-500" 
                    : "text-primary"
                }`} 
              />
            </button>
          </div>
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
                  onError={(e) => {
                    // Hide the image and show the initials fallback
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const container = target.parentElement;
                    if (container) {
                      container.innerHTML = `<span class="text-xs font-medium text-gray-700">${coach?.firstName?.[0] || ''}${coach?.lastName?.[0] || ''}</span>`;
                    }
                  }}
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
              coach ? (
                coach.displayBusinessName && coach.businessName 
                  ? coach.businessName
                  : `${coach.firstName}`
              ) : "Provider"
            )}
          </span>
          
          {coachRatingStats?.totalReviews > 0 && (
            <div className="ml-auto flex items-center">
              <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
              <span className="ml-1">
                {Number(coachRatingStats.averageRating || 0).toFixed(1)}
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
                {bookingCount.spotsLeft}
              </span>
            ) : (
              <span className="font-medium">{classItem.capacity}</span>
            )} spots left
          </div>
          {bookingCount?.spotsLeft === 0 ? (
            <Button 
              disabled 
              className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
              onClick={(e) => e.stopPropagation()}
            >
              Class Full
            </Button>
          ) : (
            <Button 
              className="w-full bg-primary text-white hover:bg-primary/90"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/classes/${classItem.id}`);
              }}
            >
              Book Now
            </Button>
          )}
          </div>
        </div>
        
        {/* Share Modal */}
        <ClassShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          classTitle={classItem.title}
          classId={classItem.id}
          coachName={coach ? (coach.displayBusinessName && coach.businessName ? coach.businessName : `${coach.firstName} ${coach.lastName}`) : undefined}
          price={classItem.price}
        />
    </div>
  );
}
