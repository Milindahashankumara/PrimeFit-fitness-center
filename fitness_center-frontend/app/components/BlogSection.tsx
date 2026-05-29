"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Tag, ArrowRight, FolderOpen } from "lucide-react";
import Link from "next/link";
import { ResourceItem, ResourcesAPI } from "@/app/lib/api";

const formatCategory = (category: ResourceItem["category"]): string => {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getResourceDate = (resource: ResourceItem): string => {
  const possibleDate =
    resource.uploadDate || resource.createdAt || resource.updatedAt;
  if (!possibleDate) return "Recent";

  const parsed = new Date(possibleDate);
  if (Number.isNaN(parsed.getTime())) return "Recent";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
};

const getResourceUrl = (resource: ResourceItem): string | null => {
  if (resource.type === "link") {
    return resource.linkUrl || null;
  }

  if (resource.type === "video") {
    return resource.videoUrl || resource.linkUrl || null;
  }

  return resource.fileUrl || resource.imageUrl || resource.videoUrl || null;
};

const BlogSection = () => {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const data = await ResourcesAPI.getAll();
        setResources(data);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, []);

  const latestPosts = useMemo(() => {
    const visibleResources = resources
      .filter(
        (resource) =>
          resource.isPublic !== false && resource.status !== "archived",
      )
      .sort((a, b) => {
        const aSource = a.uploadDate || a.createdAt || a.updatedAt;
        const bSource = b.uploadDate || b.createdAt || b.updatedAt;
        const aTime = aSource ? new Date(aSource).getTime() : 0;
        const bTime = bSource ? new Date(bSource).getTime() : 0;
        return bTime - aTime;
      });

    return visibleResources.slice(0, 3);
  }, [resources]);

  return (
    <section id="blog" className="py-20 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div className="max-w-2xl">
            <p className="text-brand-red uppercase tracking-[0.2em] text-xs font-semibold mb-3">
              Latest Updates
            </p>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              PrimeFit <span className="text-brand-red">Blog Posts</span>
            </h2>
            <p className="text-gray-400 mt-3 text-sm md:text-base">
              Fresh fitness resources, guides, and videos shared by the admin
              team.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-red hover:text-white transition-colors border border-brand-red/30 hover:border-brand-red px-4 py-2 rounded-full bg-brand-red/5 self-start md:self-auto"
          >
            View All <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="bg-brand-gray rounded-xl p-10 border border-white/10 text-center text-gray-400">
            Loading fitness resources...
          </div>
        ) : latestPosts.length === 0 ? (
          <div className="bg-brand-gray rounded-xl p-10 border border-white/10 text-center">
            <FolderOpen className="mx-auto text-brand-red mb-3" size={40} />
            <h3 className="text-xl font-bold mb-2">
              No resources published yet
            </h3>
            <p className="text-gray-400">
              New admin fitness resources will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestPosts.map((resource) => {
              const resourceUrl = getResourceUrl(resource);

              return (
                <article
                  key={resource._id || resource.id || resource.title}
                  className="h-full min-h-[420px] bg-brand-gray/75 border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-brand-red/40 transition-all"
                >
                  <div className="h-44 bg-linear-to-br from-brand-red/20 via-black/25 to-black/70 p-6 flex items-end">
                    <div>
                      <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-brand-red bg-brand-red/10 px-3 py-1 rounded-full mb-3">
                        <FolderOpen size={12} /> {resource.type}
                      </span>
                      <h3 className="text-xl font-bold leading-tight line-clamp-2">
                        {resource.title}
                      </h3>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                        <Calendar size={12} /> {getResourceDate(resource)}
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                        <Tag size={12} /> {formatCategory(resource.category)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 leading-6 line-clamp-4 flex-1">
                      {resource.description}
                    </p>

                    <div className="pt-5 mt-5 border-t border-white/10">
                      {resourceUrl ? (
                        <a
                          href={resourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-brand-red text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors w-full justify-center"
                        >
                          Open Resource <ArrowRight size={14} />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-gray-400 text-sm">
                          Resource Link Unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default BlogSection;
