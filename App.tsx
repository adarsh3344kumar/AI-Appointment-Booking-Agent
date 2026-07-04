import { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  MessageSquare,
  Users,
  Send,
  Stethoscope,
  Brain,
  Heart,
  Eye,
  Star,
  ChevronRight,
  Search,
  Bell,
  Settings,
  MoreHorizontal,
  Check,
  Award,
  MapPin,
  Activity,
  Shield,
  Zap,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowStage =
  | "WELCOME"
  | "COLLECTING_NAME"
  | "COLLECTING_PHONE"
  | "DOCTOR_SEARCH"
  | "SELECTING_SLOT"
  | "CONFIRMING"
  | "CONFIRMED";

type AppView = "chat" | "appointments" | "doctors";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  quickReplies?: string[];
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  rating: number;
  reviews: number;
  experience: number;
  nextAvailable: string;
  color: string;
  initials: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface Appointment {
  id: string;
  doctorName: string;
  doctorInitials: string;
  doctorColor: string;
  specialty: string;
  date: string;
  time: string;
  status: "upcoming" | "completed" | "cancelled";
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DOCTORS: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Sarah Chen",
    specialty: "Cardiologist",
    department: "Cardiology",
    rating: 4.9,
    reviews: 342,
    experience: 12,
    nextAvailable: "Today, 2:30 PM",
    color: "#1A3665",
    initials: "SC",
  },
  {
    id: "d2",
    name: "Dr. Marcus Webb",
    specialty: "Neurologist",
    department: "Neurology",
    rating: 4.8,
    reviews: 218,
    experience: 15,
    nextAvailable: "Tomorrow, 10:00 AM",
    color: "#6D28D9",
    initials: "MW",
  },
  {
    id: "d3",
    name: "Dr. Priya Sharma",
    specialty: "General Physician",
    department: "General Medicine",
    rating: 4.7,
    reviews: 456,
    experience: 8,
    nextAvailable: "Today, 4:00 PM",
    color: "#0AB08A",
    initials: "PS",
  },
  {
    id: "d4",
    name: "Dr. James Okonkwo",
    specialty: "Orthopedic Surgeon",
    department: "Orthopedics",
    rating: 4.9,
    reviews: 189,
    experience: 18,
    nextAvailable: "Jul 6, 9:00 AM",
    color: "#D97706",
    initials: "JO",
  },
  {
    id: "d5",
    name: "Dr. Elena Vasquez",
    specialty: "Ophthalmologist",
    department: "Ophthalmology",
    rating: 4.8,
    reviews: 274,
    experience: 10,
    nextAvailable: "Tomorrow, 2:00 PM",
    color: "#DB2777",
    initials: "EV",
  },
  {
    id: "d6",
    name: "Dr. Robert Kim",
    specialty: "Pediatrician",
    department: "Pediatrics",
    rating: 4.9,
    reviews: 512,
    experience: 20,
    nextAvailable: "Today, 11:30 AM",
    color: "#059669",
    initials: "RK",
  },
];

const TIME_SLOTS: TimeSlot[] = [
  { time: "9:00 AM", available: false },
  { time: "9:30 AM", available: true },
  { time: "10:00 AM", available: false },
  { time: "10:30 AM", available: true },
  { time: "11:00 AM", available: true },
  { time: "11:30 AM", available: false },
  { time: "2:00 PM", available: true },
  { time: "2:30 PM", available: true },
  { time: "3:00 PM", available: false },
  { time: "3:30 PM", available: true },
  { time: "4:00 PM", available: true },
  { time: "4:30 PM", available: false },
];

const AVAILABLE_DATES = [
  "Sat, Jul 5",
  "Sun, Jul 6",
  "Mon, Jul 7",
  "Tue, Jul 8",
  "Wed, Jul 9",
];

const APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    doctorName: "Dr. Sarah Chen",
    doctorInitials: "SC",
    doctorColor: "#1A3665",
    specialty: "Cardiologist",
    date: "Jul 8, 2026",
    time: "2:00 PM",
    status: "upcoming",
  },
  {
    id: "a2",
    doctorName: "Dr. Priya Sharma",
    doctorInitials: "PS",
    doctorColor: "#0AB08A",
    specialty: "General Physician",
    date: "Jun 20, 2026",
    time: "10:30 AM",
    status: "completed",
  },
  {
    id: "a3",
    doctorName: "Dr. Marcus Webb",
    doctorInitials: "MW",
    doctorColor: "#6D28D9",
    specialty: "Neurologist",
    date: "May 15, 2026",
    time: "11:00 AM",
    status: "completed",
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "m0",
    role: "ai",
    content:
      "Hello! I'm **Avatar**, your AI medical receptionist at City Medical Center.\n\nI can help you **book**, **reschedule**, or **cancel** appointments — and answer questions about our physicians.\n\nHow can I assist you today?",
    timestamp: new Date(Date.now() - 60000),
    quickReplies: [
      "Book an appointment",
      "View my appointments",
      "Find a doctor",
      "Cancel appointment",
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const renderContent = (text: string) => {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/);
    return (
      <span key={i} className={i > 0 ? "block mt-1" : "block"}>
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </span>
    );
  });
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const specialtyIcon = (specialty: string) => {
  const s = specialty.toLowerCase();
  if (s.includes("cardio")) return Heart;
  if (s.includes("neuro")) return Brain;
  if (s.includes("ophthal")) return Eye;
  if (s.includes("ortho")) return Activity;
  if (s.includes("general")) return Stethoscope;
  return Stethoscope;
};

// ─── Flow Stage Steps ─────────────────────────────────────────────────────────

const FLOW_STEPS: { key: FlowStage; label: string }[] = [
  { key: "COLLECTING_NAME", label: "Name" },
  { key: "COLLECTING_PHONE", label: "Phone" },
  { key: "DOCTOR_SEARCH", label: "Doctor" },
  { key: "SELECTING_SLOT", label: "Slot" },
  { key: "CONFIRMING", label: "Confirm" },
  { key: "CONFIRMED", label: "Done" },
];

