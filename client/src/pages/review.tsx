import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ReviewForm } from "@/components/review/review-form";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileNavigation from "@/components/layout/mobile-navigation";
import { Class, User } from "@shared/schema";
import { Helmet } from "react-helmet";

export default function ReviewPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split('?')[1] || '');
  const classId = parseInt(params.get('classId') || '0');
  const bookingId = parseInt(params.get('bookingId') || '0');

  const { data: classItem, isLoading: classLoading } = useQuery<Class>({
    queryKey: [`/api/classes/${classId}`],
    enabled: !!classId
  });

  const { data: coach, isLoading: coachLoading } = useQuery<User>({
    queryKey: [`/api/coaches/${classItem?.coachId}`],
    enabled: !!classItem?.coachId
  });

  if (classLoading || coachLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Helmet>
          <title>Loading Review - Trainn Fitness</title>
        </Helmet>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  if (!classItem || !coach || !bookingId) {
    return (
      <div className="flex flex-col min-h-screen">
        <Helmet>
          <title>Review Not Found - Trainn Fitness</title>
        </Helmet>
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Review Not Found</h1>
            <p className="text-muted-foreground">
              The class or booking information could not be found.
            </p>
          </div>
        </main>
        <Footer />
        <MobileNavigation />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Review {classItem.title} - Trainn Fitness</title>
        <meta name="description" content={`Share your experience and rate the ${classItem.title} class.`} />
      </Helmet>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ReviewForm 
          classItem={classItem}
          coach={coach}
          bookingId={bookingId}
        />
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  );
}