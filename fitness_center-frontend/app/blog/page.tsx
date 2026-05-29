"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Tag, ArrowUpRight, FolderOpen } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ResourceItem, ResourcesAPI } from "@/app/lib/api";

const getCategoryLabel = (category: string): string => {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getResourceDateLabel = (resource: ResourceItem): string => {
  const source =
    resource.uploadDate || resource.createdAt || resource.updatedAt;
  if (!source) return "Recent";

  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return "Recent";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
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

const getActionLabel = (resource: ResourceItem): string => {
  if (resource.type === "video") return "Watch Video";
  if (resource.type === "link") return "Open Resource";
  return "Read More";
};

export default function BlogPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  const articles = useMemo(() => {
    return resources
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
  }, [resources]);

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 min-h-screen">
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-brand-red transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>
      <h1 className="text-5xl font-bold mb-4">
        All <span className="text-brand-red">Articles</span>
      </h1>
      <p className="text-gray-400 mb-12">
        Explore the latest fitness resources, guides, and videos shared by the
        admin team.
      </p>

      {loading ? (
        <div className="bg-brand-gray rounded-xl p-10 border border-white/10 text-center text-gray-400">
          Loading articles...
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-brand-gray rounded-xl p-10 border border-white/10 text-center">
          <FolderOpen className="mx-auto text-brand-red mb-3" size={40} />
          <h2 className="text-xl font-bold mb-2">No articles published yet</h2>
          <p className="text-gray-400">
            Admin-added fitness resources will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => {
            const articleUrl = getResourceUrl(article);

            return (
              <article
                key={article._id || article.id || article.title}
                className="bg-brand-gray/75 border border-white/10 rounded-2xl overflow-hidden hover:border-brand-red/40 transition-all hover:-translate-y-1"
              >
                <div className="h-44 bg-linear-to-br from-brand-red/20 via-black/25 to-black/70 p-6 flex items-end">
                  <div>
                    <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-brand-red bg-brand-red/10 px-3 py-1 rounded-full mb-3">
                      <FolderOpen size={12} /> {article.type}
                    </span>
                    <h2 className="text-xl font-bold leading-tight line-clamp-2">
                      {article.title}
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                      <Calendar size={12} /> {getResourceDateLabel(article)}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1">
                      <Tag size={12} /> {getCategoryLabel(article.category)}
                    </span>
                  </div>

                  <p className="text-gray-400 text-sm mb-6 line-clamp-4 leading-6">
                    {article.description}
                  </p>

                  {articleUrl ? (
                    <a
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-brand-red text-white px-4 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                    >
                      {getActionLabel(article)} <ArrowUpRight size={14} />
                    </a>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      No article link available
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
