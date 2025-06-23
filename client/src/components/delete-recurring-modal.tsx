import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type DeleteOption = 'this' | 'following';

interface DeleteRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: DeleteOption) => void;
  classTitle: string;
}

export function DeleteRecurringModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classTitle 
}: DeleteRecurringModalProps) {
  const [selectedOption, setSelectedOption] = React.useState<DeleteOption>('this');

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Delete recurring class</DialogTitle>
          <DialogDescription>
            "{classTitle}" is part of a recurring series. How would you like to delete it?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            value={selectedOption} 
            onValueChange={(value) => setSelectedOption(value as DeleteOption)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this" id="this" />
              <Label htmlFor="this" className="font-normal">
                This class
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="following" id="following" />
              <Label htmlFor="following" className="font-normal">
                This and following classes
              </Label>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}