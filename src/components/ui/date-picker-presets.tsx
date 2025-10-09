'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  endOfMonth,
  endOfYear,
  format,
  isEqual,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

export interface DatePickerPreset {
  label: string;
  range: DateRange;
}

interface DatePickerPresetsProps {
  date?: DateRange;
  onDateChange?: (date: DateRange | undefined) => void;
  presets?: DatePickerPreset[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  numberOfMonths?: number;
}

const defaultPresets: DatePickerPreset[] = [
  { 
    label: 'วันนี้', 
    range: { from: new Date(), to: new Date() } 
  },
  {
    label: 'เมื่อวาน',
    range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) },
  },
  { 
    label: '7 วันที่แล้ว', 
    range: { from: subDays(new Date(), 6), to: new Date() } 
  },
  { 
    label: '30 วันที่แล้ว', 
    range: { from: subDays(new Date(), 29), to: new Date() } 
  },
  { 
    label: 'เดือนนี้', 
    range: { from: startOfMonth(new Date()), to: new Date() } 
  },
  {
    label: 'เดือนที่แล้ว',
    range: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    },
  },
  { 
    label: 'ปีนี้', 
    range: { from: startOfYear(new Date()), to: new Date() } 
  },
  {
    label: 'ปีที่แล้ว',
    range: {
      from: startOfYear(subYears(new Date(), 1)),
      to: endOfYear(subYears(new Date(), 1)),
    },
  },
];

export function DatePickerPresets({
  date,
  onDateChange,
  presets = defaultPresets,
  placeholder = 'เลือกช่วงวันที่',
  className,
  buttonClassName,
  numberOfMonths = 2,
}: DatePickerPresetsProps) {
  const today = new Date();
  const [month, setMonth] = useState(today);
  const [internalDate, setInternalDate] = useState<DateRange | undefined>(date);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Sync with external date changes
  useEffect(() => {
    setInternalDate(date);
  }, [date]);

  const handleApply = () => {
    if (internalDate) {
      onDateChange?.(internalDate);
    }
    setIsPopoverOpen(false);
  };

  const handleReset = () => {
    setInternalDate(undefined);
    setSelectedPreset(null);
    onDateChange?.(undefined);
    setIsPopoverOpen(false);
  };

  const handleSelect = (selected: DateRange | undefined) => {
    setInternalDate({
      from: selected?.from || undefined,
      to: selected?.to || undefined,
    });
    setSelectedPreset(null); // Clear preset when manually selecting a range
  };

  // Update `selectedPreset` whenever `internalDate` changes
  useEffect(() => {
    if (internalDate?.from && internalDate?.to) {
      const matchedPreset = presets.find(
        (preset) =>
          preset.range.from &&
          preset.range.to &&
          isEqual(startOfDay(preset.range.from), startOfDay(internalDate.from!)) &&
          isEqual(startOfDay(preset.range.to), startOfDay(internalDate.to!)),
      );
      setSelectedPreset(matchedPreset?.label || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalDate]);

  const formatDateDisplay = () => {
    if (!internalDate?.from) {
      return <span>{placeholder}</span>;
    }
    
    if (internalDate.to) {
      return (
        <>
          {format(internalDate.from, 'dd/MM/yyyy')} - {format(internalDate.to, 'dd/MM/yyyy')}
        </>
      );
    }
    
    return format(internalDate.from, 'dd/MM/yyyy');
  };

  return (
    <div className={className}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            mode="input"
            placeholder={!internalDate?.from && !internalDate?.to}
            className={cn('w-full justify-start text-left font-normal', buttonClassName)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateDisplay()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex max-sm:flex-col">
            <div className="relative border-border max-sm:order-1 max-sm:border-t sm:w-32">
              <div className="h-full border-border sm:border-e py-2">
                <div className="flex flex-col px-2 gap-[2px]">
                  {presets.map((preset, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 w-full justify-start text-xs',
                        selectedPreset === preset.label && 'bg-accent'
                      )}
                      onClick={() => {
                        setInternalDate(preset.range);

                        // Update the calendar to show the starting month of the selected range
                        setMonth(preset.range.from || today);

                        setSelectedPreset(preset.label); // Explicitly set the active preset
                      }}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <Calendar
              autoFocus
              mode="range"
              month={month}
              onMonthChange={setMonth}
              showOutsideDays={false}
              selected={internalDate}
              onSelect={handleSelect}
              numberOfMonths={numberOfMonths}
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 border-t border-border p-3">
            <Button variant="outline" size="sm" onClick={handleReset}>
              รีเซ็ต
            </Button>
            <Button size="sm" onClick={handleApply}>
              ใช้งาน
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}