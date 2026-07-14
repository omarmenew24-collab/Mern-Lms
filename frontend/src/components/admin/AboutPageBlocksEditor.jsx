import { useRef } from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Heading,
  ImageIcon,
  List,
  Plus,
  Text,
  Trash2,
  Upload,
  LayoutGrid,
} from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getCloudinaryImageConfig, uploadImageToCloudinary } from "../../lib/cloudinaryClientUpload";

const TYPES = [
  { value: "heading", labelKey: "workspace.aboutEditor.typeHeading", icon: Heading },
  { value: "paragraph", labelKey: "workspace.aboutEditor.typeParagraph", icon: Text },
  { value: "bullets", labelKey: "workspace.aboutEditor.typeBullets", icon: List },
  { value: "image", labelKey: "workspace.aboutEditor.typeImage", icon: ImageIcon },
  { value: "split", labelKey: "workspace.aboutEditor.typeSplit", icon: LayoutGrid },
];

function emptyBlock(type) {
  if (type === "heading") return { type: "heading", heading: "" };
  if (type === "paragraph") return { type: "paragraph", text: "" };
  if (type === "bullets") return { type: "bullets", title: "", items: [""] };
  if (type === "split") return { type: "split", imageUrl: "", imageAlt: "", heading: "", text: "" };
  return { type: "image", imageUrl: "", imageAlt: "" };
}

/**
 * @param {{ value: object[], onChange: (b: object[]) => void, disabled?: boolean, defaultTemplate?: object[] }} props
 */
