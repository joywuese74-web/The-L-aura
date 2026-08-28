import React, { useState, useEffect } from "react";
import {
  Sparkles, Droplets, Scissors, Wand2, Leaf, Gem,
  ShoppingBag, Calendar, Menu, X, ChevronDown, ChevronRight,
  Plus, Minus, Check, Clock, MapPin, Instagram, ArrowRight, Upload
} from "lucide-react";

/* DESIGN TOKENS */
const INK = "#2B2621";
const SAND = "#EFE8DA";
const LINEN = "#FBF7EF";
const CLAY = "#B97452";
const MOSS = "#6E7C4F";
const TAUPE = "#B7A78C";

/* API base — configurable per environment instead of hardcoded */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const CATEGORIES = [
  {
    id: "skincare", name: "Skincare & Facials", tag: "Renew", icon: Sparkles, color: MOSS,
    blurb: "Clinical facials tuned to your skin's actual needs.",
    treatments: [
      { id: "t1", name: "Signature Facial", time: "60 min", price: 45000 },
      { id: "t2", name: "Hydrafacial", time: "50 min", price: 60000 },
      { id: "t3", name: "LED Light Therapy", time: "30 min", price: 25000 },
    ],
  },
  {
    id: "spa", name: "Spa & Body", tag: "Restore", icon: Droplets, color: CLAY,
    blurb: "Full-body rituals for slowing down properly.",
    treatments: [
      { id: "t4", name: "Swedish Massage", time: "60 min", price: 40000 },
      { id: "t5", name: "Hot Stone Therapy", time: "75 min", price: 55000 },
      { id: "t6", name: "Body Scrub & Wrap", time: "90 min", price: 65000 },
    ],
  },
  {
    id: "nails", name: "Nails", tag: "Detail", icon: Gem, color: "#A9705B",
    blurb: "Manicures and pedicures, precise down to the cuticle.",
    treatments: [
      { id: "t7", name: "Classic Manicure", time: "30 min", price: 12000 },
      { id: "t8", name: "Gel Pedicure", time: "45 min", price: 18000 },
      { id: "t9", name: "Nail Art", time: "from 20 min", price: 8000 },
    ],
  },
  {
    id: "hair", name: "Hair", tag: "Shape", icon: Scissors, color: "#5B4636",
    blurb: "Cut, colour and condition, built around your texture.",
    treatments: [
      { id: "t10", name: "Cut & Style", time: "45 min", price: 20000 },
      { id: "t11", name: "Colour & Highlights", time: "2 hr", price: 45000 },
      { id: "t12", name: "Deep Conditioning", time: "30 min", price: 15000 },
    ],
  },
  {
    id: "makeup", name: "Beauty & Makeup", tag: "Finish", icon: Wand2, color: "#B08947",
    blurb: "Everyday polish to full bridal application.",
    treatments: [
      { id: "t13", name: "Everyday Makeup", time: "45 min", price: 20000 },
      { id: "t14", name: "Bridal Trial", time: "90 min", price: 60000 },
      { id: "t15", name: "Lash Lift & Tint", time: "40 min", price: 18000 },
    ],
  },
  {
    id: "aesthetic", name: "Aesthetic Treatments", tag: "Correct", icon: Leaf, color: "#4F6357",
    blurb: "Advanced treatments, administered by licensed practitioners.",
    treatments: [
      { id: "t16", name: "Chemical Peel", time: "40 min", price: 35000 },
      { id: "t17", name: "Microneedling", time: "60 min", price: 70000 },
      { id: "t18", name: "Dermaplaning", time: "30 min", price: 25000 },
    ],
  },
];

const STYLISTS = ["No preference", "Amaka O.", "Tolu B.", "Chidinma E.", "Grace N."];
const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];
const SALON_SKILLS = CATEGORIES.map((c) => c.name);

