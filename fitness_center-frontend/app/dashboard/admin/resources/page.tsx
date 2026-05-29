"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Folder,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Search,
  Star,
  Trash2,
  Video,
  XCircle,
} from "lucide-react";
import { ResourceItem, ResourcesAPI } from "@/app/lib/api";

type ResourceForm = {
  id: string;
  title: string;
  description: string;
  type: "document" | "video" | "image" | "link";
  category: ResourceItem["category"];
  linkUrl: string;
  isPublic: boolean;
  tags: string[];
};

const emptyForm: ResourceForm = {
  id: "",
  title: "",
  description: "",
  type: "document",
  category: "workout-plan",
  linkUrl: "",
  isPublic: true,
  tags: [],
};

export default function ResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<
    "all" | "document" | "video" | "image" | "link"
  >("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<ResourceForm>(emptyForm);

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

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesTab = activeTab === "all" || resource.type === activeTab;
      const matchesCategory =
        selectedCategory === "all" || resource.category === selectedCategory;
      const searchTarget = [
        resource.title,
        resource.description,
        ...(resource.tags || []),
      ]
        .join(" ")
        .toLowerCase();
      const matchesSearch =
        !searchQuery || searchTarget.includes(searchQuery.toLowerCase());
      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [resources, activeTab, selectedCategory, searchQuery]);

  const counts = useMemo(
    () => ({
      documents: resources.filter((resource) => resource.type === "document")
        .length,
      videos: resources.filter((resource) => resource.type === "video").length,
      images: resources.filter((resource) => resource.type === "image").length,
      links: resources.filter((resource) => resource.type === "link").length,
      downloads: resources.reduce(
        (sum, resource) => sum + (resource.downloads || 0),
        0,
      ),
      views: resources.reduce(
        (sum, resource) => sum + (resource.views || 0),
        0,
      ),
    }),
    [resources],
  );

  const getTypeIcon = (type: ResourceForm["type"]) => {
    switch (type) {
      case "document":
        return <FileText size={20} />;
      case "video":
        return <Video size={20} />;
      case "image":
        return <ImageIcon size={20} />;
      case "link":
        return <LinkIcon size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const getTypeColor = (type: ResourceForm["type"]) => {
    switch (type) {
      case "document":
        return "text-blue-400 bg-blue-500/20";
      case "video":
        return "text-purple-400 bg-purple-500/20";
      case "image":
        return "text-green-400 bg-green-500/20";
      case "link":
        return "text-yellow-400 bg-yellow-500/20";
      default:
        return "text-gray-400 bg-gray-500/20";
    }
  };

  const getCategoryLabel = (category: string) =>
    category
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const openResource = async (resource: ResourceItem) => {
    if (resource._id) {
      await ResourcesAPI.incrementDownload(resource._id);
    }

    const url =
      resource.type === "link"
        ? resource.linkUrl
        : resource.type === "video"
          ? resource.videoUrl || resource.linkUrl
          : resource.type === "image"
            ? resource.imageUrl || resource.fileUrl
            : resource.fileUrl || resource.imageUrl;

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedFile(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setShowUploadModal(true);
  };

  const handleEdit = (resource: ResourceItem) => {
    setFormData({
      id: String(resource._id || resource.id || ""),
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      linkUrl: resource.linkUrl || resource.videoUrl || "",
      isPublic: resource.isPublic ?? true,
      tags: resource.tags || [],
    });
    setSelectedFile(null);
    setShowUploadModal(true);
  };

  const saveResource = async () => {
    try {
      setSaving(true);
      const payload = new FormData();
      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("type", formData.type);
      payload.append("category", formData.category);
      if (formData.type === "video") {
        payload.append("videoUrl", formData.linkUrl);
      } else {
        payload.append("linkUrl", formData.linkUrl);
      }
      payload.append("isPublic", String(formData.isPublic));
      payload.append("tags", formData.tags.join(", "));
      payload.append("status", formData.isPublic ? "published" : "draft");

      if (selectedFile) {
        payload.append("file", selectedFile);
      }

      if (formData.id) {
        await ResourcesAPI.update(formData.id, payload);
        setSuccessMessage("Resource updated successfully.");
      } else {
        await ResourcesAPI.create(payload);
        setSuccessMessage("Resource added successfully.");
      }

      setResources(await ResourcesAPI.getAll());
      setShowUploadModal(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || "Failed to save resource");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;

    try {
      setSaving(true);
      await ResourcesAPI.delete(resourceToDelete);
      setResources(await ResourcesAPI.getAll());
      setSuccessMessage("Resource deleted successfully.");
      setShowDeleteModal(false);
      setResourceToDelete(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message || "Failed to delete resource");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <header className="bg-brand-gray border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="hover:text-brand-red transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Fitness Resources</h1>
              <p className="text-sm text-gray-400">
                Manage and share fitness-related content
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateNew}
            className="bg-brand-red hover:bg-red-600 px-5 py-3 rounded-lg font-semibold flex items-center gap-2"
          >
            <Plus size={18} />
            Add Resource
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {showSuccess && (
          <div className="mb-6 bg-green-500/20 border border-green-500 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <p className="font-semibold text-green-400">{successMessage}</p>
          </div>
        )}

        <section className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Folder className="text-brand-red mb-2" size={32} />
            <p className="text-3xl font-bold">{resources.length}</p>
            <p className="text-sm text-gray-400">Total Resources</p>
          </div>
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Download className="text-blue-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{counts.downloads}</p>
            <p className="text-sm text-gray-400">Total Downloads</p>
          </div>
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Eye className="text-green-500 mb-2" size={32} />
            <p className="text-3xl font-bold">{counts.views}</p>
            <p className="text-sm text-gray-400">Total Views</p>
          </div>
          <div className="bg-brand-gray rounded-xl p-6 border border-white/10">
            <Star className="text-yellow-500 mb-2" size={32} />
            <p className="text-3xl font-bold">
              {resources.filter((resource) => resource.isPublic).length}
            </p>
            <p className="text-sm text-gray-400">Public Resources</p>
          </div>
        </section>

        <section className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources by title, description, or tags..."
              className="w-full bg-brand-gray border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-brand-red focus:outline-none"
            />
          </div>
          <div className="md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-brand-gray border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="workout-plan">Workout Plans</option>
              <option value="nutrition">Nutrition</option>
              <option value="exercise-guide">Exercise Guides</option>
              <option value="health-tips">Health Tips</option>
              <option value="other">Other</option>
            </select>
          </div>
        </section>

        <section className="flex gap-2 mb-8 bg-brand-gray p-2 rounded-xl border border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap ${activeTab === "all" ? "bg-brand-red text-white" : "text-gray-400 hover:text-white"}`}
          >
            <Filter size={18} /> All ({resources.length})
          </button>
          <button
            onClick={() => setActiveTab("document")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap ${activeTab === "document" ? "bg-blue-500 text-brand-dark" : "text-gray-400 hover:text-white"}`}
          >
            <FileText size={18} /> Documents ({counts.documents})
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap ${activeTab === "video" ? "bg-purple-500 text-brand-dark" : "text-gray-400 hover:text-white"}`}
          >
            <Video size={18} /> Videos ({counts.videos})
          </button>
          <button
            onClick={() => setActiveTab("image")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap ${activeTab === "image" ? "bg-green-500 text-brand-dark" : "text-gray-400 hover:text-white"}`}
          >
            <ImageIcon size={18} /> Images ({counts.images})
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold whitespace-nowrap ${activeTab === "link" ? "bg-yellow-500 text-brand-dark" : "text-gray-400 hover:text-white"}`}
          >
            <LinkIcon size={18} /> Links ({counts.links})
          </button>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full bg-brand-gray rounded-2xl p-12 border border-white/10 text-center text-gray-400">
              Loading resources...
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="col-span-full bg-brand-gray rounded-2xl p-12 border border-white/10 text-center">
              <Folder className="mx-auto mb-4 text-gray-600" size={64} />
              <h3 className="text-xl font-bold mb-2">No resources found</h3>
              <p className="text-gray-400 mb-4">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first resource"}
              </p>
              {!searchQuery && selectedCategory === "all" && (
                <button
                  onClick={handleCreateNew}
                  className="bg-brand-red hover:bg-red-600 px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
                >
                  <Plus size={20} /> Add Resource
                </button>
              )}
            </div>
          ) : (
            filteredResources.map((resource) => (
              <article
                key={resource._id || resource.id}
                className="bg-brand-gray rounded-2xl p-6 border border-white/10 flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-lg ${getTypeColor(resource.type)}`}
                  >
                    {getTypeIcon(resource.type)}
                  </div>
                  {!resource.isPublic && (
                    <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold mb-2">{resource.title}</h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                  {resource.description}
                </p>

                <div className="mb-4">
                  <span className="text-xs bg-brand-red/20 text-brand-red px-2 py-1 rounded">
                    {getCategoryLabel(resource.category)}
                  </span>
                </div>

                {!!resource.tags?.length && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {resource.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {resource.fileName && (
                  <div className="bg-black/40 p-3 rounded-lg mb-4 text-xs">
                    <p className="text-gray-400 truncate mb-1">
                      {resource.fileName}
                    </p>
                    <p className="text-gray-500">{resource.fileSize}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="bg-black/40 p-2 rounded text-center">
                    <Eye className="mx-auto mb-1 text-gray-400" size={14} />
                    <p className="font-semibold">{resource.views || 0}</p>
                    <p className="text-gray-500">views</p>
                  </div>
                  <div className="bg-black/40 p-2 rounded text-center">
                    <Download
                      className="mx-auto mb-1 text-gray-400"
                      size={14}
                    />
                    <p className="font-semibold">{resource.downloads || 0}</p>
                    <p className="text-gray-500">downloads</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  <p>
                    Uploaded:{" "}
                    {resource.createdAt
                      ? new Date(resource.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )
                      : "N/A"}
                  </p>
                  <p>By {resource.uploadedBy || "Admin"}</p>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
                  <button
                    onClick={() => openResource(resource)}
                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                  >
                    {resource.type === "link" ? (
                      <Eye size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    {resource.type === "link" ? "View" : "Download"}
                  </button>
                  <button
                    onClick={() => handleEdit(resource)}
                    className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setResourceToDelete(
                        String(resource._id || resource.id || ""),
                      );
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {formData.id ? "Edit Resource" : "Add New Resource"}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="hover:text-brand-red transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Resource Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as ResourceForm["type"],
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="document">Document</option>
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="link">External Link</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as ResourceItem["category"],
                      })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  >
                    <option value="workout-plan">Workout Plan</option>
                    <option value="nutrition">Nutrition</option>
                    <option value="exercise-guide">Exercise Guide</option>
                    <option value="health-tips">Health Tips</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {(formData.type === "link" || formData.type === "video") && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Link URL *
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, linkUrl: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  />
                </div>
              )}

              {(formData.type === "document" || formData.type === "image") && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Upload File *
                  </label>
                  <input
                    type="file"
                    accept={
                      formData.type === "image"
                        ? "image/*"
                        : ".pdf,.doc,.docx,.txt,.ppt,.pptx"
                    }
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                  />
                  {selectedFile && (
                    <p className="text-xs text-green-400 mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(", ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white focus:border-brand-red focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 bg-black/40 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublic: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-sm cursor-pointer">
                  Make this resource publicly accessible to all users
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveResource}
                disabled={
                  saving ||
                  !formData.title ||
                  !formData.description ||
                  ((formData.type === "document" ||
                    formData.type === "image") &&
                    !selectedFile &&
                    !formData.id)
                }
                className="flex-1 bg-brand-red hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving
                  ? "Saving..."
                  : formData.id
                    ? "Update Resource"
                    : "Add Resource"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-gray rounded-2xl max-w-md w-full p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="text-red-500" size={32} />
              <h3 className="text-xl font-bold">Delete Resource</h3>
            </div>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
