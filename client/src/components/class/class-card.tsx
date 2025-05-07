import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Class, User, ClassCategory } from "@shared/schema";
import { MapPin, Clock, Star, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistance } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface ClassCardProps {
  classItem: Class;
}

export default function ClassCard({ classItem }: ClassCardProps) {
  // Get coach data
  const { data: coach, isLoading: isLoadingCoach } = useQuery<User>({
    queryKey: [`/api/coaches/${classItem.coachId}`],
  });
  
  // Get category data
  const { data: category, isLoading: isLoadingCategory } = useQuery<ClassCategory>({
    queryKey: [`/api/categories/${classItem.categoryId}`],
  });
  
  // Format the date and time
  const formatClassTime = () => {
    const startDate = new Date(classItem.startTime);
    const endDate = new Date(classItem.endTime);
    
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    
    const startFormatted = startDate.toLocaleTimeString('en-US', options);
    const endFormatted = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    
    return `${startFormatted} - ${endFormatted}`;
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
          <h3 className="font-heading font-bold text-lg">{classItem.title}</h3>
          <span className="font-bold text-lg">${classItem.price.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center mt-2 text-sm text-gray-600">
          <MapPin className="mr-1 h-4 w-4" />
          <span>{classItem.location}</span>
        </div>
        
        <div className="flex items-center mt-1 text-sm text-gray-600">
          <Clock className="mr-1 h-4 w-4" />
          <span>{formatClassTime()}</span>
        </div>
        
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
          
          <div className="ml-auto flex items-center">
            <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
            <span className="ml-1">4.9</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="text-center py-2 bg-[#F7F7F7] rounded-lg text-sm">
            <span className="font-medium">8/12</span> spots left
          </div>
          <Link href={`/classes/${classItem.id}`}>
            <Button className="w-full bg-primary text-white hover:bg-primary/90">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
