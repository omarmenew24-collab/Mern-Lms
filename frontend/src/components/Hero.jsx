import { useNavigate } from "react-router-dom";
import { paths } from "../config/paths";
import { ArrowRight, BookOpen, PlayCircle } from "lucide-react";
import { usePublicSiteBranding } from "../api/admin";
import { useTranslation } from "react-i18next";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

const Check = () => (
  <svg className="w-4 h-4 text-brand-500 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branding } = usePublicSiteBranding();
  const b = branding || {};

  const badgeText = b.heroBadgeText || t("home.hero.badge");
  const title1 = b.heroTitleLine1 || t("home.hero.titleLine1");
  const titleHi = b.heroTitleHighlight || t("home.hero.titleHighlight");
  const subtitle =
    b.heroSubtitle ||
    t("home.hero.subtitle");
  const primaryCta = b.heroPrimaryCtaLabel || t("home.hero.primaryCta");
  const secondaryCta = b.heroSecondaryCtaLabel || t("home.hero.secondaryCta");
  const imgSrc = b.heroImageUrl || FALLBACK_IMAGE;
  const trust = [
    b.heroTrustLine1 || "Expert instructors",
    b.heroTrustLine2 || "Lifetime access",
    b.heroTrustLine3 || "Secure payments",
  ];
  const showUnsplashCredit = !b.heroImageUrl || imgSrc.includes("unsplash.com");

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 border-b border-gray-100 dark:border-gray-800">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent dark:from-brand-900/20" />
      <div
        className="pointer-events-none absolute -end-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-200/30 blur-3xl dark:bg-brand-800/20"
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-6 py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-14">
          <div className="max-w-2xl space-y-6 lg:max-w-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              {badgeText}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.15rem] xl:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
              {title1}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-purple-600 dark:from-brand-400 dark:to-purple-400">
                {titleHi}
              </span>
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">{subtitle}</p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(paths.signUp)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/25"
              >
                {primaryCta}
                <ArrowRight className="w-4 h-4 rtl-flip" />
              </button>
              <button
                type="button"
                onClick={() => {
                  document.getElementById("courses-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {secondaryCta}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-sm text-gray-500 dark:text-gray-400">
              {trust.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check />
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none lg:mx-0">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gray-200 dark:bg-gray-800 ring-1 ring-gray-200/80 shadow-2xl shadow-gray-900/10 dark:ring-white/10 dark:shadow-gray-950/50"
            >
              <img
                src={imgSrc}
                alt=""
                className="h-full w-full object-cover object-center"
                width={1200}
                height={900}
                fetchPriority="high"
                decoding="async"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-gray-900/25 via-transparent to-transparent"
                aria-hidden
              />
            </div>

            <div
              className="absolute -bottom-3 start-2 end-2 sm:bottom-4 sm:start-4 sm:end-auto sm:max-w-[18rem] rounded-xl border border-white/20 bg-white/95 p-3.5 shadow-lg backdrop-blur dark:border-white/10 dark:bg-gray-900/95"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                  <BookOpen className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-white">{t("home.hero.continueCourse")}</p>
                  <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{t("home.hero.continueMeta")}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                    <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-brand-500 to-purple-500" />
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-brand-600 dark:text-brand-400">
                    <PlayCircle className="h-3 w-3 shrink-0" aria-hidden />
                    <span>{t("home.hero.continueNext")}</span>
                  </div>
                </div>
              </div>
            </div>

            {showUnsplashCredit && (
              <a
                href="https://unsplash.com/photos/1523240795612-9a054b0db644"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="mt-3 block text-center text-[10px] text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 lg:text-start"
              >
                {t("home.hero.photoCredit")}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
