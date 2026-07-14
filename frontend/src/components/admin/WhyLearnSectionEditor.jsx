import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { WHY_LEARN_COLOR_OPTIONS, WHY_LEARN_ICON_OPTIONS } from "../../lib/whyLearnUi";

const emptyCard = () => ({
  title: "",
  desc: "",
  icon: "sparkles",
  color: "brand",
});

/**
 * @param {object} props
 * @param {{ title: string, titleHighlight: string, subtitle: string, cards: object[] }} props.value
 * @param {(v: object) => void} props.onChange
 * @param {boolean} props.disabled
 * @param {object} props.defaultTemplate
 */
export default function WhyLearnSectionEditor({ value, onChange, disabled, defaultTemplate }) {
  const { t } = useTranslation();
  const title = value?.title ?? "";
  const titleHighlight = value?.titleHighlight ?? "";
  const subtitle = value?.subtitle ?? "";
  const cards = Array.isArray(value?.cards) ? value.cards : [];

  const setField = (patch) => onChange({ title, titleHighlight, subtitle, cards, ...patch });

  const updateCard = (index, patch) => {
    const next = cards.map((c, i) => (i === index ? { ...c, ...patch } : c));
    setField({ cards: next });
  };

  const move = (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= cards.length) return;
    const next = [...cards];
    [next[index], next[j]] = [next[j], next[index]];
    setField({ cards: next });
  };

  const remove = (index) => {
    setField({ cards: cards.filter((_, i) => i !== index) });
  };

  const add = () => {
    setField({ cards: [...cards, emptyCard()] });
  };

  const loadDefaults = () => {
    const d = defaultTemplate;
    if (!d) return;
    onChange({
      title: d.title ?? "",
      titleHighlight: d.titleHighlight ?? "",
      subtitle: d.subtitle ?? "",
      cards: Array.isArray(d.cards) ? d.cards.map((c) => ({ ...c })) : [],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("workspace.whyLearnEditor.headingBefore")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setField({ title: e.target.value.slice(0, 200) })}
            maxLength={200}
            disabled={disabled}
            placeholder={defaultTemplate?.title}
            className="mt-1 w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("workspace.whyLearnEditor.accent")}</label>
          <input
            type="text"
            value={titleHighlight}
            onChange={(e) => setField({ titleHighlight: e.target.value.slice(0, 120) })}
            maxLength={120}
            disabled={disabled}
            placeholder={defaultTemplate?.titleHighlight}
            className="mt-1 w-full h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("workspace.whyLearnEditor.subheading")}</label>
        <textarea
          value={subtitle}
          onChange={(e) => setField({ subtitle: e.target.value.slice(0, 500) })}
          rows={2}
          maxLength={500}
          disabled={disabled}
          placeholder={defaultTemplate?.subtitle}
          className="mt-1 w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
        />
        <p className="text-[10px] text-gray-400 text-end mt-0.5">{subtitle.length}/500</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t("workspace.whyLearnEditor.featureCards")}</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={disabled}
              onClick={add}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              {t("workspace.whyLearnEditor.addCard")}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={loadDefaults}
              className="text-[11px] font-medium text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50"
            >
              {t("workspace.whyLearnEditor.loadDefaults")}
            </button>
          </div>
        </div>
        {cards.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-3">
            {t("workspace.whyLearnEditor.noCards")}
          </p>
        ) : (
          <ul className="space-y-3">
            {cards.map((c, i) => (
              <li
                key={i}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{t("workspace.whyLearnEditor.card", { n: i + 1 })}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={disabled || i === 0}
                      onClick={() => move(i, -1)}
                      className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30"
                      aria-label={t("workspace.whyLearnEditor.moveUp")}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled || i === cards.length - 1}
                      onClick={() => move(i, 1)}
                      className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30"
                      aria-label={t("workspace.whyLearnEditor.moveDown")}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => remove(i)}
                      className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-950/50"
                      aria-label={t("workspace.whyLearnEditor.removeCard")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={c.title ?? ""}
                    onChange={(e) => updateCard(i, { title: e.target.value.slice(0, 200) })}
                    maxLength={200}
                    disabled={disabled}
                    placeholder={t("workspace.whyLearnEditor.cardTitle")}
                    className="h-9 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <select
                      value={c.icon || "sparkles"}
                      onChange={(e) => updateCard(i, { icon: e.target.value })}
                      disabled={disabled}
                      className="h-9 flex-1 min-w-0 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      {WHY_LEARN_ICON_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                    <select
                      value={c.color || "brand"}
                      onChange={(e) => updateCard(i, { color: e.target.value })}
                      disabled={disabled}
                      className="h-9 w-28 shrink-0 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    >
                      {WHY_LEARN_COLOR_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <textarea
                  value={c.desc ?? ""}
                  onChange={(e) => updateCard(i, { desc: e.target.value.slice(0, 2000) })}
                  rows={3}
                  maxLength={2000}
                  disabled={disabled}
                  placeholder={t("workspace.whyLearnEditor.description")}
                  className="mt-2 w-full text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
