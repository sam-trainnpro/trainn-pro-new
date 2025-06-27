import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarRange } from 'lucide-react';

export type EditOption = 'this' | 'following';

interface EditRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: EditOption) => void;
  classTitle: string;
}

export function EditRecurringModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classTitle 
}: EditRecurringModalProps) {
  const handleOptionSelect = (option: EditOption) => {
    onConfirm(option);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="edit-recurring-description">
        <DialogHeader>
          <DialogTitle>Edit Recurring Class</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p id="edit-recurring-description" className="text-sm text-gray-600">
            "{classTitle}" is part of a recurring series. What would you like to edit?
          </p>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleOptionSelect('this')}
            >
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 mt-0.5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">This class</div>
                  <div className="text-sm text-gray-500">
                    Edit only this single class instance
                  </div>
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start h-auto p-4"
              onClick={() => handleOptionSelect('following')}
            >
              <div className="flex items-start space-x-3">
                <CalendarRange className="h-5 w-5 mt-0.5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">This and following classes</div>
                  <div className="text-sm text-gray-500">
                    Edit this class and all future instances in the series
                  </div>
                </div>
              </div>
            </Button>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}