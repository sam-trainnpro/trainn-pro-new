import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { User, ClassCategory } from "@shared/schema";
import { Star, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachCardProps {
  coach: User;
}

export default function CoachCard({ coach }: CoachCardProps) {
  // Get rating statistics for this coach
  const { data: ratingStats } = useQuery({
    queryKey: ['/api/reviews/coach', coach.id, 'stats'],
    queryFn: () => fetch(`/api/reviews/coach/${coach.id}/stats`).then(res => res.json()),
  });

  // Get categories for expertise display
  const { data: categories = [] } = useQuery<ClassCategory[]>({
    queryKey: ['/api/categories'],
  });

  // Only show ratings if there are real reviews
  const hasRealReviews = ratingStats?.totalReviews > 0;

  // Get expertise areas
  const expertiseAreas = coach.areasOfExpertise || [];
  const expertiseNames = expertiseAreas
    .map(id => categories.find(cat => cat.id === id)?.name)
    .filter(Boolean)
    .slice(0, 3); // Show max 3 areas

  return (
    <div className="bg-[#F7F7F7] rounded-xl p-4 text-center hover:shadow-md transition">
      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200 flex items-center justify-center">
        {coach.profileImage ? (
          <img 
            src={coach.profileImage} 
            alt={`${coach.firstName} ${coach.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircle className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      
      <h3 className="font-heading font-bold text-lg">{coach.firstName} {coach.lastName}</h3>
      <p className="text-sm text-gray-600 mb-2">
        {expertiseNames.length > 0 ? expertiseNames.join(', ') : 'Fitness Expert'}
      </p>
      
      {hasRealReviews && (
        <div className="flex justify-center items-center mb-3">
          <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
          <span className="ml-1 font-medium">{ratingStats.averageRating.toFixed(1)}</span>
          <span className="text-sm text-gray-500 ml-1">
            ({ratingStats.totalReviews} {ratingStats.totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      )}
      
      <Link href={`/coaches/${coach.id}`}>
        <Button 
          variant="outline" 
          className="w-full border-primary text-primary hover:bg-primary hover:text-white"
        >
          View Profile
        </Button>
      </Link>
    </div>
  );
}
