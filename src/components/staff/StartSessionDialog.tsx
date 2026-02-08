/**
 * Start Session Dialog
 * Configure and start a new table session
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Play } from 'lucide-react';
import type { SeatingType } from '@/types/staff';
import { SEATING_TYPE_LABELS } from '@/types/staff';

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableLabel: string;
  onConfirm: (seatingType: SeatingType, baseMinutes: number) => Promise<void>;
}

const TIME_OPTIONS = [
  { value: 40, label: '40分' },
  { value: 60, label: '60分' },
  { value: 90, label: '90分' },
];

export default function StartSessionDialog({
  open,
  onOpenChange,
  tableLabel,
  onConfirm,
}: StartSessionDialogProps) {
  const [seatingType, setSeatingType] = useState<SeatingType>('free');
  const [baseMinutes, setBaseMinutes] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(seatingType, baseMinutes);
      onOpenChange(false);
      // Reset state
      setSeatingType('free');
      setBaseMinutes(40);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>セッション開始 - {tableLabel}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Seating Type */}
          <div className="space-y-3">
            <Label>席タイプ</Label>
            <RadioGroup
              value={seatingType}
              onValueChange={(v) => setSeatingType(v as SeatingType)}
              className="grid grid-cols-3 gap-3"
            >
              {(['free', 'designated', 'inhouse'] as SeatingType[]).map((type) => (
                <div key={type}>
                  <RadioGroupItem
                    value={type}
                    id={`seating-${type}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`seating-${type}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-sm font-medium">
                      {SEATING_TYPE_LABELS[type]}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label>セット時間</Label>
            <RadioGroup
              value={baseMinutes.toString()}
              onValueChange={(v) => setBaseMinutes(parseInt(v))}
              className="grid grid-cols-3 gap-3"
            >
              {TIME_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value.toString()}
                    id={`time-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`time-${option.value}`}
                    className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            開始
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
