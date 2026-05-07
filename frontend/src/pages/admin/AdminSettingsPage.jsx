import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Megaphone,
  MessageCircleOff,
  StarOff,
  Layers,
  X,
  GraduationCap,
  ExternalLink,
  LayoutGrid,
} from "lucide-react";
import useUserStore from "../../store/userstore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import ProfileSettingsForm from "../../components/profile/ProfileSettingsForm";
import SendAnnouncementForm from "../../components/SendAnnouncementForm";
import { getAccountNavItems } from "../../config/accountNav";
import { useGetSiteSettings, usePatchSiteSettings } from "../../api/admin";
import { paths } from "../../config/paths";
import AboutPageBlocksEditor from "../../components/admin/AboutPageBlocksEditor";
import WhyLearnSectionEditor from "../../components/admin/WhyLearnSectionEditor";
import SiteBrandingEditor from "../../components/admin/SiteBrandingEditor";

/**
 * Admin workspace: same account shell as the rest of the app, with admin section links (UI only).
 * Route is wrapped with RequireAdmin in App.jsx.
 */
export default function AdminSettingsPage() {
  const user = useUserStore((s) => s.user);
  const { siteSettings, isLoading: isSiteLoading } = useGetSiteSettings();
  const { patchSiteSettings, isPending: isSiteSaving } = usePatchSiteSettings();
  const [homeText, setHomeText] = useState("");
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutBody, setAboutBody] = useState("");
  const [aboutBlocks, setAboutBlocks] = useState([]);
  const [whyLearnDraft, setWhyLearnDraft] = useState({
    title: "",
    titleHighlight: "",
    subtitle: "",
    cards: [],
  });
  const [platformDraft, setPlatformDraft] = useState("");

  useEffect(() => {
    if (typeof siteSettings?.homeAnnouncement === "string") {
      setHomeText(siteSettings.homeAnnouncement);
    }
  }, [siteSettings?.homeAnnouncement]);

  useEffect(() => {
    if (siteSettings && typeof siteSettings.aboutPageTitle === "string") {
      setAboutTitle(siteSettings.aboutPageTitle);
    }
    if (siteSettings && typeof siteSettings.aboutPageBody === "string") {
      setAboutBody(siteSettings.aboutPageBody);
    }
    if (siteSettings && Array.isArray(siteSettings.aboutPageBlocks)) {
      setAboutBlocks(siteSettings.aboutPageBlocks);
    }
  }, [siteSettings?.aboutPageTitle, siteSettings?.aboutPageBody, siteSettings?.aboutPageBlocks]);

  useEffect(() => {
    if (!siteSettings) return;
    setWhyLearnDraft({
      title: typeof siteSettings.whyLearnTitle === "string" ? siteSettings.whyLearnTitle : "",
      titleHighlight:
        typeof siteSettings.whyLearnTitleHighlight === "string" ? siteSettings.whyLearnTitleHighlight : "",
      subtitle: typeof siteSettings.whyLearnSubtitle === "string" ? siteSettings.whyLearnSubtitle : "",
      cards: Array.isArray(siteSettings.whyLearnCards) ? siteSettings.whyLearnCards : [],
    });
  }, [
    siteSettings?.whyLearnTitle,
    siteSettings?.whyLearnTitleHighlight,
    siteSettings?.whyLearnSubtitle,
    siteSettings?.whyLearnCards,
  ]);

  const defTitle = siteSettings?.defaultAboutPageTitle ?? "About";
  const defBody = siteSettings?.defaultAboutPageBody ?? "";
  const defBlocks = siteSettings?.defaultAboutPageBlocks ?? [];
  const defWhyLearn = siteSettings?.defaultWhyLearn ?? null;

  const platformList = siteSettings?.platformCourseCategories || [];

  const addPlatformCategory = async () => {
    const s = platformDraft.trim().slice(0, 80);
    if (!s) return;
    if (platformList.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    if (platformList.length >= 100) return;
    try {
      await patchSiteSettings({
        platformCourseCategories: [...platformList, s],
      });
      setPlatformDraft("");
    } catch {
      /* hook */
    }
  };

  const removePlatformCategory = async (name) => {
    try {
      await patchSiteSettings({
        platformCourseCategories: platformList.filter((n) => n !== name),
      });
    } catch {
      /* hook */
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#in-app-announcements") {
      return;
    }
    const t = setTimeout(() => {
      document.getElementById("in-app-announcements")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#public-about") {
      return;
    }
    const t = setTimeout(() => {
      document.getElementById("public-about")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#why-learn-home") {
      return;
    }
    const t = setTimeout(() => {
      document.getElementById("why-learn-home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#site-branding") {
      return;
    }
    const t = setTimeout(() => {
      document.getElementById("site-branding")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <AccountSettingsLayout
      title="Admin workspace"
      subtitle="Site name & hero, About page, home Why learn, categories, home banner, notifications, comments, and ratings."
      navItems={getAccountNavItems(user)}
    >
      <div className="space-y-6">
        <div
          className="flex gap-3 p-3.5 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-gray-800 dark:text-gray-200"
          role="status"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-white">What this page does: </span>
            Your name and photo, the public             <span className="font-medium">About</span> page, the home &quot;Why learn&quot; section, the global course
            category list, public home banner, in-app notifications, and comments. Per-course options: each course&apos;s{" "}
            <span className="font-medium">Settings</span> tab. User and sales: <span className="font-medium">Users</span> and{" "}
            <span className="font-medium">Courses</span>.
          </p>
        </div>

        <SiteBrandingEditor />

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <MessageCircleOff className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">All courses — comment posting</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When enabled, new posts and replies are limited to course instructors and admins on
                <strong className="font-medium text-gray-700 dark:text-gray-300"> every </strong>
                course. Individual courses can still be tightened further in each course&apos;s admin settings.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <label className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-gray-300"
                    checked={Boolean(siteSettings?.commentsGloballyDisabled)}
                    disabled={isSiteSaving}
                    onChange={async (e) => {
                      const next = e.target.checked;
                      try {
                        await patchSiteSettings({ commentsGloballyDisabled: next });
                      } catch {
                        /* toast in hook */
                      }
                    }}
                  />
                  <span>
                    Block comment posting site-wide (instructors and admins can still post and reply)
                  </span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
              <StarOff className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">All courses — ratings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                When enabled, learners cannot submit or update star ratings on any course.
                Per-course overrides are available in each course&apos;s admin settings.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <label className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-gray-300"
                    checked={Boolean(siteSettings?.ratingsGloballyDisabled)}
                    disabled={isSiteSaving}
                    onChange={async (e) => {
                      const next = e.target.checked;
                      try {
                        await patchSiteSettings({ ratingsGloballyDisabled: next });
                      } catch {
                        /* toast in hook */
                      }
                    }}
                  />
                  <span>Block course ratings site-wide</span>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Default course categories</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                New installs start with a built-in list. Only you (admin) can add or remove names here. Teachers and
                other admins use this list when they create a course, or they can pick <span className="font-medium">Other</span> and
                type anything. This does not rename existing courses.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <>
                  {platformList.length === 0 ? (
                    <p className="text-xs text-gray-500">No global categories yet. Add the names you want everyone to see when they create a course.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-1.5">
                      {platformList.map((name) => (
                        <li
                          key={name}
                          className="inline-flex items-center gap-0.5 ps-2.5 pe-0.5 py-0.5 rounded-md text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800"
                        >
                          {name}
                          <button
                            type="button"
                            disabled={isSiteSaving}
                            onClick={() => removePlatformCategory(name)}
                            className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-sky-800 dark:text-sky-200 disabled:opacity-40"
                            aria-label={`Remove ${name}`}
                            title="Remove this suggestion"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={platformDraft}
                      onChange={(e) => setPlatformDraft(e.target.value.slice(0, 80))}
                      disabled={isSiteSaving}
                      maxLength={80}
                      placeholder="Add a new category for everyone"
                      className="min-w-[12rem] flex-1 h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPlatformCategory();
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isSiteSaving || !platformDraft.trim() || platformList.length >= 100}
                      onClick={addPlatformCategory}
                      className="h-9 px-3 rounded-lg text-xs font-bold bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  {platformList.length > 0 ? (
                    <p className="text-[10px] text-gray-500">
                      {platformList.length}/100 suggestions
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <div
          id="public-about"
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-24"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Public About page</h2>
                <Link
                  to={paths.about}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Open page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Admin only</strong> — only admins can change this (this screen is protected). Public URL:{" "}
                <span className="font-mono text-gray-600 dark:text-gray-300">/about</span>. Build the page with sections,
                full-width images, and image+text columns. If you don&apos;t add any sections, the optional plain text below
                or the platform default (rich layout) is used.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Page title</label>
                    <input
                      type="text"
                      value={aboutTitle}
                      onChange={(e) => setAboutTitle(e.target.value.slice(0, 200))}
                      maxLength={200}
                      disabled={isSiteSaving}
                      placeholder={defTitle}
                      className="mt-1 w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                    <p className="text-[10px] text-gray-400 text-end mt-0.5">{aboutTitle.length}/200</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Page sections (recommended)</label>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
                      Headings, paragraphs, bullet cards, full-width images, and side-by-side image+text. Reorder with arrows.
                    </p>
                    <AboutPageBlocksEditor
                      value={aboutBlocks}
                      onChange={setAboutBlocks}
                      disabled={isSiteSaving}
                      defaultTemplate={defBlocks}
                    />
                  </div>
                  <details className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 p-3">
                    <summary className="text-xs font-semibold text-gray-700 dark:text-gray-200 cursor-pointer">
                      Plain text fallback (only if sections are empty)
                    </summary>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-2">
                      Ignored while you have one or more sections saved above. Blank lines = new paragraphs.
                    </p>
                    <textarea
                      value={aboutBody}
                      onChange={(e) => setAboutBody(e.target.value.slice(0, 20_000))}
                      rows={6}
                      maxLength={20_000}
                      disabled={isSiteSaving}
                      className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                    />
                    <p className="text-[10px] text-gray-400 text-end mt-0.5">{aboutBody.length}/20,000</p>
                  </details>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        try {
                          await patchSiteSettings({
                            aboutPageTitle: aboutTitle.trim(),
                            aboutPageBody: aboutBody,
                            aboutPageBlocks: aboutBlocks,
                          });
                        } catch {
                          /* hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      Save About page
                    </button>
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        setAboutTitle("");
                        setAboutBody("");
                        setAboutBlocks([]);
                        try {
                          await patchSiteSettings({
                            aboutPageTitle: "",
                            aboutPageBody: "",
                            aboutPageBlocks: [],
                          });
                        } catch {
                          /* hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      Reset to platform default
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          id="why-learn-home"
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-24"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Home — Why learn</h2>
                <Link
                  to={paths.home}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Open home
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>Admin only</strong> — the three feature cards and headings under the fold on the public home page.
                Leave fields empty and clear all cards to use the platform default copy. Add or remove cards, reorder, and
                pick icon and color for each.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <>
                  <WhyLearnSectionEditor
                    value={whyLearnDraft}
                    onChange={setWhyLearnDraft}
                    disabled={isSiteSaving}
                    defaultTemplate={defWhyLearn}
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        try {
                          await patchSiteSettings({
                            whyLearnTitle: whyLearnDraft.title.trim(),
                            whyLearnTitleHighlight: whyLearnDraft.titleHighlight.trim(),
                            whyLearnSubtitle: whyLearnDraft.subtitle.trim(),
                            whyLearnCards: whyLearnDraft.cards,
                          });
                        } catch {
                          /* hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      Save Why learn section
                    </button>
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        setWhyLearnDraft({
                          title: "",
                          titleHighlight: "",
                          subtitle: "",
                          cards: [],
                        });
                        try {
                          await patchSiteSettings({
                            whyLearnTitle: "",
                            whyLearnTitleHighlight: "",
                            whyLearnSubtitle: "",
                            whyLearnCards: [],
                          });
                        } catch {
                          /* hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      Reset to platform default
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Home page announcement</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optional message at the top of the public home page for every visitor. They can close it; it reappears if you change the text.
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">Loading…</p>
              ) : (
                <>
                  <textarea
                    value={homeText}
                    onChange={(e) => setHomeText(e.target.value.slice(0, 400))}
                    rows={3}
                    maxLength={400}
                    disabled={isSiteSaving}
                    placeholder="e.g. New term starts next Monday"
                    className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                  />
                  <p className="text-[10px] text-gray-400 text-end">{homeText.length}/400</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        try {
                          await patchSiteSettings({ homeAnnouncement: homeText.trim() });
                        } catch {
                          /* toast in hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isSiteSaving}
                      onClick={async () => {
                        setHomeText("");
                        try {
                          await patchSiteSettings({ homeAnnouncement: "" });
                        } catch {
                          /* toast in hook */
                        }
                      }}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div
          id="in-app-announcements"
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-24"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">In-app notifications to users</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 pb-2">
                Logged-in users get these in their notification list (not the public home banner).
              </p>
              <SendAnnouncementForm />
            </div>
          </div>
        </div>

        <ProfileSettingsForm />
      </div>
    </AccountSettingsLayout>
  );
}
