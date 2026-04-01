import React from 'react';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const posts = [
  { title: "5 Essential Exercises For Building Muscle", date: "August 14", tag: "Strength", img: "/blogpost1.png", big: true },
  { title: "The Ultimate Guide To A Balanced Diet", date: "Sept 01", tag: "Nutrition", img: "/blogpost2-diet.png", big: false },
  { title: "The Benefits Of HIIT Training", date: "Sept 05", tag: "Cardio", img: "/blogppost-cardio.png", big: false },
  { title: "Home Workouts For Busy People", date: "Sept 10", tag: "Home", img: "/blogpost4-homeworkout.png", big: false },
  { title: "How To Always Stay Motivated", date: "Sept 12", tag: "Mindset", img: "/blogpost1.png", big: false },
];

const BlogSection = () => {
  return (
    <section id="blog" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
           <h2 className="text-4xl font-bold">PrimeFit <span className="text-brand-red">Blog Posts</span></h2>
           <Link href="/blog" className="text-brand-red hover:text-white transition-colors flex items-center gap-2">
             View All <ArrowRight size={16}/>
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
          {/* Big Feature Post */}
          <div className="md:col-span-1 md:row-span-2 relative group overflow-hidden rounded-xl cursor-pointer h-[400px] md:h-full">
             <Image src={posts[0].img} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
             <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
             <div className="absolute bottom-0 p-6 w-full">
                <h3 className="text-2xl font-bold mb-4">{posts[0].title}</h3>
                <div className="flex gap-4 text-xs text-gray-300">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {posts[0].date}</span>
                    <span className="flex items-center gap-1"><Tag size={12}/> {posts[0].tag}</span>
                </div>
             </div>
          </div>

          {/* Small Posts */}
          {posts.slice(1).map((post, idx) => (
            <div key={idx} className="relative group overflow-hidden rounded-xl cursor-pointer h-[280px]">
              <Image src={post.img} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors"></div>
              <div className="absolute bottom-0 p-4 w-full">
                 <h4 className="font-bold text-sm mb-1 leading-tight">{post.title}</h4>
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-300">{post.tag}</span>
                    <span className="text-brand-red text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Read <ArrowRight size={10}/></span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
