import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  endType: 'date' | 'count';
  endDate?: Date;
  endCount?: number;
}

interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RecurrenceRule) => void;
  initialRule?: RecurrenceRule;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function RecurrenceModal({ isOpen, onClose, onSave, initialRule }: RecurrenceModalProps) {
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>(initialRule?.type || 'weekly');
  const [interval, setInterval] = useState(initialRule?.interval || 1);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialRule?.daysOfWeek || []);
  const [endType, setEndType] = useState<'date' | 'count'>(initialRule?.endType || 'date');
  const [endDate, setEndDate] = useState<Date | undefined>(initialRule?.endDate);
  const [endCount, setEndCount] = useState(initialRule?.endCount || 10);

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const handleSave = () => {
    const rule: RecurrenceRule = {
      type: recurrenceType,
      interval,
      endType,
      ...(recurrenceType === 'weekly' && { daysOfWeek }),
      ...(endType === 'date' && { endDate }),
      ...(endType === 'count' && { endCount })
    };
    onSave(rule);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial values
    setRecurrenceType(initialRule?.type || 'weekly');
    setInterval(initialRule?.interval || 1);
    setDaysOfWeek(initialRule?.daysOfWeek || []);
    setEndType(initialRule?.endType || 'date');
    setEndDate(initialRule?.endDate);
    setEndCount(initialRule?.endCount || 10);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom recurrence</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Repeat every */}
          <div className="flex items-center space-x-2">
            <Label className="text-sm font-medium">Repeat every</Label>
            <Input
              type="number"
              min="1"
              max="99"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
              className="w-16 text-center"
            />
            <Select value={recurrenceType} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setRecurrenceType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">day</SelectItem>
                <SelectItem value="weekly">week</SelectItem>
                <SelectItem value="monthly">month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Repeat on (days of week) - only show for weekly */}
          {recurrenceType === 'weekly' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Repeat on</Label>
              <div className="flex space-x-1">
                {dayLabels.map((label, index) => (
                  <Button
                    key={index}
                    variant={daysOfWeek.includes(index) ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0 rounded-full"
                    onClick={() => toggleDayOfWeek(index)}
                    type="button"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Ends */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ends</Label>
            <RadioGroup value={endType} onValueChange={(value: 'date' | 'count') => setEndType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="date" id="end-date" />
                <Label htmlFor="end-date" className="text-sm">On</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`text-left font-normal ${!endDate && "text-muted-foreground"}`}
                      disabled={endType !== 'date'}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="count" id="end-count" />
                <Label htmlFor="end-count" className="text-sm">After</Label>
                <Input
                  type="number"
                  min="1"
                  max="999"
                  value={endCount}
                  onChange={(e) => setEndCount(parseInt(e.target.value) || 10)}
                  className="w-16 text-center"
                  disabled={endType !== 'count'}
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}