const naira = (n) => "₦" + n.toLocaleString("en-NG");

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState("No preference");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [providers, setProviders] = useState([]);

  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [providerForm, setProviderForm] = useState({
    full_name: "", state: "", lga: "", city: "",
    salon_skill: SALON_SKILLS[0], email: "", phone: "",
  });
  const [passportPreview, setPassportPreview] = useState(null);
  const [passportBase64, setPassportBase64] = useState(null);
  const [isProviderSubmitting, setIsProviderSubmitting] = useState(false);
  const [providerError, setProviderError] = useState("");
  const [providerSuccess, setProviderSuccess] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/providers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProviders(Array.isArray(data) ? data : []))
      .catch(() => setProviders([]));
  }, [providerSuccess]);

  const stylistOptions = [
    ...STYLISTS,
    ...providers
      .map((p) => p.full_name)
      .filter((name) => !STYLISTS.includes(name)),
  ];

  const startBooking = (treatment = null) => {
    if (treatment) {
      setSelectedTreatment(treatment);
      setBookingStep(2);
    } else {
      setSelectedTreatment(null);
      setBookingStep(1);
    }
    setSubmitError("");
    setIsBookingOpen(true);
    setMobileMenuOpen(false);
  };

  const handleConfirmReservation = () => {
    setIsSubmitting(true);
    setSubmitError("");
    fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatment: selectedTreatment,
        stylist: selectedStylist,
        date: bookingDate,
        time_slot: bookingTime,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone
      })
    })
      .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.detail || "Booking failed"); });
        return response.json();
      })
      .then(data => {
        alert(`Ritual Successfully Booked! Booking reference ID: ${data.booking_id}`);
        setIsBookingOpen(false);
        setBookingStep(1);
        setSelectedTreatment(null);
        setSelectedStylist("No preference");
        setBookingDate("");
        setBookingTime("");
        setClientInfo({ name: "", email: "", phone: "" });
      })
      .catch(error => {
        setSubmitError(error.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const openProviderForm = () => {
    setProviderError("");
    setProviderSuccess(false);
    setIsProviderOpen(true);
    setMobileMenuOpen(false);
  };

  const handlePassportChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPassportBase64(reader.result);
      setPassportPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProviderSubmit = () => {
    setIsProviderSubmitting(true);
    setProviderError("");
    fetch(`${API_BASE}/api/providers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...providerForm,
        passport_photo: passportBase64,
      }),
    })
      .then((response) => {
        if (!response.ok) return response.json().then((err) => { throw new Error(err.detail || "Registration failed"); });
        return response.json();
      })
      .then(() => {
        setProviderSuccess(true);
        setProviderForm({ full_name: "", state: "", lga: "", city: "", salon_skill: SALON_SKILLS[0], email: "", phone: "" });
        setPassportPreview(null);
        setPassportBase64(null);
      })
      .catch((error) => setProviderError(error.message))
      .finally(() => setIsProviderSubmitting(false));
  };

  const providerFormValid =
    providerForm.full_name && providerForm.state && providerForm.lga &&
    providerForm.city && providerForm.email && providerForm.phone;

  return (
    <div className="min-h-screen relative antialiased selection:bg-amber-100" style={{ backgroundColor: SAND, color: INK }}>

      {/* HEADER NAVBAR */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? SAND : "transparent", borderBottom: scrolled ? `1px solid ${TAUPE}44` : "1px solid transparent" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            
              href="#top"
              className="flex items-baseline gap-1.5 px-4 py-1.5 rounded-full w-fit"
              style={{ backgroundColor: scrolled ? "transparent" : "rgba(0,0,0,0.35)" }}
            >
              <span style={{ fontFamily: "serif", fontStyle: "italic", color: scrolled ? INK : "white" }} className="text-2xl font-bold">Terra</span>
              <span style={{ color: CLAY }} className="text-[10px] tracking-[0.25em] uppercase font-bold">Studio</span>
            </a>
            <p className="pl-4 text-[9px] tracking-[0.15em] uppercase" style={{ color: scrolled ? TAUPE : "rgba(255,255,255,0.75)" }}>
              Online Wellness Salon
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => startBooking()}
              className="hidden md:flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full text-white"
              style={{ background: INK }}
            >
              Book Now
            </button>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-4 px-6 pb-6 text-sm font-medium animate-fadeIn" style={{ backgroundColor: SAND }}>
            <button onClick={() => startBooking()} className="py-2.5 rounded-full text-white text-center" style={{ background: INK }}>
              Book Now
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="top"
        className="relative min-h-screen flex items-center justify-center pt-32 pb-24 px-6 text-center bg-cover"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}hero-background.jpg')`,
          backgroundPosition: "center 20%",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif italic max-w-2xl mx-auto leading-tight text-white">
            Slow down. Be tended to.
          </h1>
          <p className="max-w-md mx-auto mt-5 text-sm text-white/85">
            Facials, spa rituals, hair, nails and aesthetic treatments — booked in a couple of taps.
          </p>
          <button
            onClick={openProviderForm}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-medium shadow-lg"
            style={{ backgroundColor: CLAY }}
          >
            Reserve a ritual <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* CUSTOMER BOOKING WIZARD (triggered by "Book Now") */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-scaleIn" style={{ backgroundColor: LINEN }}>
            <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: INK }}>
              <span className="font-medium text-sm">Reserve Salon Ritual</span>
              <button onClick={() => setIsBookingOpen(false)} aria-label="Close booking dialog">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {bookingStep === 1 && (
                <div>
                  <p className="text-xs font-semibold mb-3" style={{ color: TAUPE }}>Step 1: Choose a Specific Treatment</p>
                  <div className="space-y-4">
                    {CATEGORIES.map((cat) => (
                      <div key={cat.id}>
                        <p className="text-xs font-bold mt-2" style={{ color: cat.color }}>{cat.name}</p>
                        <div className="space-y-1.5 mt-1.5">
                          {cat.treatments.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => { setSelectedTreatment(t); setBookingStep(2); }}
                              className="w-full p-2.5 rounded-lg border text-left text-xs flex justify-between items-center bg-white hover:border-stone-900"
                            >
                              <span>{t.name} · {t.time}</span>
                              <span className="font-mono">{naira(t.price)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs font-semibold" style={{ color: TAUPE }}>Step 2: Time & Stylist Configuration</p>

                  <div>
                    <label className="text-xs font-medium block mb-1">Practitioner preference</label>
                    <select
                      value={selectedStylist}
                      onChange={(e) => setSelectedStylist(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs bg-white"
                    >
                      {stylistOptions.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1">Calendar Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-2 border rounded-lg text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium block mb-1">Available Hours</label>
                    <div className="grid grid-cols-3 gap-2">
                      {TIMES.map((t) => (
                        <button
                          key={t}
                          onClick={() => setBookingTime(t)}
                          className="py-1.5 border text-xs font-mono rounded"
                          style={{ backgroundColor: bookingTime === t ? CLAY : "white", color: bookingTime === t ? "white" : INK }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>