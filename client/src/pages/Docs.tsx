import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import {
  BookOpen,
  Search,
  FileText,
  Calculator,
  TrendingUp,
  MessageCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import type { Document } from "@shared/schema";
import { fetchDocs, type DocItem } from "@/lib/docs";
import { resolveApiUrl } from "@/lib/apiBase";

const getCategoryIcon = (category: string) => {
  switch ((category || "").toLowerCase()) {
    case "calculator":
      return Calculator;
    case "pro-rata":
    case "pro rata":
      return TrendingUp;
    case "assistant":
      return MessageCircle;
    default:
      return FileText;
  }
};

export default function Docs() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  // 1) Google Docs (from shared/docs.json via /api/docs)
  const {
    data: gdocs = [],
    isLoading: loadingGdocs,
    error: errorGdocs,
  } = useQuery<DocItem[]>({
    queryKey: ["docs-google"],
    queryFn: () => fetchDocs(),
  });

  // 2) Site documents (from storage)
  const {
    data: siteDocs = [],
    isLoading: loadingSite,
    error: errorSite,
  } = useQuery<Document[]>({
    queryKey: ["docs-site", searchQuery],
    queryFn: async () => {
      const url = searchQuery
        ? `/api/documents?q=${encodeURIComponent(searchQuery)}`
        : "/api/documents";
      const r = await fetch(resolveApiUrl(url), { cache: "no-store" });
      if (!r.ok) throw new Error("Failed to fetch documents");
      return r.json();
    },
  });

  const query = searchQuery.trim().toLowerCase();

  const filteredGdocs = useMemo(() => {
    if (!query) return gdocs;
    return gdocs.filter(
      (d) =>
        d.title.toLowerCase().includes(query) ||
        d.tags.some((t) => t.toLowerCase().includes(query))
    );
  }, [gdocs, query]);

  const filteredSite = useMemo(() => {
    if (!query) return siteDocs;
    return siteDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query) ||
        doc.description.toLowerCase().includes(query) ||
        doc.category.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [siteDocs, query]);

  const isLoading = loadingGdocs || loadingSite;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <div className="container mx-auto px-6 pt-32 pb-24 max-w-6xl">
        {/* Page header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {t("docsTitle")}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {t("docsSubtitle")}
          </p>

          {/* Search bar */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchDocs")}
                className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white/70 dark:bg-neutral-900/50 backdrop-blur-xl border border-white/20 dark:border-white/10 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-lg shadow-glass"
                data-testid="input-search-docs"
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Google Docs section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <ExternalLink className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Google Docs</h2>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
            </div>
          )}

          {!isLoading && (errorGdocs || filteredGdocs.length === 0) && (
            <GlassCard className="p-6 text-sm text-muted-foreground">
              No Google Docs found.
            </GlassCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading &&
              filteredGdocs.map((d) => (
                <a
                  key={d.id}
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                  title={d.url}
                >
                  <GlassCard className="p-5 h-full hover:-translate-y-0.5 transition-transform">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-lg mb-1 truncate">
                          {d.title}
                        </h3>
                        <div className="flex gap-2">
                          {d.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700"
                            >
                              {tag.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-orange-500" />
                    </div>
                  </GlassCard>
                </a>
              ))}
          </div>
        </div>

        {/* Site Guides section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Site Guides</h2>
          </div>

          {loadingSite && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
            </div>
          )}

          {!loadingSite && (errorSite || filteredSite.length === 0) && (
            <GlassCard className="p-6 text-sm text-muted-foreground">
              No site documents found.
            </GlassCard>
          )}

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <AnimatePresence mode="popLayout">
              {!loadingSite &&
                filteredSite.length > 0 &&
                filteredSite.map((doc) => {
                  const Icon = getCategoryIcon(doc.category);
                  return (
                    <motion.div
                      key={doc.id}
                      layout
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4 }}
                    >
                      <GlassCard className="p-6 h-full group">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-bold text-lg mb-1 text-foreground truncate">
                              {doc.title}
                            </h3>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                              {doc.category}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                          {doc.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {doc.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 rounded-full text-xs bg-background border border-border text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
