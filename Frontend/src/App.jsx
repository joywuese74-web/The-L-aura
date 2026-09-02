import React, { useState, useEffect } from "react";
import {
  Sparkles, Droplets, Scissors, Wand2, Leaf, Gem,
  ShoppingBag, Calendar, Menu, X, ChevronDown, ChevronRight,
  Plus, Minus, Check, Clock, MapPin, Instagram, ArrowRight, Upload,
  Star, ShieldAlert, AlertTriangle, Headphones, Image as ImageIcon,
  Lock, Send, LogOut, ShieldCheck, CreditCard, Users, Facebook, Twitter
} from "lucide-react";

/* DESIGN TOKENS */
const INK = "#2B2621";
const SAND = "#EFE8DA";
const LINEN = "#FBF7EF";
const CLAY = "#B97452";
const MOSS = "#6E7C4F";
const TAUPE = "#B7A78C";

/* API base — configurable per environment instead of hardcoded */
const API_BASE = import.meta.env.VITE_API_URL || "https://the-l-aura.onrender.com";
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_39943c9c4ad8d7658e5e6bc16baeb9c01ca2a2ff";

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

/* Distance between two coordinates in km, using the Haversine formula */
const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const requestLocation = (onSuccess, onError) => {
  if (!navigator.geolocation) {
    onError();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => onSuccess({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => onError(),
    { enableHighAccuracy: true, timeout: 8000 }
  );
};

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [activePanel, setActivePanel] = useState(null); // 'admin' | 'rating' | 'caution' | 'disclaimer' | 'support' | 'gallery'

  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState({ full_name: "No preference", passport_photo: null });
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentReference, setPaymentReference] = useState(null);
  const [isPaying, setIsPaying] = useState(false);

  const [providers, setProviders] = useState([]);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | loading | granted | denied

  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [providerForm, setProviderForm] = useState({
    full_name: "", state: "", lga: "", city: "", address: "",
    salon_skill: [], email: "", phone: "",
  });
  const [providerLocation, setProviderLocation] = useState(null);
  const [providerLocationStatus, setProviderLocationStatus] = useState("idle");
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

  const stylistOptions = React.useMemo(() => {
    const fallbackStylists = STYLISTS.filter((s) => s !== "No preference").map((name) => ({
      full_name: name,
      passport_photo: null,
      latitude: null,
      longitude: null,
      salon_skill: [],
    }));

    const realProviders = providers.filter(
      (p) => !STYLISTS.includes(p.full_name)
    );

    const combined = [...realProviders, ...fallbackStylists];

    const withDistanceAndMatch = combined.map((p) => {
      const hasCoords =
        customerLocation && p.latitude != null && p.longitude != null;
      const skillMatch = selectedCategoryName
        ? (p.salon_skill || []).includes(selectedCategoryName)
        : false;
      return {
        ...p,
        distance: hasCoords
          ? distanceKm(customerLocation.lat, customerLocation.lng, p.latitude, p.longitude)
          : null,
        skillMatch,
      };
    });

    withDistanceAndMatch.sort((a, b) => {
      // Providers whose skills match the chosen treatment's category come first
      if (a.skillMatch !== b.skillMatch) return a.skillMatch ? -1 : 1;
      // Within each group, closer providers come first
      if (a.distance == null && b.distance == null) return 0;
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

    return [{ full_name: "No preference", passport_photo: null, distance: null, skillMatch: false }, ...withDistanceAndMatch];
  }, [providers, customerLocation, selectedCategoryName]);

  useEffect(() => {
    if (isBookingOpen && locationStatus === "idle") {
      setLocationStatus("loading");
      requestLocation(
        (loc) => { setCustomerLocation(loc); setLocationStatus("granted"); },
        () => setLocationStatus("denied")
      );
    }
  }, [isBookingOpen, locationStatus]);

  const startBooking = (treatment = null) => {
    if (treatment) {
      setSelectedTreatment(treatment);
      setBookingStep(2);
    } else {
      setSelectedTreatment(null);
      setSelectedCategoryName(null);
      setBookingStep(1);
    }
    setSubmitError("");
    setIsBookingOpen(true);
    setMobileMenuOpen(false);
  };

  const finalizeBooking = (reference) => {
    setIsSubmitting(true);
    setSubmitError("");
    fetch(`${API_BASE}/api/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatment: selectedTreatment,
        stylist: selectedStylist.full_name,
        date: bookingDate,
        time_slot: bookingTime,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        payment_reference: reference,
      })
    })
      .then(response => {
        if (!response.ok) return response.json().then(err => { throw new Error(err.detail || "Booking failed"); });
        return response.json();
      })
      .then(data => {
        alert(`Payment successful! Service Booked. Booking reference ID: ${data.booking_id}`);
        setIsBookingOpen(false);
        setBookingStep(1);
        setSelectedTreatment(null);
        setSelectedStylist({ full_name: "No preference", passport_photo: null });
        setBookingDate("");
        setBookingTime("");
        setClientInfo({ name: "", email: "", phone: "" });
        setPaymentReference(null);
      })
      .catch(error => {
        setSubmitError(error.message);
      })
      .finally(() => setIsSubmitting(false));
  };

  const handlePayAndBook = () => {
    if (!PAYSTACK_PUBLIC_KEY) {
      setSubmitError("Payments are not yet configured. Please check back soon.");
      return;
    }
    if (!window.PaystackPop) {
      setSubmitError("Payment system is still loading — please try again in a moment.");
      return;
    }
    setSubmitError("");
    setIsPaying(true);
    const reference = `TS_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: clientInfo.email,
      amount: selectedTreatment.price * 100,
      currency: "NGN",
      ref: reference,
      callback: (response) => {
        setIsPaying(false);
        setPaymentReference(response.reference);
        finalizeBooking(response.reference);
      },
      onClose: () => {
        setIsPaying(false);
      },
    });
    handler.openIframe();
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
        latitude: providerLocation?.lat ?? null,
        longitude: providerLocation?.lng ?? null,
        passport_photo: passportBase64,
      }),
    })
      .then((response) => {
        if (!response.ok) return response.json().then((err) => { throw new Error(err.detail || "Registration failed"); });
        return response.json();
      })
      .then(() => {
        setProviderSuccess(true);
        setProviderForm({ full_name: "", state: "", lga: "", city: "", address: "", salon_skill: [], email: "", phone: "" });
        setProviderLocation(null);
        setProviderLocationStatus("idle");
        setPassportPreview(null);
        setPassportBase64(null);
      })
      .catch((error) => setProviderError(error.message))
      .finally(() => setIsProviderSubmitting(false));
  };

  const providerFormValid =
    providerForm.full_name && providerForm.state && providerForm.lga &&
    providerForm.city && providerForm.email && providerForm.phone &&
    providerForm.salon_skill.length > 0;

  return (
    <div
      className="min-h-screen relative antialiased selection:bg-amber-100 transition-all duration-300"
      style={{ backgroundColor: SAND, color: INK, marginLeft: isDrawerOpen ? "18rem" : 0 }}
    >

      {/* HEADER NAVBAR */}
      <header
        className="fixed top-0 right-0 z-50 transition-all duration-300"
        style={{
          left: isDrawerOpen ? "18rem" : 0,
          background: scrolled ? SAND : "transparent",
          borderBottom: scrolled ? `1px solid ${TAUPE}44` : "1px solid transparent"
        }}
      >
        <div className="w-full px-6 md:px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open menu"
              className="p-2 rounded-full"
              style={{ backgroundColor: scrolled ? "transparent" : "rgba(0,0,0,0.35)" }}
            >
              <Menu size={24} color={scrolled ? INK : "white"} />
            </button>

            <div className="flex flex-col gap-0.5">
              <a
                  href="#top"
                className="flex items-baseline gap-2 px-4 py-2 rounded-full w-fit"
                style={{ backgroundColor: scrolled ? "transparent" : "rgba(0,0,0,0.35)" }}
              >
                <span style={{ fontFamily: "serif", fontStyle: "italic", color: scrolled ? INK : "white" }} className="text-4xl font-bold">Terra</span>
                <span style={{ color: CLAY }} className="text-xs tracking-[0.25em] uppercase font-bold">Studio</span>
              </a>
              <p className="pl-4 text-[10px] tracking-[0.15em] uppercase" style={{ color: scrolled ? TAUPE : "rgba(255,255,255,0.75)" }}>
                Online Wellness Salon
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => startBooking()}
              className="hidden md:flex items-center gap-2 text-base font-medium px-8 py-3.5 rounded-full text-white"
              style={{ background: CLAY }}
            >
              Book Now
            </button>

            <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden flex flex-col gap-4 px-6 pb-6 text-sm font-medium animate-fadeIn" style={{ backgroundColor: SAND }}>
            <button onClick={() => startBooking()} className="py-2.5 rounded-full text-white text-center" style={{ background: CLAY }}>
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
            Bringing Beauty to Your doorstep
          </h1>
          <p className="max-w-md mx-auto mt-5 text-sm text-white/85">
            Facials, spa rituals, hair, nails and aesthetic treatments — booked in a couple of taps.
          </p>
          <button
            onClick={openProviderForm}
            className="mt-8 inline-flex items-center gap-2 px-10 py-4 rounded-full text-white text-base font-medium shadow-lg"
            style={{ backgroundColor: CLAY }}
          >
            Get shop  <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* SERVICES SHOWCASE */}
      <section className="px-6 md:px-10 py-20" style={{ backgroundColor: LINEN }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-center mb-2" style={{ color: CLAY }}>What we offer</p>
          <h2 className="text-3xl md:text-4xl font-serif italic text-center mb-12" style={{ color: INK }}>
            Services for every ritual
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const startingPrice = Math.min(...cat.treatments.map((t) => t.price));
              return (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedTreatment(null); setSelectedCategoryName(cat.name); setBookingStep(1); setIsBookingOpen(true); }}
                  className="text-left p-6 rounded-2xl border transition-shadow hover:shadow-lg bg-white"
                  style={{ borderColor: `${TAUPE}33` }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${cat.color}1A` }}
                  >
                    <Icon size={22} style={{ color: cat.color }} />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: cat.color }}>{cat.tag}</p>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: INK }}>{cat.name}</h3>
                  <p className="text-xs mb-3" style={{ color: `${INK}99` }}>{cat.blurb}</p>
                  <p className="text-xs font-mono" style={{ color: TAUPE }}>From {naira(startingPrice)}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-6 md:px-10 py-20" style={{ backgroundColor: SAND }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-center mb-2" style={{ color: CLAY }}>Simple by design</p>
          <h2 className="text-3xl md:text-4xl font-serif italic text-center mb-14" style={{ color: INK }}>
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { icon: Calendar, title: "Browse & Choose", body: "Explore treatments and pick a provider — sorted by skill and distance to you." },
              { icon: CreditCard, title: "Book & Pay Securely", body: "Confirm your slot and pay online through our secure payment gateway." },
              { icon: Sparkles, title: "Enjoy Your Service", body: "Your provider is notified instantly. Show up and relax — we handle the rest." },
            ].map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: CLAY }}
                >
                  <Icon size={26} color="white" />
                </div>
                <p className="text-xs font-mono mb-1" style={{ color: TAUPE }}>Step {i + 1}</p>
                <h3 className="text-base font-semibold mb-2" style={{ color: INK }}>{title}</h3>
                <p className="text-xs" style={{ color: `${INK}99` }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOP RATED PROVIDERS */}
      {providers.filter((p) => p.avg_rating).length > 0 && (
        <section className="px-6 md:px-10 py-20" style={{ backgroundColor: LINEN }}>
          <div className="max-w-6xl mx-auto">
            <p className="text-xs tracking-[0.25em] uppercase text-center mb-2" style={{ color: CLAY }}>Loved by customers</p>
            <h2 className="text-3xl md:text-4xl font-serif italic text-center mb-12" style={{ color: INK }}>
              Top rated providers
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers
                .filter((p) => p.avg_rating)
                .sort((a, b) => b.avg_rating - a.avg_rating)
                .slice(0, 3)
                .map((p) => (
                  <div key={p.provider_id} className="p-5 rounded-2xl border bg-white text-center" style={{ borderColor: `${TAUPE}33` }}>
                    {p.passport_photo ? (
                      <img src={p.passport_photo} alt={p.full_name} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
                    ) : (
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-lg font-semibold"
                        style={{ backgroundColor: SAND, color: TAUPE }}
                      >
                        {p.full_name.charAt(0)}
                      </div>
                    )}
                    <h3 className="text-sm font-semibold mb-1" style={{ color: INK }}>{p.full_name}</h3>
                    <p className="text-xs mb-2" style={{ color: TAUPE }}>{(p.salon_skill || []).join(", ")}</p>
                    <div className="flex items-center justify-center gap-1 text-xs">
                      <Star size={13} fill={CLAY} color={CLAY} />
                      <span className="font-semibold" style={{ color: INK }}>{p.avg_rating}</span>
                      <span style={{ color: TAUPE }}>({p.rating_count})</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* TRUST BAR */}
      <section className="px-6 md:px-10 py-14" style={{ backgroundColor: INK }}>
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-8">
          {[
            { icon: MapPin, text: "Providers across all 36 states" },
            { icon: ShieldCheck, text: "Verified & rated providers" },
            { icon: CreditCard, text: "Secure payments via Paystack" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 justify-center sm:justify-start">
              <Icon size={22} color={CLAY} />
              <p className="text-sm text-white/90">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 md:px-10 py-14" style={{ backgroundColor: "#1D1915" }}>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <span style={{ fontFamily: "serif", fontStyle: "italic", color: "white" }} className="text-2xl font-bold">
              Terra <span style={{ fontFamily: "sans-serif", fontStyle: "normal", color: CLAY }} className="text-xs tracking-[0.2em] uppercase align-middle">Studio</span>
            </span>
            <p className="text-xs mt-3 text-white/60">Bringing beauty to your doorstep — book trusted wellness providers near you.</p>
            <div className="flex gap-3 mt-4">
              <Instagram size={18} color="white" className="opacity-70" />
              <Facebook size={18} color="white" className="opacity-70" />
              <Twitter size={18} color="white" className="opacity-70" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-white/50">Quick Links</p>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <button onClick={() => setActivePanel("support")} className="text-left hover:text-white">Support</button>
              <button onClick={() => setActivePanel("caution")} className="text-left hover:text-white">Caution</button>
              <button onClick={() => setActivePanel("disclaimer")} className="text-left hover:text-white">Platform Disclaimer</button>
              <button onClick={() => setActivePanel("gallery")} className="text-left hover:text-white">Gallery</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-white/50">For Providers</p>
            <div className="flex flex-col gap-2 text-sm text-white/80">
              <button onClick={openProviderForm} className="text-left hover:text-white">Register your shop</button>
              <button onClick={() => setActivePanel("rating")} className="text-left hover:text-white">Ratings</button>
              <button onClick={() => setActivePanel("admin")} className="text-left hover:text-white">Admin</button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-3 text-white/50">Contact</p>
            <p className="text-xs text-white/70">support@laura-studio.com</p>
            <p className="text-xs text-white/70 mt-1">+234 000 000 0000</p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto border-t mt-10 pt-6 text-center" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <p className="text-[11px] text-white/40">© {new Date().getFullYear()} Terra Studio. All rights reserved.</p>
        </div>
      </footer>

      {/* CUSTOMER BOOKING WIZARD (triggered by "Book Now") */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-scaleIn" style={{ backgroundColor: LINEN }}>
            <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: INK }}>
              <span className="font-medium text-sm">Reserve Salon service</span>
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
                              onClick={() => { setSelectedTreatment(t); setSelectedCategoryName(cat.name); setBookingStep(2); }}
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
                    {locationStatus === "loading" && (
                      <p className="text-[10px] mb-1.5" style={{ color: TAUPE }}>Finding practitioners near you…</p>
                    )}
                    {locationStatus === "denied" && (
                      <p className="text-[10px] mb-1.5" style={{ color: TAUPE }}>
                        Location unavailable — showing all practitioners.
                      </p>
                    )}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {stylistOptions.map((st) => (
                        <button
                          key={st.full_name}
                          onClick={() => setSelectedStylist(st)}
                          className="w-full p-2 rounded-lg border text-left text-xs flex items-center gap-2.5 bg-white"
                          style={{
                            borderColor: selectedStylist.full_name === st.full_name ? INK : `${TAUPE}66`,
                            borderWidth: selectedStylist.full_name === st.full_name ? 2 : 1,
                          }}
                        >
                          {st.passport_photo ? (
                            <img
                              src={st.passport_photo}
                              alt={st.full_name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold"
                              style={{ backgroundColor: SAND, color: TAUPE }}
                            >
                              {st.full_name === "No preference" ? "—" : st.full_name.charAt(0)}
                            </div>
                          )}
                          <span className="flex-1 flex items-center gap-1.5">
                            {st.full_name}
                            {st.skillMatch && (
                              <span
                                className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ backgroundColor: `${MOSS}22`, color: MOSS }}
                              >
                                Specialist
                              </span>
                            )}
                            {st.avg_rating != null && (
                              <span className="flex items-center gap-0.5 text-[10px]" style={{ color: TAUPE }}>
                                <Star size={10} fill={CLAY} color={CLAY} /> {st.avg_rating} ({st.rating_count})
                              </span>
                            )}
                          </span>
                          {st.distance != null && (
                            <span className="text-[10px] font-mono" style={{ color: TAUPE }}>
                              {st.distance < 1 ? "<1 km" : `${st.distance.toFixed(1)} km`}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
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

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setBookingStep(1)} className="flex-1 py-2 text-xs border rounded-lg">Back</button>
                    <button
                      disabled={!bookingDate || !bookingTime}
                      onClick={() => setBookingStep(3)}
                      className="flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40"
                      style={{ backgroundColor: INK }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold" style={{ color: TAUPE }}>Step 3: Contact & Submit</p>

                  <div className="p-3 text-xs rounded-xl" style={{ backgroundColor: SAND }}>
                    <p className="font-medium">{selectedTreatment?.name}</p>
                    <p style={{ color: `${INK}88` }}>{bookingDate} @ {bookingTime} ({selectedStylist.full_name})</p>
                  </div>

                  <input
                    type="text" placeholder="Full Name" value={clientInfo.name}
                    onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <input
                    type="email" placeholder="Email Address" value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <input
                    type="tel" placeholder="Phone Number" value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />

                  <div className="p-3 text-xs rounded-xl flex justify-between items-center" style={{ backgroundColor: SAND }}>
                    <span>Amount to pay</span>
                    <span className="font-mono font-semibold">{naira(selectedTreatment?.price || 0)}</span>
                  </div>

                  {submitError && (
                    <p className="text-xs text-red-600">{submitError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setBookingStep(2)} className="flex-1 py-2 text-xs border rounded-lg">Back</button>
                    <button
                      disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone || isSubmitting || isPaying}
                      onClick={handlePayAndBook}
                      className="flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40"
                      style={{ backgroundColor: CLAY }}
                    >
                      {isPaying ? "Opening payment…" : isSubmitting ? "Confirming…" : `Pay ${naira(selectedTreatment?.price || 0)} & Book`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SERVICE PROVIDER REGISTRATION MODAL (triggered by "Reserve a ritual") */}
      {isProviderOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-scaleIn" style={{ backgroundColor: LINEN }}>
            <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: INK }}>
              <span className="font-medium text-sm">Become a Terra Studio Provider</span>
              <button onClick={() => setIsProviderOpen(false)} aria-label="Close registration dialog">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto">
              {providerSuccess ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${MOSS}22` }}>
                    <Check size={22} style={{ color: MOSS }} />
                  </div>
                  <p className="text-sm font-semibold mb-1">Your online shop has been opened on Terra Studio!</p>
                  <p className="text-xs" style={{ color: `${INK}88` }}>
                    A confirmation has been sent to your email. You'll now appear as a selectable provider under Book Now.
                  </p>
                  <button
                    onClick={() => setIsProviderOpen(false)}
                    className="mt-5 px-6 py-2 text-xs text-white rounded-lg"
                    style={{ backgroundColor: INK }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold mb-1" style={{ color: TAUPE }}>Register as a service provider</p>

                  <input
                    type="text" placeholder="Full Name" value={providerForm.full_name}
                    onChange={(e) => setProviderForm({ ...providerForm, full_name: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text" placeholder="State" value={providerForm.state}
                      onChange={(e) => setProviderForm({ ...providerForm, state: e.target.value })}
                      className="w-full p-2 text-xs border rounded-lg bg-white"
                    />
                    <input
                      type="text" placeholder="Local Government Area" value={providerForm.lga}
                      onChange={(e) => setProviderForm({ ...providerForm, lga: e.target.value })}
                      className="w-full p-2 text-xs border rounded-lg bg-white"
                    />
                  </div>

                  <input
                    type="text" placeholder="City" value={providerForm.city}
                    onChange={(e) => setProviderForm({ ...providerForm, city: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />

                  <input
                    type="text" placeholder="Street Address" value={providerForm.address}
                    onChange={(e) => setProviderForm({ ...providerForm, address: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setProviderLocationStatus("loading");
                      requestLocation(
                        (loc) => { setProviderLocation(loc); setProviderLocationStatus("granted"); },
                        () => setProviderLocationStatus("denied")
                      );
                    }}
                    className="w-full flex items-center justify-center gap-1.5 p-2 text-xs border rounded-lg bg-white"
                    style={{ borderColor: TAUPE, color: providerLocationStatus === "granted" ? MOSS : TAUPE }}
                  >
                    <MapPin size={14} />
                    {providerLocationStatus === "granted"
                      ? "Location captured ✓"
                      : providerLocationStatus === "loading"
                      ? "Getting your location…"
                      : providerLocationStatus === "denied"
                      ? "Location unavailable — try again"
                      : "Use my current location"}
                  </button>
                  <p className="text-[10px] -mt-1" style={{ color: `${INK}66` }}>
                    Helps customers near you find your shop first when booking.
                  </p>

                  <div>
                    <label className="text-xs font-medium block mb-1">Salon skills (select all that apply)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SALON_SKILLS.map((skill) => {
                        const checked = providerForm.salon_skill.includes(skill);
                        return (
                          <label
                            key={skill}
                            className="flex items-center gap-1.5 p-2 border rounded-lg text-xs bg-white cursor-pointer"
                            style={{ borderColor: checked ? INK : `${TAUPE}66`, borderWidth: checked ? 2 : 1 }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? providerForm.salon_skill.filter((s) => s !== skill)
                                  : [...providerForm.salon_skill, skill];
                                setProviderForm({ ...providerForm, salon_skill: next });
                              }}
                            />
                            {skill}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <input
                    type="email" placeholder="Email Address" value={providerForm.email}
                    onChange={(e) => setProviderForm({ ...providerForm, email: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />
                  <input
                    type="tel" placeholder="Phone Number" value={providerForm.phone}
                    onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                    className="w-full p-2 text-xs border rounded-lg bg-white"
                  />

                  <div>
                    <label className="text-xs font-medium block mb-1">Passport photo</label>
                    <label
                      className="flex items-center justify-center gap-2 w-full p-3 border border-dashed rounded-lg text-xs cursor-pointer bg-white"
                      style={{ borderColor: TAUPE }}
                    >
                      {passportPreview ? (
                        <img src={passportPreview} alt="Passport preview" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <Upload size={16} style={{ color: TAUPE }} />
                      )}
                      <span style={{ color: TAUPE }}>{passportPreview ? "Change photo" : "Upload passport photo"}</span>
                      <input type="file" accept="image/*" onChange={handlePassportChange} className="hidden" />
                    </label>
                  </div>

                  {providerError && (
                    <p className="text-xs text-red-600">{providerError}</p>
                  )}

                  <button
                    disabled={!providerFormValid || isProviderSubmitting}
                    onClick={handleProviderSubmit}
                    className="w-full py-2.5 text-xs text-white rounded-lg disabled:opacity-40 mt-2"
                    style={{ backgroundColor: CLAY }}
                  >
                    {isProviderSubmitting ? "Submitting…" : "Open my shop on Terra Studio"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEFT DRAWER MENU (persistent sidebar) */}
      {isDrawerOpen && (
        <div
          className="fixed left-0 top-0 h-full w-72 z-[60] shadow-xl p-5 flex flex-col gap-1 overflow-y-auto"
          style={{ backgroundColor: LINEN }}
        >
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontFamily: "serif", fontStyle: "italic", color: INK }} className="text-2xl font-bold">
              Terra <span style={{ fontFamily: "sans-serif", fontStyle: "normal", color: CLAY }} className="text-xs tracking-[0.2em] uppercase align-middle">Studio</span>
            </span>
            <button onClick={() => setIsDrawerOpen(false)}><X size={22} /></button>
          </div>
          {[
            { key: "admin", label: "Admin", icon: Lock },
            { key: "rating", label: "Rating", icon: Star },
            { key: "caution", label: "Caution", icon: ShieldAlert },
            { key: "disclaimer", label: "Platform Disclaimer", icon: AlertTriangle },
            { key: "support", label: "Support", icon: Headphones },
            { key: "gallery", label: "Gallery", icon: ImageIcon },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key)}
              className="flex items-center gap-3 p-3 rounded-lg text-lg font-medium text-left"
              style={{ color: INK }}
            >
              <Icon size={22} style={{ color: CLAY }} />
              {label}
            </button>
          ))}
        </div>
      )}

      {activePanel === "admin" && <AdminPanel onClose={() => setActivePanel(null)} />}
      {activePanel === "rating" && <RatingPanel onClose={() => setActivePanel(null)} providers={providers} />}
      {activePanel === "caution" && <CautionPanel onClose={() => setActivePanel(null)} />}
      {activePanel === "disclaimer" && <DisclaimerPanel onClose={() => setActivePanel(null)} />}
      {activePanel === "support" && <SupportPanel onClose={() => setActivePanel(null)} />}
      {activePanel === "gallery" && <GalleryPanel onClose={() => setActivePanel(null)} />}
    </div>
  );
}

/* ============ SIDE PANEL SHELL ============ */
function PanelShell({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ backgroundColor: `${INK}80` }} onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[85vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b" style={{ borderColor: `${TAUPE}44` }}>
          <h2 className="text-base font-semibold" style={{ color: INK }}>{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============ 1. ADMIN PANEL ============ */
function AdminPanel({ onClose }) {
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [authed, setAuthed] = useState(null); // null = not tried, {username,password} once verified
  const [complaints, setComplaints] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});

  const authHeader = (c) => "Basic " + btoa(`${c.username}:${c.password}`);

  const login = () => {
    setError("");
    setLoading(true);
    fetch(`${API_BASE}/api/admin/complaints`, {
      headers: { Authorization: authHeader(creds) }
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid username or password");
        return res.json();
      })
      .then((data) => {
        setAuthed(creds);
        setComplaints(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const sendReply = (complaintId) => {
    const reply = replyDrafts[complaintId];
    if (!reply) return;
    fetch(`${API_BASE}/api/admin/complaints/${complaintId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader(authed) },
      body: JSON.stringify({ reply }),
    })
      .then((res) => res.json())
      .then((updated) => {
        setComplaints((prev) => prev.map((c) => (c.complaint_id === updated.complaint_id ? updated : c)));
        setReplyDrafts((prev) => ({ ...prev, [complaintId]: "" }));
      });
  };

  if (!authed) {
    return (
      <PanelShell title="Admin Login" onClose={onClose}>
        <div className="space-y-3">
          <input
            type="text" placeholder="Username" value={creds.username}
            onChange={(e) => setCreds({ ...creds, username: e.target.value })}
            className="w-full p-2 text-sm border rounded-lg bg-white"
          />
          <input
            type="password" placeholder="Password" value={creds.password}
            onChange={(e) => setCreds({ ...creds, password: e.target.value })}
            className="w-full p-2 text-sm border rounded-lg bg-white"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            onClick={login}
            disabled={loading || !creds.username || !creds.password}
            className="w-full py-2.5 text-sm text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: CLAY }}
          >
            {loading ? "Checking…" : "Log in"}
          </button>
        </div>
      </PanelShell>
    );
  }

  return (
    <PanelShell title="Admin — Complaints & Messages" onClose={onClose} wide>
      <div className="flex justify-end mb-3">
        <button onClick={() => setAuthed(null)} className="flex items-center gap-1 text-xs" style={{ color: TAUPE }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
      {complaints.length === 0 && <p className="text-sm" style={{ color: TAUPE }}>No complaints yet.</p>}
      <div className="space-y-4">
        {complaints.map((c) => (
          <div key={c.complaint_id} className="border rounded-xl p-4" style={{ borderColor: `${TAUPE}44` }}>
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="text-sm font-semibold" style={{ color: INK }}>{c.name} <span className="text-xs font-normal" style={{ color: TAUPE }}>({c.role})</span></p>
                <p className="text-xs" style={{ color: TAUPE }}>{c.email} · {c.created_at}</p>
              </div>
              <span
                className="text-[10px] px-2 py-1 rounded-full font-medium"
                style={{ backgroundColor: c.status === "Resolved" ? `${MOSS}22` : `${CLAY}22`, color: c.status === "Resolved" ? MOSS : CLAY }}
              >
                {c.status}
              </span>
            </div>
            <p className="text-sm mt-2" style={{ color: INK }}>{c.message}</p>
            {c.admin_reply ? (
              <div className="mt-3 p-3 rounded-lg text-sm" style={{ backgroundColor: SAND }}>
                <p className="text-xs font-semibold mb-1" style={{ color: MOSS }}>Admin reply:</p>
                {c.admin_reply}
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <input
                  type="text" placeholder="Type a reply…"
                  value={replyDrafts[c.complaint_id] || ""}
                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [c.complaint_id]: e.target.value })}
                  className="flex-1 p-2 text-xs border rounded-lg bg-white"
                />
                <button
                  onClick={() => sendReply(c.complaint_id)}
                  className="px-3 py-2 rounded-lg text-white text-xs flex items-center gap-1"
                  style={{ backgroundColor: CLAY }}
                >
                  <Send size={13} /> Send
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ============ 2. RATING PANEL ============ */
function RatingPanel({ onClose, providers }) {
  const [form, setForm] = useState({ booking_id: "", provider_name: "", customer_email: "", stars: 0, comment: "" });
  const [status, setStatus] = useState(null); // {type:'success'|'error', text}
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    setStatus(null);
    setSubmitting(true);
    fetch(`${API_BASE}/api/ratings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, booking_id: parseInt(form.booking_id, 10) }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.detail || "Could not submit rating");
        setStatus({ type: "success", text: data.status });
        setForm({ booking_id: "", provider_name: "", customer_email: "", stars: 0, comment: "" });
      })
      .catch((err) => setStatus({ type: "error", text: err.message }))
      .finally(() => setSubmitting(false));
  };

  return (
    <PanelShell title="Rate Your Service Provider" onClose={onClose}>
      <p className="text-xs mb-4" style={{ color: TAUPE }}>
        You can rate a provider once your scheduled appointment time has passed by at least 2 hours.
      </p>
      <div className="space-y-3">
        <input
          type="number" placeholder="Booking ID" value={form.booking_id}
          onChange={(e) => setForm({ ...form, booking_id: e.target.value })}
          className="w-full p-2 text-sm border rounded-lg bg-white"
        />
        <select
          value={form.provider_name}
          onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
          className="w-full p-2 text-sm border rounded-lg bg-white"
        >
          <option value="">Select the provider you booked</option>
          {providers.map((p) => (
            <option key={p.provider_id} value={p.full_name}>{p.full_name}</option>
          ))}
        </select>
        <input
          type="email" placeholder="Your email used at booking" value={form.customer_email}
          onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
          className="w-full p-2 text-sm border rounded-lg bg-white"
        />
        <div className="flex gap-1 justify-center py-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setForm({ ...form, stars: n })}>
              <Star size={28} fill={n <= form.stars ? CLAY : "none"} color={CLAY} />
            </button>
          ))}
        </div>
        <textarea
          placeholder="Additional comment (optional)" value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          className="w-full p-2 text-sm border rounded-lg bg-white h-20"
        />
        {status && (
          <p className="text-xs" style={{ color: status.type === "success" ? MOSS : "#dc2626" }}>{status.text}</p>
        )}
        <button
          onClick={submit}
          disabled={submitting || !form.booking_id || !form.provider_name || !form.customer_email || !form.stars}
          className="w-full py-2.5 text-sm text-white rounded-lg disabled:opacity-40"
          style={{ backgroundColor: CLAY }}
        >
          {submitting ? "Submitting…" : "Submit Rating"}
        </button>
      </div>
    </PanelShell>
  );
}

/* ============ 3. CAUTION PANEL ============ */
function CautionPanel({ onClose }) {
  const [tab, setTab] = useState("customer");

  const customerPoints = [
    ["🔍 Check the Provider's Profile", "Review the provider's profile, services offered, qualifications, experience, ratings/reviews, and previous work before booking. Only book a provider whose credentials meet your expectations."],
    ["📋 Read the Service Details", "Carefully review the service description, price, duration, location, products/equipment involved, additional charges, and preparation or aftercare requirements. Ask the provider if anything is unclear."],
    ["💬 Communicate Through Terra Studio", "Keep booking-related communication within the platform to create a record of your appointment, useful if a dispute occurs."],
    ["⚠️ Disclose Relevant Information", "Tell the provider about allergies, sensitivities, previous reactions, skin concerns, or medications that could affect the service."],
    ["🧴 Ask About Products and Procedures", "Ask about products, equipment, procedure, expected results, side effects, and aftercare. Don't proceed with a service you don't understand."],
    ["💳 Use Approved Payment Methods", "Pay only through Terra Studio's approved channels. Never share your password, PIN, OTP, or card security code with a provider."],
    ["📅 Confirm Your Booking", "Confirm provider name, service, date/time, location, total amount, and cancellation conditions. Keep your confirmation until service is completed."],
    ["🏠 Take Extra Care With Home Services", "Verify the provider's identity, share appointment details with someone you trust, and consider having another person present."],
    ["🧼 Check Hygiene & Professional Standards", "Pay attention to cleanliness of the environment, equipment, and products. Decline if conditions seem unsafe."],
    ["💰 Understand Cancellation & Refund Policies", "Read the cancellation, rescheduling, deposit, refund, and no-show policies before paying."],
    ["🚩 Watch for Red Flags", "Be cautious of pressure to buy extra services, unrealistic promises, unusual payment requests, or attempts to move off-platform."],
    ["📢 Report Problems", "Report unsafe behaviour, fraud, harassment, payment disputes, or service-quality concerns to Terra Studio support as soon as possible."],
  ];

  const providerPoints = [
    ["🪪 Maintain Accurate Profile Information", "Keep your business name, services, qualifications, experience, location, pricing, and availability accurate and up to date."],
    ["📋 Clearly Describe Your Services", "State what's included, price, duration, location, products used, preparation and aftercare requirements clearly."],
    ["🧴 Follow Professional & Hygiene Standards", "Use clean, properly maintained equipment and appropriate sanitation practices at all times."],
    ["⚠️ Do Not Perform Services Outside Your Competence", "Only provide services you're appropriately trained, qualified, or licensed for."],
    ["🩺 Know Your Service Limitations", "Identify situations where a service may be unsuitable, and don't proceed if a customer may be at risk."],
    ["💬 Communicate Professionally", "Treat every customer with respect — no harassment, discrimination, or abusive communication."],
    ["🔐 Protect Customer Privacy", "Keep customer information confidential; never share it or use it for unrelated purposes without consent."],
    ["💳 Follow Terra Studio's Payment Rules", "Use approved payment channels only. Don't pressure customers to bypass platform fees or share financial information."],
    ["📅 Honour Confirmed Bookings", "Make reasonable efforts to honour bookings. Notify customers early if you can't attend."],
    ["🏠 Follow Safety Procedures for Home Services", "Confirm details before travelling, maintain professional boundaries, and leave if you feel unsafe."],
    ["📸 Obtain Consent Before Using Customer Images", "Never publish a customer's image or results for marketing without their consent."],
    ["💰 Be Transparent About Additional Charges", "Explain and get agreement before adding any unexpected charges."],
    ["🚩 Report Suspicious Customer Behaviour", "Report fraud, threats, or unsafe conditions rather than confronting customers directly."],
    ["⭐ Maintain Professional Standards", "Repeated complaints about hygiene, misrepresentation, or unprofessional conduct may lead to suspension."],
  ];

  const points = tab === "customer" ? customerPoints : providerPoints;

  return (
    <PanelShell title="Caution — Safety Guidelines" onClose={onClose} wide>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("customer")}
          className="flex-1 py-2 text-xs rounded-lg font-medium"
          style={{ backgroundColor: tab === "customer" ? CLAY : SAND, color: tab === "customer" ? "white" : INK }}
        >
          For Customers
        </button>
        <button
          onClick={() => setTab("provider")}
          className="flex-1 py-2 text-xs rounded-lg font-medium"
          style={{ backgroundColor: tab === "provider" ? CLAY : SAND, color: tab === "provider" ? "white" : INK }}
        >
          For Service Providers
        </button>
      </div>
      <div className="space-y-4">
        {points.map(([title, body]) => (
          <div key={title}>
            <p className="text-sm font-semibold mb-1" style={{ color: INK }}>{title}</p>
            <p className="text-xs" style={{ color: `${INK}99` }}>{body}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

/* ============ 4. PLATFORM DISCLAIMER PANEL ============ */
function DisclaimerPanel({ onClose }) {
  return (
    <PanelShell title="⚠️ Platform Disclaimer" onClose={onClose}>
      <p className="text-sm leading-relaxed" style={{ color: `${INK}CC` }}>
        Service providers listed on Terra Studio may operate independently. While Terra Studio takes reasonable steps
        to maintain the quality and integrity of its provider network, customers are encouraged to review
        each provider's profile, qualifications, reviews, service details, and applicable policies before booking.
        <br /><br />
        Terra Studio facilitates connections and bookings between customers and service providers but does not
        necessarily provide the services itself. The platform's role, responsibilities, limitations, and
        dispute-resolution procedures are governed by our Terms &amp; Conditions.
        <br /><br />
        Customers should make informed decisions and contact Terra Studio Support if they have concerns regarding
        a provider, booking, payment, or service.
      </p>
    </PanelShell>
  );
}

/* ============ 5. SUPPORT PANEL ============ */
const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta",
  "Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi",
  "Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

function SupportPanel({ onClose }) {
  const [selectedState, setSelectedState] = useState(NIGERIAN_STATES[0]);
  const [complaintForm, setComplaintForm] = useState({ name: "", email: "", role: "customer", message: "" });
  const [complaintStatus, setComplaintStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const submitComplaint = () => {
    setSending(true);
    setComplaintStatus(null);
    fetch(`${API_BASE}/api/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(complaintForm),
    })
      .then((res) => res.json())
      .then(() => {
        setComplaintStatus({ type: "success", text: "Your message has been sent to Terra Studio Support." });
        setComplaintForm({ name: "", email: "", role: "customer", message: "" });
      })
      .catch(() => setComplaintStatus({ type: "error", text: "Could not send your message. Please try again." }))
      .finally(() => setSending(false));
  };

  const Avatar = ({ name }) => (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
      style={{ backgroundColor: SAND, color: TAUPE }}
    >
      {name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
    </div>
  );

  return (
    <PanelShell title="Support" onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 border rounded-xl" style={{ borderColor: `${TAUPE}33` }}>
          <Avatar name="Customer Service" />
          <div>
            <p className="text-sm font-semibold" style={{ color: INK }}>Customer Service</p>
            <p className="text-xs" style={{ color: TAUPE }}>support@laura-studio.com</p>
            <p className="text-xs" style={{ color: TAUPE }}>+234 000 000 0000</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-xl" style={{ borderColor: `${TAUPE}33` }}>
          <Avatar name="IT Support" />
          <div>
            <p className="text-sm font-semibold" style={{ color: INK }}>IT Support</p>
            <p className="text-xs" style={{ color: TAUPE }}>tech@laura-studio.com</p>
            <p className="text-xs" style={{ color: TAUPE }}>+234 000 000 0000</p>
          </div>
        </div>
      </div>

      <p className="text-sm font-semibold mb-2" style={{ color: INK }}>Regional Managers</p>
      <select
        value={selectedState}
        onChange={(e) => setSelectedState(e.target.value)}
        className="w-full p-2 text-sm border rounded-lg bg-white mb-3"
      >
        {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <div className="flex items-center gap-3 p-3 border rounded-xl" style={{ borderColor: `${TAUPE}33` }}>
        <Avatar name={`${selectedState} RM`} />
        <div>
          <p className="text-sm font-semibold" style={{ color: INK }}>{selectedState} Regional Manager</p>
          <p className="text-xs" style={{ color: TAUPE }}>Contact not yet assigned — check back soon.</p>
        </div>
      </div>
      <p className="text-[10px] mt-3" style={{ color: TAUPE }}>
        Placeholder contacts — replace with real names, numbers, and photos once available.
      </p>

      <div className="mt-6 pt-5 border-t" style={{ borderColor: `${TAUPE}33` }}>
        <p className="text-sm font-semibold mb-2" style={{ color: INK }}>Report a Complaint or Concern</p>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={complaintForm.role}
              onChange={(e) => setComplaintForm({ ...complaintForm, role: e.target.value })}
              className="p-2 text-xs border rounded-lg bg-white"
            >
              <option value="customer">I'm a customer</option>
              <option value="provider">I'm a service provider</option>
            </select>
            <input
              type="text" placeholder="Your name" value={complaintForm.name}
              onChange={(e) => setComplaintForm({ ...complaintForm, name: e.target.value })}
              className="flex-1 p-2 text-xs border rounded-lg bg-white"
            />
          </div>
          <input
            type="email" placeholder="Your email" value={complaintForm.email}
            onChange={(e) => setComplaintForm({ ...complaintForm, email: e.target.value })}
            className="w-full p-2 text-xs border rounded-lg bg-white"
          />
          <textarea
            placeholder="Describe your issue…" value={complaintForm.message}
            onChange={(e) => setComplaintForm({ ...complaintForm, message: e.target.value })}
            className="w-full p-2 text-xs border rounded-lg bg-white h-20"
          />
          {complaintStatus && (
            <p className="text-xs" style={{ color: complaintStatus.type === "success" ? MOSS : "#dc2626" }}>{complaintStatus.text}</p>
          )}
          <button
            onClick={submitComplaint}
            disabled={sending || !complaintForm.name || !complaintForm.email || !complaintForm.message}
            className="w-full py-2 text-xs text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: CLAY }}
          >
            {sending ? "Sending…" : "Send to Terra Studio Support"}
          </button>
        </div>
      </div>
    </PanelShell>
  );
}

/* ============ 6. GALLERY PANEL ============ */
const GALLERY_CATEGORIES = [
  "Hair Making", "Barbing", "Manicure and Pedicure", "Massage",
  "Spa", "Nails", "Makeup", "Makeover", "Bridal Dressing",
];

function GalleryPanel({ onClose }) {
  return (
    <PanelShell title="Gallery" onClose={onClose} wide>
      <p className="text-xs mb-4" style={{ color: TAUPE }}>
        Placeholder images below — upload your own photos for each category to replace these.
      </p>
      <div className="space-y-6">
        {GALLERY_CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-sm font-semibold mb-2" style={{ color: INK }}>{cat}</p>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: SAND }}
                >
                  <ImageIcon size={22} style={{ color: TAUPE }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}