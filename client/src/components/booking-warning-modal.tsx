import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface BookingWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  classTitle: string;
  activeBookings: number;
}

export default function BookingWarningModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classTitle,
  activeBookings 
}: BookingWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Warning: Active Bookings
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">"{classTitle}"</span> has {activeBookings} active booking{activeBookings > 1 ? 's' : ''}. 
            Deleting this class will automatically cancel {activeBookings > 1 ? 'these bookings' : 'this booking'} and notify 
            the customer{activeBookings > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onConfirm}
            variant="outline"
            className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200 hover:text-gray-800"
          >
            Delete Anyways
          </Button>
          <Button 
            onClick={onClose}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}