import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import PageMeta from "../components/PageMeta";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function BlogPost() {
  const { slug } = useParams();
  const { isUVMode } = useTheme();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const r = await fetch(
          `${API_URL}/api/blog/${encodeURIComponent(slug)}`,
        );
        if (!r.ok) throw new Error();
        const data = await r.json();
        setPost(data.post);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-zinc-600 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Статья не найдена
          </h1>
          <Link
            to="/journal"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Вернуться в журнал
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-24 px-4">
      <PageMeta title={post.title} description={post.excerpt} />
      <article className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          to="/journal"
          className="text-zinc-500 hover:text-white text-sm transition-colors mb-8 inline-block"
        >
          &larr; Журнал
        </Link>

        {/* Cover */}
        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl overflow-hidden mb-10"
          >
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full max-h-[500px] object-cover"
            />
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((t) => (
                <Link
                  key={t}
                  to={`/journal?tag=${t}`}
                  className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}

          <h1
            className={`text-4xl md:text-5xl font-display font-bold mb-4 ${
              isUVMode ? "gradient-text text-glow" : "text-white"
            }`}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-zinc-500">
            <span>{post.author}</span>
            {post.publishedAt && (
              <>
                <span className="text-zinc-700">·</span>
                <span>
                  {new Date(post.publishedAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-display prose-headings:text-white
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <Link
            to="/journal"
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            &larr; Все статьи
          </Link>
        </div>
      </article>
    </div>
  );
}
