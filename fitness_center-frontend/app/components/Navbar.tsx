"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed w-full z-50 bg-brand-dark/90 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-red rounded-sm"></div>
            <span className="text-2xl font-bold tracking-wider">
              Prime<span className="text-brand-red">Fit</span>
            </span>
          </Link>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/#home"
                className="hover:text-brand-red transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/#programs"
                className="hover:text-brand-red transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Programs
              </Link>
              <Link
                href="/#coaching"
                className="hover:text-brand-red transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Coaching
              </Link>
              <Link
                href="/#membership"
                className="hover:text-brand-red transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Membership
              </Link>
              <Link
                href="/blog"
                className="hover:text-brand-red transition-colors px-3 py-2 rounded-md text-sm font-medium"
              >
                Blog
              </Link>
            </div>
          </div>

          <div className="hidden md:flex gap-4">
            <Link
              href="/auth/login"
              className="border border-brand-red text-brand-red px-6 py-2 rounded hover:bg-brand-red hover:text-white transition-all"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              className="bg-brand-red text-white px-6 py-2 rounded hover:bg-red-700 transition-all"
            >
              Sign Up
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
