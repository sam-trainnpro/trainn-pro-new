import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Copy, Trash2, Clock, MapPin, Users, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Link } from 'wouter';

interface Class {
  id: number;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  price: number;
  image?: string;
  categoryId: number;
  coachId: number;
  isRecurring: boolean;
  parentClassId?: number;
  recurringSeriesId?: string;
  maxParticipants?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  whatToBring?: string;
  createdAt?: string;
}

interface ClassDetailModalProps {
  classItem: Class | null;
  isOpen: boolean;
  onClose: () => void;
  onDuplicate: (classId: number) => void;
  onDelete: (classItem: Class) => void;
  bookingCount?: { active: number; total: number };
}

export default function ClassDetailModal({ 
  classItem, 
  isOpen, 
  onClose, 
  onDuplicate, 
  onDelete,
  bookingCount 
}: ClassDetailModalProps) {
  if (!classItem) return null;

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), 'h:mm a');
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
  };

  const handleDuplicate = () => {
    onDuplicate(classItem.id);
    onClose();
  };

  const handleDelete = () => {
    onDelete(classItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {classItem.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class Image */}
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
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
          </div>

          {/* Class Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatDate(classItem.startTime)}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{classItem.location}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>
                {bookingCount?.active || 0} / {classItem.capacity || classItem.maxParticipants} participants
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>${classItem.price}</span>
            </div>
          </div>

          {/* Description */}
          {classItem.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-gray-600">{classItem.description}</p>
            </div>
          )}

          {/* What to Bring */}
          {classItem.whatToBring && (
            <div>
              <h4 className="font-medium mb-2">What to Bring</h4>
              <p className="text-sm text-gray-600">{classItem.whatToBring}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Link href={`/edit-class/${classItem.id}`} className="flex-1">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              onClick={handleDuplicate}
              className="flex-1 flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDelete}
              className="flex-1 flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}