const ACTIVE_STAGES: FlowStage[] = [
  "COLLECTING_NAME",
  "COLLECTING_PHONE",
  "DOCTOR_SEARCH",
  "SELECTING_SLOT",
  "CONFIRMING",
  "CONFIRMED",
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<AppView>("chat");
  const [stage, setStage] = useState<FlowStage>("WELCOME");
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [patientName, setPatientName] = useState("Alex Johnson");
  const [isTyping, setIsTyping] = useState(false);
  const [docSearch, setDocSearch] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>(APPOINTMENTS);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addMsg = (
    role: "ai" | "user",
    content: string,
    quickReplies?: string[]
  ) => {
    setMessages((prev) => [
      ...prev,
      { id: `m${Date.now()}`, role, content, timestamp: new Date(), quickReplies },
    ]);
  };

  const aiRespond = async (content: string, quickReplies?: string[]) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
    setIsTyping(false);
    addMsg("ai", content, quickReplies);
  };

  const handleDoctorSelect = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStage("SELECTING_SLOT");
    setSelectedSlot(null);
    addMsg("user", `I'd like to see ${doctor.name}`);
    await aiRespond(
      `Great choice! **${doctor.name}** is a ${doctor.specialty} with a **${doctor.rating}★** rating and ${doctor.experience} years of experience.\n\nNext available: **${doctor.nextAvailable}**\n\nPlease select your **preferred date and time** from the slots panel →`
    );
  };

  const handleSlotSelect = async (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot.time);
    setStage("CONFIRMING");
    const date = AVAILABLE_DATES[selectedDateIdx];
    addMsg("user", `${slot.time} on ${date} please`);
    await aiRespond(
      `Perfect! Here is your **booking summary**:\n\n**Patient:** ${patientName}\n**Doctor:** ${selectedDoctor?.name}\n**Specialty:** ${selectedDoctor?.specialty}\n**Date:** ${date}\n**Time:** ${slot.time}\n**Location:** City Medical Center, Room 204\n\nShall I **confirm this appointment**?`,
      ["Yes, confirm booking", "Choose a different time"]
    );
  };

  const handleConfirmBooking = async () => {
    setStage("CONFIRMED");
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsTyping(false);
    if (selectedDoctor && selectedSlot) {
      const newAppt: Appointment = {
        id: `a${Date.now()}`,
        doctorName: selectedDoctor.name,
        doctorInitials: selectedDoctor.initials,
        doctorColor: selectedDoctor.color,
        specialty: selectedDoctor.specialty,
        date: `${AVAILABLE_DATES[selectedDateIdx]}, 2026`,
        time: selectedSlot,
        status: "upcoming",
      };
      setAppointments((prev) => [newAppt, ...prev]);
    }
    addMsg(
      "ai",
      "**Appointment Confirmed!**\n\nYour appointment has been successfully booked and saved to the database.\n\n**Confirmation email** has been sent to your inbox.\n**Google Calendar** event has been created.\n\nIs there anything else I can help you with?",
      ["Book another appointment", "View my appointments"]
    );
  };

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput("");
    addMsg("user", msg);
    const lower = msg.toLowerCase();

    if (stage === "WELCOME") {
      const isSpecialty = DOCTORS.some(
        (d) =>
          d.specialty.toLowerCase().includes(lower) ||
          d.department.toLowerCase().includes(lower)
      );
      if (lower.includes("book") || lower.includes("appointment") || isSpecialty) {
        setStage("COLLECTING_NAME");
        await aiRespond(
          "I'd love to help you book an appointment!\n\nLet's start with your **full name** please."
        );
      } else if (lower.includes("view") || lower.includes("my appoint")) {
        setView("appointments");
        await aiRespond(
          "I've opened your **appointments** tab. Would you like to reschedule or book a new one?"
        );
      } else if (lower.includes("find") || lower.includes("doctor")) {
        setView("doctors");
        await aiRespond(
          "Here are all the physicians at our clinic. Would you like to book with any of them?"
        );
      } else if (lower.includes("cancel")) {
        setStage("COLLECTING_NAME");
        await aiRespond(
          "I can help you cancel an appointment. Could you tell me your **full name** so I can look up your bookings?"
        );
      } else {
        await aiRespond(
          "I'm here to help! I can assist you with:\n\n**• Booking** a new appointment\n**• Viewing** your appointments\n**• Finding** the right doctor\n**• Cancelling** an appointment",
          ["Book an appointment", "View my appointments", "Find a doctor"]
        );
      }
    } else if (stage === "COLLECTING_NAME") {
      setPatientName(msg);
      setStage("COLLECTING_PHONE");
      await aiRespond(
        `Nice to meet you, **${msg}**!\n\nCould you share your **phone number** so we can send appointment confirmations?`
      );
    } else if (stage === "COLLECTING_PHONE") {
      setStage("DOCTOR_SEARCH");
      await aiRespond(
        `Thank you, **${patientName}**!\n\nWhich **department or doctor** would you like to see? You can type a specialty or browse the doctors in the panel on the right →`,
        ["Cardiology", "General Medicine", "Neurology", "Orthopedics"]
      );
    } else if (stage === "DOCTOR_SEARCH") {
      const found = DOCTORS.find(
        (d) =>
          d.name.toLowerCase().includes(lower) ||
          d.specialty.toLowerCase().includes(lower) ||
          d.department.toLowerCase().includes(lower)
      );
      if (found) {
        await handleDoctorSelect(found);
      } else {
        await aiRespond(
          "I found several doctors for you. Please **click on a doctor** in the panel on the right, or try a specialty name.",
          ["Cardiology", "General Medicine", "Orthopedics", "Neurology"]
        );
      }
    } else if (stage === "SELECTING_SLOT") {
      await aiRespond(
        "Please select a **date and time slot** from the panel on the right →"
      );
    } else if (stage === "CONFIRMING") {
      if (
        lower.includes("confirm") ||
        lower === "yes" ||
        lower.includes("book it") ||
        lower.includes("yes,")
      ) {
        await handleConfirmBooking();
      } else {
        setStage("SELECTING_SLOT");
        setSelectedSlot(null);
        await aiRespond(
          "No problem! Please select a different **date and time** from the panel on the right →"
        );
      }
    } else if (stage === "CONFIRMED") {
      if (lower.includes("book another") || lower.includes("new appointment")) {
        setStage("COLLECTING_NAME");
        setSelectedDoctor(null);
        setSelectedSlot(null);
        await aiRespond(
          "Of course! Let's book another appointment.\n\nCould you confirm your **full name**?"
        );
      } else if (lower.includes("view")) {
        setView("appointments");
        await aiRespond("I've opened your appointments. All confirmed bookings are listed there.");
      } else {
        await aiRespond(
          "Is there anything else I can help you with?",
          ["Book another appointment", "View my appointments", "Find a doctor"]
        );
      }
    }
  };

  const filteredDoctors = DOCTORS.filter(
    (d) =>
      docSearch === "" ||
      d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.specialty.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.department.toLowerCase().includes(docSearch.toLowerCase())
  );

  const currentStepIdx = FLOW_STEPS.findIndex((s) => s.key === stage);
  const isBookingFlow = ACTIVE_STAGES.includes(stage);

  // ─── Context Panel ───────────────────────────────────────────────────────────

  const renderContextPanel = () => {
    if (stage === "CONFIRMED" && selectedDoctor && selectedSlot) {
      return (
        <div className="p-5 flex flex-col gap-4">
          <div className="text-center py-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: "#E6FAF5" }}>
              <CheckCircle className="w-8 h-8" style={{ color: "#0AB08A" }} />
            </div>
            <h3 className="text-base font-bold text-foreground">Booking Confirmed!</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Confirmation sent · Calendar event created
            </p>
          </div>
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-border">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: selectedDoctor.color }}
              >
                {selectedDoctor.initials}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{selectedDoctor.name}</p>
                <p className="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-amber-600">{selectedDoctor.rating}</span>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { icon: User, label: "Patient", value: patientName },
                { icon: Calendar, label: "Date", value: AVAILABLE_DATES[selectedDateIdx] },
                { icon: Clock, label: "Time", value: selectedSlot },
                { icon: MapPin, label: "Location", value: "City Medical Center, Rm 204" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground text-xs">{label}</span>
                  <span className="font-medium text-foreground ml-auto text-xs text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-secondary rounded-xl p-3 flex items-start gap-2.5">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#1A3665" }} />
            <p className="text-xs text-secondary-foreground leading-relaxed">
              Your appointment ID is <strong>#CMC-{Math.floor(Math.random() * 9000) + 1000}</strong>. Bring this confirmation to reception.
            </p>
          </div>
          <button
            onClick={() => {
              setStage("WELCOME");
              setSelectedDoctor(null);
              setSelectedSlot(null);
              setMessages(INITIAL_MESSAGES);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1A3665" }}
          >
            Book Another Appointment
          </button>
        </div>
      );
    }

    if (stage === "CONFIRMING" && selectedDoctor && selectedSlot) {
      return (
        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review Booking</p>
            <p className="text-xs text-muted-foreground mt-0.5">Confirm the details below</p>
          </div>
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-border">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ backgroundColor: selectedDoctor.color }}
              >
                {selectedDoctor.initials}
              </div>
              <div>
                <p className="font-semibold text-foreground">{selectedDoctor.name}</p>
                <p className="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium text-amber-600">{selectedDoctor.rating}</span>
                  <span className="text-xs text-muted-foreground">({selectedDoctor.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {[
                { icon: User, label: "Patient", value: patientName },
                { icon: Calendar, label: "Date", value: AVAILABLE_DATES[selectedDateIdx] },
                { icon: Clock, label: "Time", value: selectedSlot },
                { icon: MapPin, label: "Location", value: "City Medical Center" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground ml-auto">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleConfirmBooking}
            className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#0AB08A" }}
          >
            <Check className="w-4 h-4" />
            Confirm Appointment
          </button>
          <button
            onClick={() => {
              setStage("SELECTING_SLOT");
              setSelectedSlot(null);
            }}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-medium text-foreground border border-border hover:bg-muted transition-colors"
          >
            Change Time Slot
          </button>
        </div>
      );
    }

    if (stage === "SELECTING_SLOT" && selectedDoctor) {
      return (
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: selectedDoctor.color }}
            >
              {selectedDoctor.initials}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">{selectedDoctor.name}</p>
              <p className="text-xs text-muted-foreground">{selectedDoctor.specialty}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Select Date</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {AVAILABLE_DATES.map((date, i) => (
                <button
                  key={date}
                  onClick={() => setSelectedDateIdx(i)}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all"
                  style={
                    selectedDateIdx === i
                      ? { backgroundColor: "#1A3665", color: "#fff" }
                      : {}
                  }
                  {...(selectedDateIdx !== i ? { className: "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all bg-muted text-muted-foreground hover:bg-muted/70" } : {})}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Morning</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_SLOTS.filter((s) => s.time.includes("AM")).map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`py-2 px-1 rounded-lg text-xs font-medium text-center transition-all ${
                    slot.time === selectedSlot
                      ? "text-white"
                      : slot.available
                      ? "text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "text-muted-foreground/40 cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor:
                      slot.time === selectedSlot
                        ? "#0AB08A"
                        : slot.available
                        ? "#ECFDF5"
                        : "#F0F4F8",
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Afternoon</p>
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_SLOTS.filter((s) => s.time.includes("PM")).map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && handleSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`py-2 px-1 rounded-lg text-xs font-medium text-center transition-all ${
                    slot.time === selectedSlot
                      ? "text-white"
                      : slot.available
                      ? "text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "text-muted-foreground/40 cursor-not-allowed"
                  }`}
                  style={{
                    backgroundColor:
                      slot.time === selectedSlot
                        ? "#0AB08A"
                        : slot.available
                        ? "#ECFDF5"
                        : "#F0F4F8",
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-muted inline-block" />
              Booked
            </span>
          </div>
        </div>
      );
    }

    if (
      stage === "DOCTOR_SEARCH" ||
      stage === "COLLECTING_PHONE" ||
      stage === "COLLECTING_NAME"
    ) {
      return (
        <div className="p-5 space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Doctors</p>
            <p className="text-xs text-muted-foreground mt-0.5">Click to select a doctor</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              placeholder="Search name or specialty..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-muted rounded-lg border border-transparent focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            {filteredDoctors.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDoctorSelect(doc)}
                className="w-full text-left p-3 rounded-xl bg-background border border-border hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: doc.color }}
                  >
                    {doc.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-xs text-amber-600">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {doc.rating}
                      </span>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{doc.experience}y exp</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-medium" style={{ color: "#0AB08A" }}>
                      {doc.nextAvailable.includes("Today")
                        ? "Today"
                        : doc.nextAvailable.includes("Tomorrow")
                        ? "Tomorrow"
                        : doc.nextAvailable.split(",")[0]}
                    </p>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary ml-auto mt-0.5 transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // WELCOME panel — stats + quick access
    return (
      <div className="p-5 space-y-5">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Clinic Overview</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: "Doctors", value: "48", icon: Stethoscope, color: "#1A3665" },
            { label: "Specialties", value: "12", icon: Award, color: "#0AB08A" },
            { label: "Avg. Wait", value: "< 3 days", icon: Clock, color: "#6D28D9" },
            { label: "Avg. Rating", value: "4.8★", icon: Star, color: "#D97706" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-background border border-border rounded-xl p-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: `${color}18` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <p className="text-base font-bold text-foreground leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Book by Specialty
          </p>
          <div className="space-y-1">
            {[
              { name: "General Medicine", next: "Today", color: "#0AB08A" },
              { name: "Cardiology", next: "Today", color: "#1A3665" },
              { name: "Neurology", next: "Tomorrow", color: "#6D28D9" },
              { name: "Pediatrics", next: "Today", color: "#059669" },
              { name: "Orthopedics", next: "Jul 6", color: "#D97706" },
            ].map((item) => (
              <button
                key={item.name}
                onClick={() => handleSend(`Book an appointment for ${item.name}`)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-background border border-transparent hover:border-border transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-foreground font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: "#0AB08A" }}>{item.next}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
        <div className="bg-secondary rounded-xl p-3.5 flex items-start gap-2.5">
          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#1A3665" }} />
          <p className="text-xs text-secondary-foreground leading-relaxed">
            <strong>AI-powered:</strong> Our receptionist never invents slots — all availability is verified in real time.
          </p>
        </div>
      </div>
    );
  };

  const contextTitle =
    stage === "DOCTOR_SEARCH" ||
    stage === "COLLECTING_NAME" ||
    stage === "COLLECTING_PHONE"
      ? "Find a Doctor"
      : stage === "SELECTING_SLOT"
      ? "Available Slots"
      : stage === "CONFIRMING"
      ? "Review Booking"
      : stage === "CONFIRMED"
      ? "Booking Confirmed"
      : "Clinic Overview";

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ backgroundColor: "#0B1C33", borderColor: "rgba(255,255,255,0.06)" }}
      >
        {/* Logo */}
        <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #0AB08A 0%, #1A3665 100%)" }}
            >
              A
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Avatar.AI</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Medical Reception
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { id: "chat" as AppView, label: "AI Receptionist", icon: MessageSquare },
            { id: "appointments" as AppView, label: "My Appointments", icon: Calendar },
            { id: "doctors" as AppView, label: "Find Doctors", icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={
                view === id
                  ? { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.45)" }
              }
              onMouseEnter={(e) => {
                if (view !== id)
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
              }}
              onMouseLeave={(e) => {
                if (view !== id)
                  (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)";
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          ))}

          <div
            className="mx-0 my-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.06)" }}
          />
          <p
            className="px-3 text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            Recent Sessions
          </p>
          {[
            { label: "Booking – Dr. Chen", time: "Just now", active: true },
            { label: "General inquiry", time: "2h ago", active: false },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all text-left"
              style={{
                color: item.active ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)",
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{item.label}</span>
              <span className="ml-auto flex-shrink-0 opacity-50">{item.time}</span>
            </button>
          ))}
        </nav>

        {/* Patient card */}
        <div
          className="p-3 border-t"
          style={{ borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              AJ
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">Alex Johnson</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Patient #8821
              </p>
            </div>
            <Settings
              className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.3)" }}
            />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      {view === "chat" ? (
        <>
          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Chat header */}
            <div className="h-14 border-b border-border bg-card px-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: "linear-gradient(135deg, #0AB08A 0%, #1A3665 100%)" }}
                  >
                    A
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-card" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Avatar AI Receptionist</p>
                  <p className="text-xs font-medium" style={{ color: "#0AB08A" }}>
                    ● Online — City Medical Center
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </button>
                <button className="w-8 h-8 rounded-lg hover:bg-muted transition-colors flex items-center justify-center">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Booking flow progress bar */}
            {isBookingFlow && (
              <div className="h-10 border-b border-border bg-card px-5 flex items-center gap-0 flex-shrink-0">
                {FLOW_STEPS.map((step, i) => {
                  const stepIdx = FLOW_STEPS.findIndex((s) => s.key === stage);
                  const done = i < stepIdx;
                  const active = i === stepIdx;
                  return (
                    <div key={step.key} className="flex items-center">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: done
                              ? "#0AB08A"
                              : active
                              ? "#1A3665"
                              : "#EDF2F7",
                            color: done || active ? "#fff" : "#607590",
                            border: active ? "none" : done ? "none" : "1px solid #b0c0d8",
                          }}
                        >
                          {done ? <Check className="w-3 h-3" /> : i + 1}
                        </div>
                        <span
                          className="text-xs font-medium hidden sm:inline"
                          style={{
                            color: active ? "#1A3665" : done ? "#0AB08A" : "#607590",
                          }}
                        >
                          {step.label}
                        </span>
                      </div>
                      {i < FLOW_STEPS.length - 1 && (
                        <div
                          className="w-8 h-px mx-1.5"
                          style={{ backgroundColor: done ? "#0AB08A" : "#b0c0d8" }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                      style={{ background: "linear-gradient(135deg, #0AB08A 0%, #1A3665 100%)" }}
                    >
                      A
                    </div>
                  )}
                  <div
                    className={`max-w-sm flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "text-white rounded-br-sm"
                          : "bg-card border border-border text-foreground rounded-bl-sm shadow-sm"
                      }`}
                      style={msg.role === "user" ? { backgroundColor: "#1A3665" } : {}}
                    >
                      {renderContent(msg.content)}
                    </div>
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.quickReplies.map((reply) => (
                          <button
                            key={reply}
                            onClick={() => handleSend(reply)}
                            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all hover:text-white hover:border-transparent"
                            style={{ borderColor: "#1A3665", color: "#1A3665" }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "#1A3665";
                              (e.currentTarget as HTMLElement).style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.backgroundColor = "";
                              (e.currentTarget as HTMLElement).style.color = "#1A3665";
                            }}
                          >
                            {reply}
                          </button>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(msg.timestamp)}</span>
                  </div>
                  {msg.role === "user" && (
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-0.5"
                      style={{ backgroundColor: "#1A3665" }}
                    >
                      AJ
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ background: "linear-gradient(135deg, #0AB08A 0%, #1A3665 100%)" }}
                  >
                    A
                  </div>
                  <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-bl-sm shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: "#1A3665" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2 opacity-60">
                Avatar AI never invents doctor availability — all slots verified in real time
              </p>
            </div>
          </div>

          {/* Context panel */}
          <aside className="w-80 flex-shrink-0 border-l border-border bg-card flex flex-col">
            <div className="h-14 border-b border-border px-5 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-semibold text-foreground">{contextTitle}</p>
              {selectedDoctor &&
                stage !== "CONFIRMED" &&
                stage !== "WELCOME" &&
                stage !== "DOCTOR_SEARCH" && (
                  <button
                    onClick={() => {
                      setSelectedDoctor(null);
                      setStage("DOCTOR_SEARCH");
                      setSelectedSlot(null);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Change doctor
                  </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">{renderContextPanel()}</div>
          </aside>
        </>
      ) : view === "appointments" ? (
        /* ── Appointments view ── */
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage your scheduled visits
                </p>
              </div>
              <button
                onClick={() => {
                  setView("chat");
                  setStage("COLLECTING_NAME");
                  setMessages(INITIAL_MESSAGES);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                style={{ backgroundColor: "#1A3665" }}
              >
                <MessageSquare className="w-4 h-4" />
                Book New
              </button>
            </div>

            {/* Upcoming */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Upcoming
              </p>
              {appointments
                .filter((a) => a.status === "upcoming")
                .map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-card border border-border rounded-2xl p-4 mb-3 flex items-center gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: appt.doctorColor }}
                    >
                      {appt.doctorInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{appt.doctorName}</p>
                      <p className="text-sm text-muted-foreground">{appt.specialty}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {appt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appt.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="px-2.5 py-1 text-xs font-medium rounded-full border"
                        style={{
                          backgroundColor: "#E6FAF5",
                          color: "#0AB08A",
                          borderColor: "#9DECDB",
                        }}
                      >
                        Upcoming
                      </span>
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                ))}
              {appointments.filter((a) => a.status === "upcoming").length === 0 && (
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium text-muted-foreground">No upcoming appointments</p>
                  <button
                    onClick={() => {
                      setView("chat");
                      setStage("COLLECTING_NAME");
                    }}
                    className="mt-3 text-xs font-semibold text-primary hover:underline"
                  >
                    Book one now →
                  </button>
                </div>
              )}
            </div>

            {/* Past */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Past Visits
              </p>
              {appointments
                .filter((a) => a.status !== "upcoming")
                .map((appt) => (
                  <div
                    key={appt.id}
                    className="bg-card border border-border rounded-2xl p-4 mb-3 flex items-center gap-4 opacity-70"
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: appt.doctorColor }}
                    >
                      {appt.doctorInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{appt.doctorName}</p>
                      <p className="text-sm text-muted-foreground">{appt.specialty}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {appt.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appt.time}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full flex-shrink-0">
                      Completed
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Doctors view ── */
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Find a Doctor</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Browse our specialist physicians at City Medical Center
              </p>
            </div>
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Search by name, specialty, or department..."
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-3">
              {filteredDoctors.map((doc) => {
                const SpecIcon = specialtyIcon(doc.specialty);
                return (
                  <div
                    key={doc.id}
                    className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: doc.color }}
                      >
                        {doc.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-foreground">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.specialty} · {doc.department}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold flex-shrink-0" style={{ color: "#D97706" }}>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {doc.rating}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({doc.reviews})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {doc.experience} years exp
                          </span>
                          <span className="flex items-center gap-1 font-medium" style={{ color: "#0AB08A" }}>
                            <Clock className="w-3 h-3" />
                            {doc.nextAvailable}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <button
                        onClick={() => {
                          setView("chat");
                          setStage("DOCTOR_SEARCH");
                          handleDoctorSelect(doc);
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: "#1A3665" }}
                      >
                        Book Appointment
                      </button>
                      <button className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
