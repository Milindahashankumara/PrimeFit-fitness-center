import React from 'react';
import { Calendar, Tag } from 'lucide-react';
import Image from 'next/image';

const posts = [
  { title: "5 Essential Exercises For Building Muscle", date: "August 14", tag: "Strength", img: "/blogpost1.png" },
  { title: "The Ultimate Guide To A Balanced Diet", date: "Sept 01", tag: "Nutrition", img: "/blogpost2-diet.png" },
  { title: "The Benefits Of HIIT Training", date: "Sept 05", tag: "Cardio", img: "/blogppost-cardio.png" },
  { title: "Home Workouts For Busy People", date: "Sept 10", tag: "Home", img: "/blogpost4-homeworkout.png" },
  { title: "Understanding Muscle Recovery", date: "Sept 12", tag: "Recovery", img: "/blogpost1.png" },
  { title: "Nutrition Tips for Beginners", date: "Sept 15", tag: "Nutrition", img: "/blogpost2-diet.png" },
];

export default function BlogPage() {
  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 min-h-screen">
      <h1 className="text-5xl font-bold mb-4">All <span className="text-brand-red">Articles</span></h1>
      <p className="text-gray-400 mb-12">Explore our latest fitness tips, nutrition guides, and workout advice.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post, i) => (
            <div key={i} className="bg-brand-gray rounded-xl overflow-hidden border border-white/5 hover:border-brand-red/50 transition-all group cursor-pointer">
                <div className="h-48 relative">
                    <Image src={post.img} fill className="object-cover group-hover:scale-105 transition-transform duration-500" alt={post.title} />
                </div>
                <div className="p-6">
                    <div className="flex gap-4 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12}/> {post.date}</span>
                        <span className="flex items-center gap-1"><Tag size={12}/> {post.tag}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-4 group-hover:text-brand-red transition-colors">{post.title}</h2>
                    <p className="text-gray-400 text-sm mb-4">A comprehensive guide to help you achieve your fitness goals with expert tips and advice.</p>
                    <button className="text-white underline decoration-brand-red underline-offset-4 hover:text-brand-red transition-colors">Read More</button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
