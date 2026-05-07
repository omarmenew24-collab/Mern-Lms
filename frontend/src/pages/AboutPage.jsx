import { usePublicAbout } from "../api/admin";
import { paths } from "../config/paths";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, GraduationCap, Sparkles } from "lucide-react";

function splitBody(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function AboutBlocksContent({ blocks }) {
  if (!Array.isArray(blocks) || !blocks.length) return null;

  return (
    <div className="space-y-12 sm:space-y-16">
      {blocks.map((b, i) => {
        const splitBefore = blocks.slice(0, i).filter((x) => x.type === "split").length;
        if (b.type === "heading") {
          return (
            <h2
              key={i}
              className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight border-b border-gray-200 dark:border-gray-800 pb-4"
            >
              {b.heading}
            </h2>
          );
        }
        if (b.type === "paragraph") {
          return (
            <p
              key={i}
              className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl whitespace-pre-line"
            >
              {b.text}
            </p>
          );
        }
        if (b.type === "bullets") {
          const items = (b.items || []).map((x) => String(x).trim()).filter(Boolean);
          if (!items.length) return null;
          return (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-900/40 dark:to-gray-950/60 p-6 sm:p-8 shadow-sm"
            >
              {b.title ? (
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-500 shrink-0" />
                  {b.title}
                </p>
              ) : null}
              <ul className="space-y-3">
                {items.map((line, j) => (
                  <li key={j} className="flex gap-3 text-gray-600 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" aria-hidden />
                    <span className="leading-relaxed text-base">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (b.type === "image" && b.imageUrl) {
          return (
            <figure
              key={i}
              className="not-prose overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 shadow-xl shadow-gray-900/5 dark:shadow-black/20"
            >
              <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full min-h-[180px] max-h-[min(50vh,420px)]">
                <img
                  src={b.imageUrl}
                  alt={b.imageAlt || "About page image"}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
              {b.imageAlt && (
                <figcaption className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200/80 dark:border-gray-800">
                  {b.imageAlt}
                </figcaption>
              )}
            </figure>
          );
        }
        if (b.type === "split" && b.imageUrl && b.text) {
          const reverse = splitBefore % 2 === 1;
          return (
            <div
              key={i}
              className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 md:items-center not-prose ${
                reverse ? "md:[direction:rtl]" : ""
              }`}
            >
              <div
                className={`overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg bg-gray-100 dark:bg-gray-900 ${
                  reverse ? "md:[direction:ltr]" : ""
                }`}
              >
                <div className="aspect-[4/3] w-full min-h-[200px] max-h-[340px]">
                  <img
                    src={b.imageUrl}
                    alt={b.imageAlt || ""}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
              <div className={reverse ? "md:[direction:ltr]" : ""}>
                {b.heading && (
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white mb-3">
                    {b.heading}
                  </h3>
                )}
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                  {b.text}
                </p>
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

export default function AboutPage() {
  const { t, i18n } = useTranslation();
  const { title, useBlocks, blocks, body, isLoading, isError, updatedAt } = usePublicAbout();
  const legacyParagraphs = !useBlocks && body ? splitBody(body) : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/40 via-white to-white dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          {t("aboutPage.backHome")}
        </Link>

        <header className="text-center sm:text-start mb-12 sm:mb-16 max-w-2xl sm:max-w-none">
          <div className="inline-flex items-center justify-center sm:justify-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-brand-500/20 dark:from-violet-500/20 dark:to-brand-500/10 flex items-center justify-center border border-violet-200/60 dark:border-violet-800/50">
              <GraduationCap className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {isLoading ? "…" : title || t("aboutPage.fallbackTitle")}
              </h1>
              {updatedAt && !isError ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
                  {t("aboutPage.lastUpdated", { date: new Date(updatedAt).toLocaleDateString(i18n.language) })}
                </p>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:ms-[4.5rem]">
            {t("aboutPage.subtitle")}
          </p>
        </header>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {isError ? (
          <p className="text-sm text-red-600 dark:text-red-400">{t("aboutPage.loadError")}</p>
        ) : isLoading ? (
          <div className="space-y-8 max-w-2xl animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3" />
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-4/5" />
          </div>
        ) : useBlocks && Array.isArray(blocks) && blocks.length > 0 ? (
          <AboutBlocksContent blocks={blocks} />
        ) : legacyParagraphs.length > 0 ? (
          <div className="prose prose-lg prose-gray dark:prose-invert max-w-3xl mx-auto">
            {legacyParagraphs.map((p, i) => (
              <p
                key={i}
                className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-6 last:mb-0"
              >
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("aboutPage.empty")}</p>
        )}
      </div>
    </div>
  );
}
