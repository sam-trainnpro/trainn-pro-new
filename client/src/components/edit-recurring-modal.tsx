import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type EditOption = "this" | "following";

interface EditRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: EditOption) => void;
  classTitle: string;
}

export default function EditRecurringModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  classTitle 
}: EditRecurringModalProps) {
  const [selectedOption, setSelectedOption] = useState<EditOption>("this");

  const handleConfirm = () => {
    onConfirm(selectedOption);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle>Edit recurring class</DialogTitle>
          <DialogDescription>
            "{classTitle}" is part of a recurring series. How would you like to apply these changes?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <RadioGroup 
            value={selectedOption} 
            onValueChange={(value) => setSelectedOption(value as EditOption)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this" id="this" />
              <Label htmlFor="this" className="font-normal">
                This class only
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
          <Button onClick={handleConfirm} className="bg-primary text-white">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}