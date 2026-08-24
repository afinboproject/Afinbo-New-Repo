import React from 'react';
import { 
  ShieldCheck, 
  Award, 
  Wrench, 
  Activity, 
  Cpu, 
  CheckCircle2, 
  FileText, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from '../lib/router';

interface AboutAfinboProps {
  onRequestQuote: () => void;
  onOpenContact: () => void;
}

export const AboutAfinbo: React.FC<AboutAfinboProps> = ({
  onRequestQuote,
  onOpenContact,
}) => {
  return (
    <div className="bg-white min-h-screen">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white py-16 md:py-24">
        {/* Subtle high-tech background pattern */}
        <div 
          className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"
          aria-hidden="true"
        />
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-600" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            {/* Red Accent Bar & Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-4">
              <Link href="/" className="hover:text-rose-300 transition">
                Home
              </Link>
              <span className="text-slate-500">/</span>
              <span className="text-white">About AFINBO</span>
            </div>

            <div className="inline-flex items-center gap-2 bg-blue-900/60 border border-blue-700/50 rounded-full px-3.5 py-1 text-xs font-bold text-blue-300 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>West Africa’s Premier Optical Metrology & Tool Partner</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Precision Engineering. <br />
              <span className="text-blue-400">Uncompromising Integrity.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-8 font-normal">
              Afinbo Nigeria LTD is the authoritative supplier, certified calibration facility, and technical solutions provider for mission-critical fiber optic communication infrastructure across Nigeria and West Africa.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onRequestQuote}
                className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full shadow-md flex items-center gap-2 transition cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Request Equipment Quote</span>
              </button>
              <button
                onClick={onOpenContact}
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 font-bold text-xs sm:text-sm px-6 py-3 rounded-full transition cursor-pointer"
              >
                <span>Talk to an Engineer</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Numbers / Trust Stats Bar */}
      <section className="border-b border-slate-200/80 bg-slate-50/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-black text-blue-950">15+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Years Field Metrology</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-black text-rose-600">10,000+</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Splicers & OTDRs Serviced</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-black text-blue-950">100%</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">NIST/ISO Traceability</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200/70 shadow-2xs">
              <p className="text-3xl sm:text-4xl font-black text-rose-600">&lt;0.02 dB</p>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Calibrated Splice Loss</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Background Story */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                <span className="text-xs font-extrabold uppercase text-rose-600 tracking-wider">
                  Company Background
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                Bridging West Africa’s Telecommunication Infrastructure with Precision
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Established with a vision to provide world-class optical telecommunications instrumentation, <strong className="text-slate-900">AFINBO NIGERIA LTD</strong> has become the preferred technical partner for tier-1 network operators, metro fiber contractors, subsea cable landing stations, and data center providers.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                In fiber optic networks, sub-micron misalignments translate into signal degradation and network downtime. That is why Afinbo combines certified sales of industry-leading brands (Fujikura, Sumitomo, INNO, Fitel, EXFO, Miller) with an in-house laboratory providing accredited diagnostic testing, cleanroom optical alignment, and rapid spare parts distribution.
              </p>

              {/* Core Differentiators */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Direct OEM Brand Sourcing</h4>
                    <p className="text-xs text-slate-500">100% authentic fusion splicers, precision diamond cleaver blades, and optical test tools.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Authorized Calibration Lab</h4>
                    <p className="text-xs text-slate-500">Cleanroom optical metrology bench with traceable calibration certificates recognized by telecom regulators.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Dedicated Field Support</h4>
                    <p className="text-xs text-slate-500">Emergency 24/7 technical hotline, loaner equipment units, and on-site fiber troubleshooting.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Image Grid */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-100 bg-slate-900 aspect-4/3 relative group">
                <img
                  src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1200&q=80"
                  alt="Afinbo Optical Laboratory"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">State-of-the-Art Metrology</p>
                  <p className="text-sm font-semibold text-slate-200">
                    Afinbo Laboratory, Whitesand Avenue, Ikate Lagos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Services Section */}
      <section id="services" className="py-16 md:py-20 bg-slate-50 border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Comprehensive{' '}
              <span className="relative inline-block pb-1">
                Services
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-600 rounded-full" />
              </span>
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We ensure your fiber deployment teams operate with zero downtime, precision loss verification, and fully certified equipment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Fusion Splicer Calibration
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Comprehensive arc calibration, motor step alignment, CCD camera focus, and V-groove deep cleaning with certified loss test verification.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• Arc discharge discharge power tuning</li>
                <li>• Core-to-core PAS alignment verification</li>
                <li>• Official certificate with loss readings</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                OTDR & Power Meter Metrology
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Wavelength verification, linearity calibration, and dynamic range validation for EXFO, VIAVI, Anritsu, and Shineway testers.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• Multi-wavelength power linearity check</li>
                <li>• Event dead zone optical benchmark</li>
                <li>• Regulatory audit compliance certificate</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Factory Spare Parts & Blade Replacement
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Genuine OEM electrodes, circular cleaver diamond blades, replacement lithium batteries, heater elements, and carrying cases.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• 100% Genuine OEM parts guaranteed</li>
                <li>• In-stock warehouse ready for same-day dispatch</li>
                <li>• Blade height & position calibration</li>
              </ul>
            </div>

            {/* Service 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Equipment Maintenance Service Agreements (SLA)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Annual maintenance contracts (AMC) designed for large telecommunications fleets with guaranteed turnaround and backup loaner units.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• Priority lab queueing</li>
                <li>• Temporary loaner units during overhaul</li>
                <li>• Scheduled bi-annual preventive maintenance</li>
              </ul>
            </div>

            {/* Service 5 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Certified Field Splicing Training
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Hands-on practical training programs covering ribbon fiber handling, low-loss cleaving, OTDR trace interpretation, and safety protocols.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• Certified master technician instructors</li>
                <li>• Real-world field simulation scenarios</li>
                <li>• Individual certificate of competence</li>
              </ul>
            </div>

            {/* Service 6 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">
                Turnkey Telecom Equipment Procurement
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Direct procurement and structured supply for large-scale FTTH rollouts, long-haul backbone deployments, and enterprise campus networks.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-500 font-medium">
                <li>• Flexible batch quote pricing</li>
                <li>• Comprehensive warranty backing</li>
                <li>• End-to-end tooling package setup</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Quality Markers */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-rose-600/90 text-white text-xs font-bold px-3.5 py-1 rounded-full uppercase tracking-wider mb-4">
                Quality Assurance Guarantee
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-4">
                Every Splice & Every Decibel Accounted For
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Our optical engineers adhere strictly to ITU-T G.650 and IEC 61300 standards. All calibrated equipment leaves our Lagos laboratory with a serialized tamper-evident seal, traceable test certificate, and guaranteed measurement repeat reliability.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-200 mb-8">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>ITU-T G.652 & G.657 Single Mode Compliance</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>IEC 61300-3-35 End-Face Inspection Standard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>NIST Traceable Reference Light Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Full Post-Service Warranty Coverage</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 transition"
                >
                  <span>Explore Equipment Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={onOpenContact}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm px-6 py-3 rounded-full inline-flex items-center gap-2 transition cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Contact Sales & Support</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location & Facility Details */}
      <section className="py-12 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex items-start gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Head Office & Lab</h4>
                <p className="text-xs font-extrabold text-slate-900 mt-1">Whitesand Avenue, Ikate Lagos, Nigeria</p>
                <p className="text-xs text-slate-500 mt-0.5">Central service & dispatch center</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex items-start gap-4">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Inquiries</h4>
                <p className="text-xs font-extrabold text-slate-900 mt-1">+234 803 392 2029</p>
                <p className="text-xs text-slate-500 mt-0.5">WhatsApp and direct engineer line</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Business Hours</h4>
                <p className="text-xs font-extrabold text-slate-900 mt-1">Mon - Fri: 8:00 AM – 6:00 PM</p>
                <p className="text-xs text-slate-500 mt-0.5">24/7 emergency field standby</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
