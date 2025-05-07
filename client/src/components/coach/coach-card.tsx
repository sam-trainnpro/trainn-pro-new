import { Link } from "wouter";
import { User } from "@shared/schema";
import { Star, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoachCardProps {
  coach: User;
}

export default function CoachCard({ coach }: CoachCardProps) {
  return (
    <div className="bg-[#F7F7F7] rounded-xl p-4 text-center hover:shadow-md transition">
      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 bg-gray-200 flex items-center justify-center">
        {coach.profileImage ? (
          <img 
            src={coach.profileImage} 
            alt={`Coach ${coach.firstName} ${coach.lastName}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <UserCircle className="h-16 w-16 text-muted-foreground" />
        )}
      </div>
      
      <h3 className="font-heading font-bold text-lg">Coach {coach.firstName}</h3>
      <p className="text-sm text-gray-600 mb-2">HIIT, Cardio, Strength</p>
      
      <div className="flex justify-center items-center mb-3">
        <Star className="text-[#FFCC00] fill-[#FFCC00] h-4 w-4" />
        <span className="ml-1 font-medium">4.9</span>
        <span className="text-sm text-gray-500 ml-1">(124 reviews)</span>
      </div>
      
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
