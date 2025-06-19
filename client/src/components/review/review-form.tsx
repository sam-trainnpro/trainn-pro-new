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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-xl">
              {existingReview ? "Edit Review" : "Add Review"}
            </CardTitle>
          </div>
          
          {/* Class Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">{classItem.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-primary" />
                <span>Coach {coach.firstName} {coach.lastName}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>{formatDate(classItem.startTime)} at {formatTime(classItem.startTime)}</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span>{classItem.location}</span>
              </div>
              
              <div className="flex items-center">
                <Badge variant="outline">${classItem.price}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <StarRating 
                rating={rating} 
                onRatingChange={setRating} 
                size="lg" 
              />
              <span className="text-sm text-muted-foreground">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : "Select a rating"}
              </span>
            </div>
          </div>
          
          {/* Comment Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Review (Optional)
            </label>
            <Textarea
              placeholder="Share your experience with this class..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              className="min-h-[100px]"
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/1000 characters
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => submitReviewMutation.mutate()}
              disabled={rating === 0 || submitReviewMutation.isPending}
              className="flex-1"
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
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}