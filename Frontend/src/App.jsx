import React, { useState, useEffect } from "react";
import {
  Sparkles, Droplets, Scissors, Wand2, Leaf, Gem,
  ShoppingBag, Calendar, Menu, X, ChevronDown, ChevronRight,
  Plus, Minus, Check, Clock, MapPin, Instagram, ArrowRight
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

const PRODUCTS = [
  { id: "p1", name: "Vitamin C Serum", cat: "Skincare", price: 18500, color: MOSS },
  { id: "p2", name: "Gua Sha Facial Tool", cat: "Tools", price: 9000, color: "#A9705B" },
  { id: "p3", name: "Repair Night Cream", cat: "Skincare", price: 22000, color: CLAY },
  { id: "p4", name: "Scalp Massage Oil", cat: "Hair", price: 12500, color: "#5B4636" },
  { id: "p5", name: "Lip & Cheek Tint", cat: "Makeup", price: 8500, color: "#B08947" },
  { id: "p6", name: "SPF 50 Daily Shield", cat: "Skincare", price: 14000, color: "#4F6357" },
];

const GALLERY = [
  { id: "g1", cat: "skincare", title: "Hydrafacial glow", icon: Sparkles, color: MOSS },
  { id: "g2", cat: "spa", title: "Hot stone ritual", icon: Droplets, color: CLAY },
  { id: "g3", cat: "nails", title: "Terracotta French set", icon: Gem, color: "#A9705B" },
  { id: "g4", cat: "hair", title: "Balayage finish", icon: Scissors, color: "#5B4636" },
  { id: "g5", cat: "makeup", title: "Bridal soft-glam", icon: Wand2, color: "#B08947" },
  { id: "g6", cat: "aesthetic", title: "Post-peel radiance", icon: Leaf, color: "#4F6357" },
  { id: "g7", cat: "skincare", title: "LED therapy session", icon: Sparkles, color: MOSS },
  { id: "g8", cat: "spa", title: "Body scrub texture", icon: Droplets, color: CLAY },
];

const STYLISTS = ["No preference", "Amaka O.", "Tolu B.", "Chidinma E.", "Grace N."];
const TIMES = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM", "6:00 PM"];

const naira = (n) => "₦" + n.toLocaleString("en-NG");

function MenuRow({ name, time, price }) {
  return (
    <div className="flex items-baseline gap-2 py-2">
      <span className="text-[15px] font-medium">{name}</span>
      <span className="flex-1 border-b border-dotted" style={{ borderColor: TAUPE, transform: "translateY(-3px)" }} />
      <span className="text-xs tracking-wide shrink-0 font-mono" style={{ color: TAUPE }}>{time}</span>
      <span className="text-sm font-semibold shrink-0 font-mono" style={{ color: INK }}>{naira(price)}</span>
    </div>
  );
}

export default function App() {
  const [scrolled, setScrolled] = useState(false);
  const [cart, setCart] = useState([]);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Booking Wizard State */
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [selectedStylist, setSelectedStylist] = useState("No preference");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [clientInfo, setClientInfo] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const match = prev.find((item) => item.id === product.id);
      if (match) return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setShowCartDropdown(true);
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === id) {
        const nextQty = item.qty + delta;
        return nextQty > 0 ? { ...item, qty: nextQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartCount = cart.reduce((acc, curr) => acc + curr.qty, 0);
  const cartTotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

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

  return (
    <div className="min-h-screen relative antialiased selection:bg-amber-100" style={{ backgroundColor: SAND, color: INK }}>

      {/* HEADER NAVBAR */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? SAND : "transparent", borderBottom: scrolled ? `1px solid ${TAUPE}44` : "1px solid transparent" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <a
            href="#top"
            className="flex items-baseline gap-1.5 px-4 py-1.5 rounded-full"
            style={{ backgroundColor: scrolled ? "transparent" : "rgba(0,0,0,0.35)" }}
          >
            <span style={{ fontFamily: "serif", fontStyle: "italic", color: scrolled ? INK : "white" }} className="text-2xl font-bold">Terra</span>
            <span style={{ color: CLAY }} className="text-[10px] tracking-[0.25em] uppercase font-bold">Studio</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#services" className="hover:opacity-80" style={{ color: "#DC2626" }}>Services</a>
            <a href="#apothecary" className="hover:opacity-80" style={{ color: "#DC2626" }}>Apothecary</a>
            <a href="#gallery" className="hover:opacity-80" style={{ color: "#DC2626" }}>Gallery</a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowCartDropdown(!showCartDropdown)}
                className="p-2 relative rounded-full hover:bg-stone-200/50"
                aria-label="Open shopping basket"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 text-[9px] w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: CLAY }}
                  >
                    {cartCount}
                  </span>
                )}
              </button>

              {showCartDropdown && (
                <div className="absolute right-0 mt-3 w-80 p-4 rounded-xl shadow-2xl border animate-scaleIn z-50" style={{ backgroundColor: LINEN, borderColor: `${TAUPE}66` }}>
                  <div className="flex justify-between items-center pb-2 border-b mb-2" style={{ borderColor: TAUPE }}>
                    <span className="font-semibold text-sm">Shopping Basket</span>
                    <button onClick={() => setShowCartDropdown(false)} aria-label="Close basket">
                      <X size={16} />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <p className="text-xs py-4 text-center" style={{ color: TAUPE }}>Your cart is empty.</p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{item.name}</p>
                            <p className="text-[11px]" style={{ color: TAUPE }}>{naira(item.price)}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => updateCartQty(item.id, -1)} className="px-1.5 py-0.5 rounded bg-stone-200" aria-label={`Remove one ${item.name}`}>
                              <Minus size={12} />
                            </button>
                            <span className="text-xs w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="px-1.5 py-0.5 rounded bg-stone-200" aria-label={`Add one ${item.name}`}>
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: TAUPE }}>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span>Total</span>
                        <span>{naira(cartTotal)}</span>
                      </div>
                      <button
                        onClick={() => { alert("Order simulation submitted!"); setCart([]); setShowCartDropdown(false); }}
                        className="w-full py-2 text-xs font-bold text-white rounded-lg"
                        style={{ backgroundColor: INK }}
                      >
                        Checkout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

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
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#apothecary" onClick={() => setMobileMenuOpen(false)}>Apothecary</a>
            <a href="#gallery" onClick={() => setMobileMenuOpen(false)}>Gallery</a>
            <button onClick={() => startBooking()} className="py-2.5 rounded-full text-white text-center" style={{ background: INK }}>
              Book Now
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="top"
        className="relative min-h-[85vh] flex items-center justify-center pt-32 pb-24 px-6 text-center bg-cover"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}hero-background.jpg')`,
          backgroundPosition: "center 20%",
        }}
      >
        {/* Gradient overlay: subtle at top, darker toward bottom for text contrast */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        <div className="relative z-10">
          <p className="text-xs tracking-[0.3em] uppercase mb-4 text-white/90">Online Wellness Salon</p>
          <h1 className="text-4xl md:text-6xl font-serif italic max-w-2xl mx-auto leading-tight text-white">
            Bringing Beauty to your Doorstep
          </h1>
          <p className="max-w-md mx-auto mt-5 text-sm text-white/85">
            Facials, spa services, hair, nails and aesthetic treatments — booked in a couple of taps.
          </p>
          <button
            onClick={() => startBooking()}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3 rounded-full text-white text-sm font-medium shadow-lg"
            style={{ backgroundColor: CLAY }}
          >
            Reserve a salon service <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* CORE MENU SECTION */}
      <section id="services" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif italic mb-10 text-center">Services</h2>
        <div className="grid md:grid-cols-2 gap-10">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="p-6 rounded-2xl" style={{ backgroundColor: LINEN }}>
                <div className="flex items-center gap-3 mb-1">
                  <Icon size={18} style={{ color: cat.color }} />
                  <p className="text-xs font-bold tracking-wide uppercase" style={{ color: cat.color }}>{cat.tag}</p>
                </div>
                <h3 className="text-lg font-semibold mb-1">{cat.name}</h3>
                <p className="text-xs mb-3" style={{ color: `${INK}88` }}>{cat.blurb}</p>
                <div className="divide-y" style={{ borderColor: `${TAUPE}44` }}>
                  {cat.treatments.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => startBooking(t)}
                      className="w-full text-left"
                    >
                      <MenuRow name={t.name} time={t.time} price={t.price} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* APOTHECARY PRODUCT SECTION */}
      <section id="apothecary" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif italic mb-10 text-center">Apothecary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="p-5 rounded-2xl flex flex-col" style={{ backgroundColor: LINEN }}>
              <div className="w-full aspect-square rounded-xl mb-3" style={{ backgroundColor: `${p.color}22` }} />
              <p className="text-[11px] uppercase tracking-wide mb-1" style={{ color: TAUPE }}>{p.cat}</p>
              <p className="text-sm font-medium mb-2 flex-1">{p.name}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-semibold">{naira(p.price)}</span>
                <button
                  onClick={() => addToCart(p)}
                  className="p-1.5 rounded-full text-white"
                  style={{ backgroundColor: INK }}
                  aria-label={`Add ${p.name} to cart`}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GALLERY PRESENTATION SECTION */}
      <section id="gallery" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-serif italic mb-10 text-center">Gallery</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GALLERY.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.id} className="aspect-square rounded-xl flex flex-col items-center justify-center gap-2 text-center p-3" style={{ backgroundColor: `${g.color}18` }}>
                <Icon size={22} style={{ color: g.color }} />
                <p className="text-xs font-medium">{g.title}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE COMPREHENSIVE SCHEDULER WIZARD */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border animate-scaleIn" style={{ backgroundColor: LINEN }}>
            <div className="p-4 text-white flex justify-between items-center" style={{ backgroundColor: INK }}>
              <span className="font-medium text-sm">Reserve Salon Services</span>
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
                      {STYLISTS.map((st) => (
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
                    <p style={{ color: `${INK}88` }}>{bookingDate} @ {bookingTime} ({selectedStylist})</p>
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

                  {submitError && (
                    <p className="text-xs text-red-600">{submitError}</p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setBookingStep(2)} className="flex-1 py-2 text-xs border rounded-lg">Back</button>
                    <button
                      disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone || isSubmitting}
                      onClick={handleConfirmReservation}
                      className="flex-1 py-2 text-xs text-white rounded-lg disabled:opacity-40"
                      style={{ backgroundColor: CLAY }}
                    >
                      {isSubmitting ? "Submitting…" : "Submit Booking"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-12 text-center text-xs text-stone-400 border-t mt-20" style={{ backgroundColor: INK }}>
        <p>Terra Studio Wellness</p>
        <p>© {new Date().getFullYear()} Terra Studio Ltd. All rights reserved.</p>
      </footer>
    </div>
  );
}
