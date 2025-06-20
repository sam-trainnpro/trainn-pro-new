import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Class, User, Review } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StarRating } from "@/components/ui/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, User as UserIcon, ArrowLeft } from "lucide-react";
import { useToast } from "../../../../hooks/use-toast";
import { format } from "date-fns";

interface ReviewFormProps {
  classItem: Class;
  coach: User;
  bookingId: number;
  existingReview?: Review;
  onClose?: () => void;
}

export function ReviewForm({ classItem, coach, bookingId, existingReview, onClose }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) {
        throw new Error("Please select a rating");
      }

      const reviewData = {
        classId: classItem.id,
        bookingId,
        rating,
        comment: comment.trim() || null
      };

      if (existingReview) {
        return await apiRequest("PUT", `/api/reviews/${existingReview.id}`, reviewData);
      } else {
        return await apiRequest("POST", "/api/reviews", reviewData);
      }
    },
    onSuccess: () => {
      toast({
        title: existingReview ? "Review Updated" : "Review Submitted",
        description: "Thank you for your feedback!",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/class/${classItem.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/reviews/coach/${coach.id}`] });
      
      if (onClose) {
        onClose();
      } else {
        navigate("/bookings");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return "Unknown date";
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, "EEEE, MMMM d, yyyy");
  };

  const formatTime = (dateValue: string | Date | null) => {
    if (!dateValue) return "Unknown time";
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    return format(date, "h:mm a");
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate("/bookings");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">
          {existingReview ? "Edit Your Review" : "Rate Your Experience"}
        </h1>
        <p className="text-muted-foreground">
          How was your experience with this fitness class?
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          {/* Class Information */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 space-y-4">
            <h2 className="font-bold text-xl text-foreground">{classItem.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <UserIcon className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Coach</p>
                  <p className="text-muted-foreground">{coach.firstName} {coach.lastName}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-muted-foreground">{formatDate(classItem.startTime)} at {formatTime(classItem.startTime)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-primary" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">{classItem.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="h-5 w-5 mr-3 flex items-center justify-center">
                  <Badge variant="secondary" className="text-sm">${classItem.price}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-2">
          {/* Rating Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Overall Rating</h3>
              <p className="text-sm text-muted-foreground mb-4">
                How would you rate this class overall?
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-4 py-4">
              <StarRating 
                rating={rating} 
                onRatingChange={setRating} 
                size="lg" 
                className="justify-center"
              />
              <p className="text-lg font-medium text-center">
                {rating === 0 && "Select a rating"}
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            </div>
          </div>
          
          {/* Comment Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
              <p className="text-sm text-muted-foreground">
                Tell other customers about your experience (optional)
              </p>
            </div>
            
            <Textarea
              placeholder="What did you like about this class? How was the coach? Would you recommend it to others?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              className="min-h-[120px] resize-none"
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 characters
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              onClick={() => submitReviewMutation.mutate()}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="flex-1 h-12 text-base font-medium"
              size="lg"
            >
              {submitReviewMutation.isPending 
                ? (existingReview ? "Updating..." : "Submitting...") 
                : (existingReview ? "Update Review" : "Submit Review")
              }
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={submitReviewMutation.isPending}
              className="h-12 text-base"
              size="lg"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}