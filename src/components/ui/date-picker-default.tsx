'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatePickerDefaultProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  showReset?: boolean;
}

export function DatePickerDefault({
  date,
  onDateChange,
  placeholder = 'เลือกวันที่',
  className,
  buttonClassName,
  showReset = true,
}: DatePickerDefaultProps) {
  const [open, setOpen] = React.useState(false);

  const handleReset = (e: React.MouseEvent<HTMLElement>) => {
    onDateChange?.(undefined);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Button 
            type="button" 
            variant="outline" 
            mode="input" 
            placeholder={!date} 
            className={cn('w-full', buttonClassName)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'dd/MM/yyyy') : <span>{placeholder}</span>}
          </Button>
          {date && showReset && (
            <Button
              type="button"
              variant="dim"
              size="sm"
              className="absolute top-1/2 -end-0 -translate-y-1/2"
              onClick={handleReset}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar 
          mode="single" 
          selected={date} 
          onSelect={(newDate) => {
            onDateChange?.(newDate);
            setOpen(false);
          }} 
          autoFocus 
        />
      </PopoverContent>
    </Popover>
  );
}

// Export as default for backward compatibility
export default DatePickerDefault;