export default function AboutPageBlocksEditor({ value, onChange, disabled, defaultTemplate = [] }) {
  const { t: tr } = useTranslation();
  const uploadIdxRef = useRef(null);
  const uploadKindRef = useRef(null);
  const fileRef = useRef(null);

  const setBlock = (i, next) => {
    onChange(value.map((b, j) => (j === i ? next : b)));
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i) => {
    onChange(value.filter((_, j) => j !== i));
  };

  const add = (type) => {
    onChange([...value, emptyBlock(type)]);
  };

  const loadTemplate = () => {
    if (!defaultTemplate || !defaultTemplate.length) return;
    onChange(JSON.parse(JSON.stringify(defaultTemplate)));
    toast.success(tr("workspace.aboutEditor.exampleLoaded"));
  };

  const onPickFile = (blockIndex, kind) => {
    const { isConfigured } = getCloudinaryImageConfig();
    if (!isConfigured) {
      toast.error(tr("workspace.aboutEditor.presetMissing"));
      return;
    }
    uploadIdxRef.current = blockIndex;
    uploadKindRef.current = kind;
    fileRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const i = uploadIdxRef.current;
    const kind = uploadKindRef.current;
    if (!file || i == null || i < 0) return;
    if (!file.type.startsWith("image/")) {
      toast.error(tr("workspace.aboutEditor.chooseImage"));
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      toast.error(tr("workspace.aboutEditor.imageTooLarge"));
      return;
    }
    const block = value[i];
    if (!block || (block.type !== "image" && block.type !== "split")) return;
    try {
      const { secureUrl } = await uploadImageToCloudinary(file);
      if (block.type === "image") {
        setBlock(i, {
          ...block,
          imageUrl: secureUrl,
          imageAlt: block.imageAlt || file.name.replace(/\.[^.]+$/, ""),
        });
      } else {
        setBlock(i, {
          ...block,
          imageUrl: secureUrl,
          imageAlt: block.imageAlt || file.name.replace(/\.[^.]+$/, ""),
        });
      }
      toast.success(tr("workspace.aboutEditor.imageUploaded"));
    } catch (err) {
      toast.error(err?.message || tr("workspace.aboutEditor.uploadFailed"));
    } finally {
      uploadIdxRef.current = null;
    }
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {value.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-3 py-4 text-center">
          {tr("workspace.aboutEditor.emptyPrefix")}<strong>{tr("workspace.aboutEditor.typeSplit")}</strong>{tr("workspace.aboutEditor.emptyMid")}<strong>{tr("workspace.aboutEditor.typeImage")}</strong>{tr("workspace.aboutEditor.emptySuffix")}
        </p>
      ) : null}

      <ul className="space-y-3">
        {value.map((b, i) => (
          <li
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-950/40 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="pt-0.5 text-gray-400" title={tr("workspace.aboutEditor.block")}>
                <GripVertical className="w-4 h-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {b.type === "heading" && (
                  <>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tr("workspace.aboutEditor.typeHeading")}</label>
                    <input
                      type="text"
                      value={b.heading || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, heading: e.target.value.slice(0, 200) })}
                      className="w-full h-9 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      placeholder={tr("workspace.aboutEditor.sectionTitle")}
                    />
                  </>
                )}

                {b.type === "paragraph" && (
                  <>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tr("workspace.aboutEditor.textLabel")}</label>
                    <textarea
                      value={b.text || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, text: e.target.value.slice(0, 8000) })}
                      rows={4}
                      className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5"
                      placeholder={tr("workspace.aboutEditor.paragraphPh")}
                    />
                  </>
                )}

                {b.type === "bullets" && (
                  <>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tr("workspace.aboutEditor.listTitle")}</label>
                    <input
                      type="text"
                      value={b.title || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, title: e.target.value.slice(0, 200) })}
                      className="w-full h-8 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                    />
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tr("workspace.aboutEditor.points")}</label>
                    <textarea
                      value={Array.isArray(b.items) ? b.items.join("\n") : ""}
                      disabled={disabled}
                      onChange={(e) => {
                        const lines = e.target.value.split("\n").map((l) => l.slice(0, 500));
                        setBlock(i, { ...b, items: lines.length ? lines : [""] });
                      }}
                      rows={Math.min(12, Math.max(3, (b.items || []).length + 1))}
                      className="w-full text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5"
                    />
                  </>
                )}

                {b.type === "image" && (
                  <>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">{tr("workspace.aboutEditor.imageUrl")}</label>
                    <input
                      type="url"
                      value={b.imageUrl || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, imageUrl: e.target.value.slice(0, 2000) })}
                      className="w-full h-9 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      placeholder="https://"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onPickFile(i, "image")}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {tr("workspace.aboutEditor.upload")}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={b.imageAlt || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, imageAlt: e.target.value.slice(0, 200) })}
                      className="w-full h-8 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                      placeholder={tr("workspace.aboutEditor.imageAltAccessibility")}
                    />
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt={b.imageAlt || ""}
                        className="mt-1 max-h-28 rounded border border-gray-200 dark:border-gray-700 object-cover"
                      />
                    ) : null}
                  </>
                )}

                {b.type === "split" && (
                  <>
                    <p className="text-[10px] text-gray-500">{tr("workspace.aboutEditor.photoBeside")}</p>
                    <label className="text-[10px] font-semibold uppercase text-gray-500">{tr("workspace.aboutEditor.imageUrl")}</label>
                    <input
                      type="url"
                      value={b.imageUrl || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, imageUrl: e.target.value.slice(0, 2000) })}
                      className="w-full h-9 px-2 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onPickFile(i)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-violet-600 text-white"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {tr("workspace.aboutEditor.upload")}
                      </button>
                    </div>
                    <input
                      type="text"
                      value={b.imageAlt || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, imageAlt: e.target.value.slice(0, 200) })}
                      className="w-full h-8 px-2 text-sm rounded border"
                      placeholder={tr("workspace.aboutEditor.imageDescription")}
                    />
                    <label className="text-[10px] font-semibold uppercase text-gray-500">{tr("workspace.aboutEditor.sideHeading")}</label>
                    <input
                      type="text"
                      value={b.heading || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, heading: e.target.value.slice(0, 200) })}
                      className="w-full h-9 px-2 text-sm rounded border"
                    />
                    <label className="text-[10px] font-semibold uppercase text-gray-500">{tr("workspace.aboutEditor.bodyText")}</label>
                    <textarea
                      value={b.text || ""}
                      disabled={disabled}
                      onChange={(e) => setBlock(i, { ...b, text: e.target.value.slice(0, 8000) })}
                      rows={4}
                      className="w-full text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5"
                    />
                    {b.imageUrl ? (
                      <img
                        src={b.imageUrl}
                        alt={b.imageAlt || ""}
                        className="max-h-24 rounded border object-cover"
                      />
                    ) : null}
                  </>
                )}
              </div>

              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  disabled={disabled || i === 0}
                  onClick={() => move(i, -1)}
                  className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled || i === value.length - 1}
                  onClick={() => move(i, 1)}
                  className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-30"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="flex flex-wrap gap-1">
          {TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                type="button"
                disabled={disabled}
                onClick={() => add(type.value)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border border-gray-300 dark:border-gray-600"
              >
                <Icon className="w-3.5 h-3.5" />
                {tr(type.labelKey)}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          disabled={disabled || !defaultTemplate?.length}
          onClick={loadTemplate}
          className="inline-flex items-center gap-1 text-xs text-violet-600 font-medium hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          {tr("workspace.aboutEditor.loadExample")}
        </button>
      </div>
    </div>
  );
}
