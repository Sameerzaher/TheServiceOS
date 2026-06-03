"use client";

import { useCallback, useMemo } from "react";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { he } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { AppointmentStatus } from "@/core/types/appointment";

const locales = {
  he: he,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: he }),
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  resource: {
    appointmentId: string;
    clientId: string;
    status: AppointmentStatus;
    amount: number;
    isPaid: boolean;
  };
}

interface AppointmentCalendarProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  onSelectEvent?: (appointmentId: string) => void;
  onSelectSlot?: (start: Date, end: Date) => void;
}

export function AppointmentCalendar({
  appointments,
  clients,
  onSelectEvent,
  onSelectSlot,
}: AppointmentCalendarProps) {
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((appt) => {
      const client = clients.find((c) => c.id === appt.clientId);
      const clientName = client?.fullName || "לקוח";
      
      return {
        title: clientName,
        start: new Date(appt.startAt),
        end: appt.customFields?.bookingSlotEnd
          ? new Date(appt.customFields.bookingSlotEnd as string)
          : new Date(new Date(appt.startAt).getTime() + 45 * 60 * 1000),
        resource: {
          appointmentId: appt.id,
          clientId: appt.clientId,
          status: appt.status,
          amount: appt.amount,
          isPaid: appt.paymentStatus === "paid",
        },
      };
    });
  }, [appointments, clients]);

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (onSelectEvent) {
        onSelectEvent(event.resource.appointmentId);
      }
    },
    [onSelectEvent]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (onSelectSlot) {
        onSelectSlot(start, end);
      }
    },
    [onSelectSlot]
  );

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const { status, isPaid } = event.resource;
    
    let backgroundColor = "#3b82f6";
    let borderColor = "#2563eb";
    
    switch (status) {
      case AppointmentStatus.Confirmed:
        backgroundColor = isPaid ? "#059669" : "#10b981";
        borderColor = isPaid ? "#047857" : "#059669";
        break;
      case AppointmentStatus.Completed:
        backgroundColor = "#6b7280";
        borderColor = "#4b5563";
        break;
      case AppointmentStatus.Cancelled:
        backgroundColor = "#ef4444";
        borderColor = "#dc2626";
        break;
      case AppointmentStatus.NoShow:
        backgroundColor = "#f97316";
        borderColor = "#ea580c";
        break;
      case AppointmentStatus.Scheduled:
        backgroundColor = "#0ea5e9";
        borderColor = "#0284c7";
        break;
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        color: "white",
        borderRadius: "6px",
        fontSize: "13px",
        fontWeight: 600,
        padding: "2px 6px",
      },
    };
  }, []);

  const messages = {
    allDay: "כל היום",
    previous: "קודם",
    next: "הבא",
    today: "היום",
    month: "חודש",
    week: "שבוע",
    day: "יום",
    agenda: "אג׳נדה",
    date: "תאריך",
    time: "שעה",
    event: "אירוע",
    noEventsInRange: "אין תורים בטווח זה",
    showMore: (total: number) => `+${total} נוספים`,
  };

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-4" style={{ height: "500px" }}>
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
          font-size: 11px;
        }
        
        @media (min-width: 640px) {
          .rbc-calendar {
            font-size: 13px;
          }
        }
        
        .rbc-header {
          padding: 6px 2px;
          font-weight: 600;
          font-size: 10px;
        }
        
        @media (min-width: 640px) {
          .rbc-header {
            padding: 8px 4px;
            font-size: 12px;
          }
        }
        
        .rbc-event {
          padding: 1px 3px !important;
          font-size: 10px !important;
        }
        
        @media (min-width: 640px) {
          .rbc-event {
            padding: 2px 6px !important;
            font-size: 12px !important;
          }
        }
        
        .rbc-toolbar {
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
          padding: 4px;
        }
        
        .rbc-toolbar button {
          padding: 4px 8px;
          font-size: 11px;
          border-radius: 6px;
        }
        
        @media (min-width: 640px) {
          .rbc-toolbar button {
            padding: 6px 12px;
            font-size: 13px;
          }
        }
        
        .rbc-btn-group {
          display: flex;
          gap: 4px;
        }
        
        .rbc-month-view, .rbc-time-view {
          border: 1px solid rgb(229 231 235);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .dark .rbc-month-view, .dark .rbc-time-view {
          border-color: rgb(64 64 64);
        }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        selectable
        eventPropGetter={eventStyleGetter}
        messages={messages}
        culture="he"
        rtl
        views={["month", "week", "day", "agenda"]}
        defaultView="week"
        step={30}
        timeslots={2}
      />
    </div>
  );
}
