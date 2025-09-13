import * as React from "react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({ date, setDate }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={"w-full justify-start text-right font-normal"}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          {date ? format(new Date(date), "PPP", { locale: he }) : <span>בחר תאריך</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date ? new Date(date) : null}
          onSelect={setDate}
          initialFocus
          dir="rtl"
        />
      </PopoverContent>
    </Popover>
  );
}