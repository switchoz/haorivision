import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import PageMeta from "../components/PageMeta";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Blog() {
  const { isUVMode } = useTheme();
  const [posts, setPosts] = useState([]);
  const [tags, setTags] = useState([]);
  const [activeTag, setActiveTag] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1, tag = activeTag) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(p), limit: "12" });
      if (tag) qs.set("tag", tag);
      const r = await fetch(`${API_URL}/api/blog?${qs}`);
      const data = await r.json();
      setPosts(data.items || []);
      setTags(data.tags || []);
      setPage(data.page || 1);
      setPages(data.pages || 1);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
  }, []);

  const handleTag = (tag) => {
    const next = activeTag === tag ? "" : tag;
    setActiveTag(next);
    load(1, next);
  };

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta
        title="Журнал"
        description="Журнал HAORI VISION — истории создания, процесс работы, вдохновение художника LiZa"
      />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1
            className={`text-5xl md:text-7xl font-display font-bold mb-6 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            Журнал
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Истории создания, процесс работы и вдохновение
          </p>
        </motion.div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTag === tag
                    ? isUVMode
                      ? "bg-purple-600 text-white"
                      : "bg-white text-black"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Posts grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
                  <div className="aspect-[16/10] bg-zinc-800" />
                  <div className="p-5 space-y-3">
                    <div className="flex gap-1.5">
                      <div className="h-5 w-14 bg-zinc-800 rounded-full" />
                      <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="h-5 bg-zinc-800 rounded w-4/5" />
                    <div className="space-y-2">
                      <div className="h-3 bg-zinc-800 rounded w-full" />
                      <div className="h-3 bg-zinc-800 rounded w-2/3" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="h-3 bg-zinc-800 rounded w-20" />
                      <div className="h-3 bg-zinc-800 rounded w-24" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <p className="text-xl">Пока нет публикаций</p>
            <p className="mt-2">Скоро здесь появятся статьи</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, i) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/journal/${post.slug}`} className="group block">
                  <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors">
                    {post.coverImage ? (
                      <div className="aspect-[16/10] overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className={`aspect-[16/10] flex items-center justify-center ${
                          isUVMode
                            ? "bg-gradient-to-br from-purple-900/50 to-pink-900/50"
                            : "bg-zinc-800"
                        }`}
                      >
                        <span
                          className="text-4xl"
                          style={{ fontFamily: "serif" }}
                        >
                          光
                        </span>
                      </div>
                    )}
                    <div className="p-5">
                      {post.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2
                        className={`text-lg font-bold mb-2 group-hover:text-purple-400 transition-colors ${
                          isUVMode ? "text-white" : "text-white"
                        }`}
                      >
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-zinc-400 text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>{post.author}</span>
                        {post.publishedAt && (
                          <span>
                            {new Date(post.publishedAt).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-4 mt-12">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="px-6 py-3 bg-zinc-800 text-white rounded-full disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            >
              Назад
            </button>
            <span className="px-4 py-3 text-zinc-400">
              {page} / {pages}
            </span>
            <button
              disabled={page >= pages}
              onClick={() => load(page + 1)}
              className="px-6 py-3 bg-zinc-800 text-white rounded-full disabled:opacity-50 hover:bg-zinc-700 transition-colors"
            >
              Вперёд
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
