import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ReviewForm } from "@/components/review/review-form";
import { Class, User } from "@shared/schema";

export default function ReviewPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1]);
  const classId = parseInt(params.get('classId') || '0');
  const bookingId = parseInt(params.get('bookingId') || '0');

  const { data: classItem, isLoading: classLoading } = useQuery({
    queryKey: [`/api/classes/${classId}`],
    enabled: !!classId
  });

  const { data: coach, isLoading: coachLoading } = useQuery({
    queryKey: [`/api/coaches/${classItem?.coachId}`],
    enabled: !!classItem?.coachId
  });

  if (classLoading || coachLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!classItem || !coach || !bookingId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Review Not Found</h1>
          <p className="text-muted-foreground">
            The class or booking information could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ReviewForm 
        classItem={classItem}
        coach={coach}
        bookingId={bookingId}
      />
    </div>
  );
}