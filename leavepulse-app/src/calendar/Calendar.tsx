import { useEffect, useState } from "react";
import BreadCrumb from "../breadcrumb/Breadcrumb";
import { Calendar as ReactCalendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar.css";
import {
  getCalendarEvents,
  type CalendarEventsResponse,
} from "../services/employeesService";

const localizer = momentLocalizer(moment);

type EventResource = "request" | "team_request" | "holiday";

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: EventResource;
};

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const exclusiveEndDate = (inclusiveEnd: Date) => {
  const end = new Date(inclusiveEnd);
  end.setDate(end.getDate() + 1);
  return end;
};

const mapCalendarEvents = (data: CalendarEventsResponse): CalendarEvent[] => {
  const myRequests = data.my_requests.map((item) => {
    const start = parseLocalDate(item.start_date);
    const end = exclusiveEndDate(parseLocalDate(item.end_date));
    return {
      title: item.leave_type,
      start,
      end,
      allDay: true,
      resource: "request" as const,
    };
  });

  const teamRequests = (data.team_requests ?? []).map((item) => {
    const start = parseLocalDate(item.start_date);
    const end = exclusiveEndDate(parseLocalDate(item.end_date));
    return {
      title: `${item.leave_type} Leave by ${item.employee_name}`,
      start,
      end,
      allDay: true,
      resource: "team_request" as const,
    };
  });

  const holidays = data.holidays.map((item) => {
    const start = parseLocalDate(item.date);
    const end = exclusiveEndDate(start);
    return {
      title: item.name,
      start,
      end,
      allDay: true,
      resource: "holiday" as const,
    };
  });

  return [...myRequests, ...teamRequests, ...holidays];
};

const Calendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const response = await getCalendarEvents();
        setEvents(mapCalendarEvents(response.data));
      } catch (error) {
        console.error(error);
      }
    };

    fetchCalendarEvents();
  }, []);

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors: Record<
      EventResource,
      { backgroundColor: string; borderColor: string }
    > = {
      request: { backgroundColor: "#2d7474", borderColor: "#2d7474" },
      team_request: { backgroundColor: "#4a90a4", borderColor: "#4a90a4" },
      holiday: { backgroundColor: "#e8a838", borderColor: "#e8a838" },
    };

    const style = colors[event.resource];

    return {
      style: {
        ...style,
        borderRadius: "4px",
        color: "white",
        border: "none",
        padding: "2px 6px",
        fontSize: "0.875rem",
      },
    };
  };

  return (
    <>
      <BreadCrumb title="Calendar Module" path="Calendar" />

      <div className="calendar_section">
        <ReactCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          eventPropGetter={eventStyleGetter}
          style={{ height: 600 }}
        />
      </div>
    </>
  );
};

export default Calendar;
