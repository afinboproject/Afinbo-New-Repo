import React from 'react';
import { X, MapPin, Phone, MessageSquare, Mail } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        
        {/* Top Red Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-600 rounded-t-3xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          Contact AFINBO Sales & Support
        </h3>
        <p className="text-slate-500 text-xs mb-6">
          Reach out directly to our fiber optic equipment specialists and calibration technical team.
        </p>

        {/* Contact Info Cards */}
        <div className="space-y-3 mb-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Physical Address</p>
              <p className="text-xs text-slate-600">Whitesand Avenue, Ikate Lagos, Nigeria</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Phone & Support Hotline</p>
              <p className="text-xs text-slate-600">+2348033922029</p>
            </div>
          </div>

          <a
            href="https://wa.me/2348033922029"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 transition group"
          >
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                <span>Instant WhatsApp Support</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">ONLINE</span>
              </p>
              <p className="text-xs text-emerald-700">Chat live with our technical engineers &rarr;</p>
            </div>
          </a>
        </div>

        <button
          onClick={() => {
            onClose();
            onSuccess('Contact inquiry logged! A representative will reach out shortly.');
          }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition cursor-pointer"
        >
          Close Window
        </button>

      </div>
    </div>
  );
};
