import React from 'react';
import { MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111] py-20 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div>
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-brand-red rounded-sm"></div>
                <span className="text-2xl font-bold">Prime<span className="text-brand-red">Fit</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Transform your body with PrimeFit. Your trusted partner in fitness. Join our community and start your journey today.
            </p>
            <div className="text-sm text-gray-500">
                With Over <span className="text-brand-red font-bold">5 Years</span> of Experience.
            </div>
        </div>

        {/* Links 1 */}
        <div>
            <h4 className="text-brand-red font-bold text-lg mb-6">Company</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Our Services</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Testimonial</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
            </ul>
        </div>

        {/* Links 2 */}
        <div>
            <h4 className="text-brand-red font-bold text-lg mb-6">Resources</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white">Fitness Tools</a></li>
                <li><a href="#" className="hover:text-white">Workout Videos</a></li>
                <li><a href="#" className="hover:text-white">Nutrition Guides</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Success Stories</a></li>
                <li><a href="#" className="hover:text-white">Membership</a></li>
            </ul>
        </div>

        {/* Contact Info */}
        <div>
            <h4 className="text-brand-red font-bold text-lg mb-6">Contact Us</h4>
            <ul className="space-y-6 text-gray-400 text-sm">
                <li className="flex items-start gap-3">
                    <MapPin className="text-white shrink-0" size={20} />
                    <span>Moratuwa, Sri Lanka</span>
                </li>
                <li className="flex items-center gap-3">
                    <Phone className="text-white shrink-0" size={20} />
                    <span>1234-56789</span>
                </li>
                <li className="flex items-center gap-3">
                    <Mail className="text-white shrink-0" size={20} />
                    <span>Primefit123@Gmail.Com</span>
                </li>
            </ul>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
