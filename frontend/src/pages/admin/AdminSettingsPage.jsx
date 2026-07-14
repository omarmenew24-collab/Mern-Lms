import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import CertificateBrandingEditor from "../../components/admin/CertificateBrandingEditor";

/**
 * Admin workspace: same account shell as the rest of the app, with admin section links (UI only).
 * Route is wrapped with RequireAdmin in App.jsx.
 */
export default function AdminSettingsPage() {
  const { t: tr } = useTranslation();
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
    const timer = setTimeout(() => {
      document.getElementById("in-app-announcements")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#public-about") {
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById("public-about")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#why-learn-home") {
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById("why-learn-home")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#site-branding") {
      return;
    }
    const timer = setTimeout(() => {
      document.getElementById("site-branding")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AccountSettingsLayout
      title={tr("workspace.adminSettings.title")}
      subtitle={tr("workspace.adminSettings.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <div className="space-y-6">
        <div
          className="flex gap-3 p-3.5 sm:p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/80 text-gray-800 dark:text-gray-200"
          role="status"
        >
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 dark:text-amber-400 mt-0.5" />
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            <span className="font-medium text-gray-900 dark:text-white">{tr("workspace.adminSettings.whatLabel")}</span>
            {tr("workspace.adminSettings.whatBody1")}
            <span className="font-medium">{tr("workspace.adminSettings.aboutBold")}</span>
            {tr("workspace.adminSettings.whatBody2")}
            <span className="font-medium">{tr("workspace.adminSettings.settingsBold")}</span>
            {tr("workspace.adminSettings.whatBody3")}
            <span className="font-medium">{tr("workspace.adminSettings.usersBold")}</span>
            {tr("workspace.adminSettings.whatAnd")}
            <span className="font-medium">{tr("workspace.adminSettings.coursesBold")}</span>
            {tr("workspace.adminSettings.whatEnd")}
          </p>
        </div>

        <SiteBrandingEditor />

        <CertificateBrandingEditor />

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <MessageCircleOff className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.commentsHeading")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tr("workspace.adminSettings.commentsDesc1")}
                <strong className="font-medium text-gray-700 dark:text-gray-300">{tr("workspace.adminSettings.commentsEvery")}</strong>
                {tr("workspace.adminSettings.commentsDesc2")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
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
                    {tr("workspace.adminSettings.commentsToggle")}
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.ratingsHeading")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tr("workspace.adminSettings.ratingsDesc")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
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
                  <span>{tr("workspace.adminSettings.ratingsToggle")}</span>
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.categoriesHeading")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tr("workspace.adminSettings.categoriesDesc1")}<span className="font-medium">{tr("workspace.adminSettings.otherBold")}</span>{tr("workspace.adminSettings.categoriesDesc2")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
              ) : (
                <>
                  {platformList.length === 0 ? (
                    <p className="text-xs text-gray-500">{tr("workspace.adminSettings.noCategories")}</p>
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
                            aria-label={tr("workspace.adminSettings.removeName", { name })}
                            title={tr("workspace.adminSettings.removeSuggestion")}
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
                      placeholder={tr("workspace.adminSettings.addCategoryPlaceholder")}
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
                      {tr("workspace.adminSettings.add")}
                    </button>
                  </div>
                  {platformList.length > 0 ? (
                    <p className="text-[10px] text-gray-500">
                      {tr("workspace.adminSettings.suggestionsCount", { n: platformList.length })}
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
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.aboutHeading")}</h2>
                <Link
                  to={paths.about}
                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  {tr("workspace.adminSettings.openPage")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>{tr("workspace.adminSettings.adminOnly")}</strong>{tr("workspace.adminSettings.aboutDesc1")}
                <span className="font-mono text-gray-600 dark:text-gray-300">/about</span>{tr("workspace.adminSettings.aboutDesc2")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("workspace.adminSettings.pageTitle")}</label>
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
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{tr("workspace.adminSettings.pageSections")}</label>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
                      {tr("workspace.adminSettings.pageSectionsDesc")}
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
                      {tr("workspace.adminSettings.plainFallback")}
                    </summary>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 mb-2">
                      {tr("workspace.adminSettings.plainFallbackDesc")}
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
                      {tr("workspace.adminSettings.saveAbout")}
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
                      {tr("workspace.adminSettings.resetDefault")}
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
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.whyLearnHeading")}</h2>
                <Link
                  to={paths.home}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {tr("workspace.adminSettings.openHome")}
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                <strong>{tr("workspace.adminSettings.adminOnly")}</strong>{tr("workspace.adminSettings.whyLearnDesc")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
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
                      {tr("workspace.adminSettings.saveWhyLearn")}
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
                      {tr("workspace.adminSettings.resetDefault")}
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.homeAnnHeading")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tr("workspace.adminSettings.homeAnnDesc")}
              </p>
              {isSiteLoading ? (
                <p className="text-xs text-gray-400">{tr("workspace.adminSettings.loading")}</p>
              ) : (
                <>
                  <textarea
                    value={homeText}
                    onChange={(e) => setHomeText(e.target.value.slice(0, 400))}
                    rows={3}
                    maxLength={400}
                    disabled={isSiteSaving}
                    placeholder={tr("workspace.adminSettings.homeAnnPlaceholder")}
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
                      {tr("workspace.adminSettings.save")}
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
                      {tr("workspace.adminSettings.clear")}
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
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("workspace.adminSettings.inAppHeading")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 pb-2">
                {tr("workspace.adminSettings.inAppDesc")}
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
