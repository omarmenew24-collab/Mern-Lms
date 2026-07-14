import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Video,
  Trash2,
  ChevronDown,
  Play,
  PlayCircle,
  Square,
  CheckSquare,
  Clock,
  Layers,
  GripVertical,
  Pencil,
  Settings2,
  Check,
  CheckCircle2,
  X as XIcon,
  FileText,
  Link2,
  Type,
  Paperclip,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { paths } from "../../config/paths";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  LectureAnalyticsStrip,
  formatDetailedDuration,
  CurriculumStatsHeader,
  CurriculumTrailingColumn,
  SectionAnalyticsRail,
} from "../course/workspace/CurriculumAnalyticsMetrics";

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function groupLecturesByLevel(lectures = [], t) {
  const grouped = (lectures || []).reduce((groups, lecture) => {
    const levelNum = lecture.level?.number ?? 1;
    if (!groups[levelNum]) {
      groups[levelNum] = {
        title:
          lecture.level?.title ||
          (t ? t("workspace.lecturePanel.level", { number: levelNum }) : `Level ${levelNum}`),
        lectures: [],
      };
    }
    groups[levelNum].lectures.push(lecture);
    return groups;
  }, {});
  return Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));
}

function sortedUniqueLevelNums(lectures = []) {
  const nums = [...new Set((lectures || []).map((l) => l.level?.number ?? 1))];
  nums.sort((a, b) => a - b);
  return nums;
}

function ContentTypeIcon({ contentType, className }) {
  switch (contentType) {
    case "file":
      return <FileText className={className} />;
    case "link":
      return <Link2 className={className} />;
    case "text":
      return <Type className={className} />;
    default:
      return <Play className={className} />;
  }
}

// ---------------------------------------------------------------------------
// SortableLectureRow
// ---------------------------------------------------------------------------
function SortableLectureRow({
  lecture,
  canDelete,
  canReorder,
  isCompleted,
  onDeleteLecture,
  onSelectLecture,
  selectedLectureId,
  onEditLecture,
  onRename,
  onInstructorPreview,
  showAcknowledge,
  acknowledgedLectureIds,
  onAcknowledgeLecture,
  dense = false,
  lectureAnalytics,
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lecture._id, disabled: !canReorder });

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(lecture.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const startRename = useCallback(
    (e) => {
      e?.stopPropagation();
      setRenameValue(lecture.title);
      setIsRenaming(true);
    },
    [lecture.title],
  );

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    setIsRenaming(false);
    if (trimmed && trimmed !== lecture.title) {
      onRename?.(lecture._id, trimmed);
    }
  }, [renameValue, lecture.title, lecture._id, onRename]);

  const cancelRename = useCallback(() => {
    setRenameValue(lecture.title);
    setIsRenaming(false);
  }, [lecture.title]);

  const isSelected = selectedLectureId === lecture._id;

  const isAcknowledged =
    acknowledgedLectureIds?.has?.(String(lecture._id)) ||
    acknowledgedLectureIds?.has?.(lecture._id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const rowActions = isRenaming ? (
    <>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          commitRename();
        }}
        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
        title={t("workspace.lecturesSection.saveRename")}
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          cancelRename();
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={t("workspace.lecturesSection.cancelEsc")}
      >
        <XIcon className="w-3.5 h-3.5" />
      </button>
    </>
  ) : (
    <>
      {lecture.contentType === "video" && onInstructorPreview && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInstructorPreview(lecture);
          }}
          className="p-1.5 rounded-lg text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
          title={t("workspace.lecturesSection.previewVideo")}
        >
          <PlayCircle className="w-3.5 h-3.5" />
        </button>
      )}
      {lecture.duration && !lectureAnalytics && !dense ? (
        <span className="me-1 text-[0.8125rem] font-semibold tabular-nums text-gray-500 dark:text-gray-400">
          {formatDuration(lecture.duration)}
        </span>
      ) : null}
      {onRename && (
        <button
          type="button"
          onClick={startRename}
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors opacity-0 group-hover:opacity-100"
          title={t("workspace.lecturesSection.rename")}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {onEditLecture && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditLecture(lecture);
          }}
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors opacity-0 group-hover:opacity-100"
          title={t("workspace.lecturesSection.editLecture")}
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteLecture?.(lecture._id);
          }}
          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
          title={t("workspace.lecturesSection.deleteLecture")}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </>
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 transition-colors transition-shadow ${
        dense ? "px-3 py-2.5" : "px-4 py-3"
      } ${
        isDragging
          ? "opacity-40"
          : isSelected
            ? "bg-brand-50 ring-2 ring-inset ring-brand-500/90 shadow-sm dark:bg-brand-950/40 dark:ring-brand-400/85"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
      }`}
    >
      {showAcknowledge && onAcknowledgeLecture ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAcknowledgeLecture(lecture._id, !isAcknowledged);
          }}
          className={`flex-shrink-0 p-1 rounded-md border transition-colors ${
            isAcknowledged
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
              : "border-gray-200 dark:border-gray-600 text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
          title={
            isAcknowledged
              ? t("workspace.lecturesSection.reviewedUndo")
              : t("workspace.lecturesSection.markReviewed")
          }
          aria-pressed={isAcknowledged}
        >
          {isAcknowledged ? (
            <CheckSquare className="w-4 h-4" strokeWidth={2.25} />
          ) : (
            <Square className="w-4 h-4" strokeWidth={2.25} />
          )}
        </button>
      ) : null}
      {/* Drag handle — always rendered for instructors so they discover it */}
      {canReorder && (
        <span
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ms-1 rounded text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 touch-none select-none transition-colors"
          aria-label={t("workspace.lecturesSection.dragToReorder")}
        >
          <GripVertical className="w-4 h-4" />
        </span>
      )}

      {/* Clickable content area (selects lecture for player) */}
      <button
        type="button"
        className={`flex min-w-0 flex-1 items-center gap-2.5 text-start ${isRenaming ? "pointer-events-none" : ""}`}
        onClick={() => !isRenaming && onSelectLecture?.(lecture)}
        tabIndex={isRenaming ? -1 : 0}
      >
        <ContentTypeIcon
          contentType={lecture.contentType}
          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${
            isSelected
              ? "text-brand-600 dark:text-brand-400"
              : "text-gray-300 dark:text-gray-500 group-hover:text-brand-400"
          }`}
        />
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              ref={inputRef}
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") cancelRename();
              }}
              onBlur={commitRename}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-md border-b border-brand-400 bg-transparent pb-0.5 text-[0.92rem] font-semibold text-gray-800 outline-none dark:border-brand-500 dark:text-white placeholder:text-gray-400"
              aria-label={t("workspace.lecturesSection.renameLecture")}
            />
          ) : (
            <>
              <div
                className="flex items-center gap-1.5 min-w-0"
                onDoubleClick={onRename ? startRename : undefined}
                title={onRename ? t("workspace.lecturesSection.doubleClickRename") : undefined}
              >
                <span
                  className={`truncate ${
                    isSelected
                      ? "text-[1.065rem] font-bold text-brand-900 dark:text-brand-100"
                      : "text-[0.955rem] font-semibold leading-snug text-gray-800 dark:text-gray-100 sm:text-[0.9825rem]"
                  }`}
                >
                  {lecture.title}
                </span>
                {lecture.attachments?.length > 0 && (
                  <Paperclip className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" title={t("workspace.lecturesSection.attachments", { count: lecture.attachments.length })} />
                )}
                {lecture.isFreePreview && (
                  <span className="shrink-0 rounded bg-violet-100 dark:bg-violet-900/45 text-violet-800 dark:text-violet-200 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5">
                    {t("workspace.lecturesSection.free")}
                  </span>
                )}
                                {isCompleted && (
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-900/45 text-emerald-700 dark:text-emerald-200 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    {t("workspace.lecturesSection.done")}
                                  </span>
                                )}
              </div>
              {lecture.duration && (lectureAnalytics || dense) ? (
                <p className="mt-0.5 text-[11px] font-medium tabular-nums text-gray-400 dark:text-gray-500">
                  {formatDetailedDuration(lecture.duration)}
                </p>
              ) : null}
            </>
          )}
        </div>
      </button>

      {lectureAnalytics ? (
        <LectureAnalyticsStrip stats={lectureAnalytics} dense={dense} />
      ) : null}

      {lectureAnalytics ? (
        <CurriculumTrailingColumn dense={dense}>{rowActions}</CurriculumTrailingColumn>
      ) : (
        <div className="flex shrink-0 items-center gap-0.5">{rowActions}</div>
      )}
    </li>
  );
}

// ---------------------------------------------------------------------------
// AddLectureToLevelButton — inline shortcut to add lecture in a specific level
// ---------------------------------------------------------------------------
function AddLectureToLevelButton({ courseId, levelNum, levelTitle, lectureCount }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() =>
        navigate(paths.courseNewLecture(courseId), {
          state: { prefillLevel: levelNum, prefillLevelTitle: levelTitle, prefillOrder: lectureCount },
        })
      }
      className="flex w-full items-center justify-center gap-2 border-t border-dashed border-gray-200 px-4 py-2.5 text-[0.8125rem] font-bold text-gray-500 transition-colors hover:bg-brand-50/60 hover:text-brand-700 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-brand-950/35 dark:hover:text-brand-300"
    >
      <Plus className="h-3.5 w-3.5" />
      {t("workspace.quickActions.addLecture")}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section header ⋯ — rename · add lecture · edit first · delete section
// ---------------------------------------------------------------------------
function LevelSectionMenu({
  courseId,
  levelNum,
  levelTitle,
  lectureCount,
  firstLecture,
  onRenameRequested,
  onEditFirstLecture,
  onDeleteSection,
  onRenameLevel,
  onDeleteLevelSection,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!courseId) return null;

  const showRename = typeof onRenameLevel === "function";
  const showDelete = typeof onDeleteLevelSection === "function";
  const showEditFirst = typeof onEditFirstLecture === "function" && !!firstLecture;

  const addToLevel = () => {
    setOpen(false);
    navigate(paths.courseNewLecture(courseId), {
      state: {
        prefillLevel: levelNum,
        prefillLevelTitle: levelTitle,
        prefillOrder: lectureCount,
      },
    });
  };

  return (
    <div
      ref={wrapRef}
      className="relative flex shrink-0 flex-col justify-center self-stretch border-s border-gray-200/70 ps-2 dark:border-gray-700/70"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-lg p-2 text-gray-400 transition-all hover:bg-gray-200/75 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-gray-600/65 dark:hover:text-gray-50 sm:opacity-0 sm:transition-opacity group-hover/levelhdr:sm:opacity-100"
        title={t("workspace.lecturesSection.sectionActions")}
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden />
      </button>
      {open ? (
        <div
          className="absolute end-0 top-full z-50 mt-1.5 min-w-[12.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-[13px] font-semibold shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
          role="menu"
        >
          {showRename ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
              onClick={() => {
                setOpen(false);
                onRenameRequested?.();
              }}
            >
              <Pencil className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {t("workspace.lecturesSection.renameSection")}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
            onClick={addToLevel}
          >
            <Plus className="h-3.5 w-3.5 shrink-0 opacity-70" />
            {t("workspace.lecturesSection.addLectureHere")}
          </button>
          {showEditFirst ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
              onClick={() => {
                setOpen(false);
                onEditFirstLecture?.(firstLecture);
              }}
            >
              <Settings2 className="h-3.5 w-3.5 shrink-0 opacity-70" />
              {t("workspace.lecturesSection.editInEditor")}
            </button>
          ) : null}
          {showDelete ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2.5 text-start text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/35"
              onClick={() => {
                setOpen(false);
                onDeleteSection?.();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0 opacity-80" />
              {t("workspace.lecturesSection.deleteSection")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// LevelGroup — one accordion section with its own DnD context
// ---------------------------------------------------------------------------
function LevelGroup({
  levelNum,
  levelData,
  isOpen,
  onToggle,
  canDelete,
  canReorder,
  onDeleteLecture,
  onSelectLecture,
  selectedLectureId,
  completedLectureIds,
  onEditLecture,
  onRename,
  onReorderInLevel,
  sensors,
  courseId,
  onInstructorPreview,
  showAcknowledge,
  acknowledgedLectureIds,
  onAcknowledgeLecture,
  dense = false,
  onRenameLevel,
  onDeleteLevelSection,
  levelAnalytics,
  lectureAnalyticsById,
}) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState(null);
  const [renamingSection, setRenamingSection] = useState(false);
  const [renameSectionDraft, setRenameSectionDraft] = useState("");

  const activeLecture = useMemo(
    () => levelData.lectures.find((l) => l._id === activeId) || null,
    [activeId, levelData.lectures],
  );

  const sortedLectures = useMemo(
    () => [...levelData.lectures].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [levelData.lectures],
  );

  const sortedIds = useMemo(() => sortedLectures.map((l) => l._id), [sortedLectures]);

  const firstLectureInSection = sortedLectures[0] ?? null;

  const sectionDuration = useMemo(
    () => levelData.lectures.reduce((s, l) => s + (l.duration || 0), 0),
    [levelData.lectures],
  );

  const handleDragStart = useCallback(({ active }) => {
    setActiveId(active.id);
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = sortedLectures.findIndex((l) => l._id === active.id);
      const newIndex = sortedLectures.findIndex((l) => l._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(sortedLectures, oldIndex, newIndex);
      const withNewOrders = reordered.map((l, i) => ({ ...l, order: i }));
      onReorderInLevel?.(levelNum, withNewOrders);
    },
    [sortedLectures, levelNum, onReorderInLevel],
  );

  const handleDragCancel = useCallback(() => setActiveId(null), []);

  const requestRenameSection = useCallback(() => {
    setRenameSectionDraft(levelData.title);
    setRenamingSection(true);
  }, [levelData.title]);

  const commitRenameSection = useCallback(async () => {
    const trimmed = renameSectionDraft.trim();
    setRenamingSection(false);
    if (!trimmed || trimmed === levelData.title) return;
    await onRenameLevel?.(levelNum, trimmed);
  }, [renameSectionDraft, levelData.title, levelNum, onRenameLevel]);

  const cancelRenameSection = useCallback(() => {
    setRenamingSection(false);
    setRenameSectionDraft(levelData.title);
  }, [levelData.title]);

  const handleDeleteSection = useCallback(() => {
    onDeleteLevelSection?.(sortedIds);
  }, [onDeleteLevelSection, sortedIds]);

  const headerPad = dense ? "px-4 py-2.5" : "px-5 py-3.5";
  const showSectionMenu = Boolean(canDelete && courseId);

  return (
    <div className="relative border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <div className="relative">
        {renamingSection ? (
          <div
            className={`flex items-center gap-2 bg-gray-50 dark:bg-gray-800/90 ${headerPad}`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <ChevronDown
              className={`h-5 w-5 shrink-0 text-gray-300 dark:text-gray-600 ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden
            />
            <input
              value={renameSectionDraft}
              onChange={(e) => setRenameSectionDraft(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-[0.925rem] font-bold text-gray-900 shadow-sm outline-none ring-brand-400/35 focus:border-brand-400 focus:ring-2 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              aria-label={t("workspace.lecturesSection.sectionName")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRenameSection();
                }
                if (e.key === "Escape") {
                  cancelRenameSection();
                }
              }}
            />
      <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title={t("workspace.lecturesSection.save")}
              onClick={commitRenameSection}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={t("workspace.lecturesSection.cancel")}
              onClick={cancelRenameSection}
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className={`group/levelhdr relative flex w-full items-center bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/60 ${headerPad} min-h-[3.25rem]`}>
            <button
              type="button"
        onClick={onToggle}
              className="flex min-w-0 flex-1 items-center gap-3 text-start transition-colors"
      >
          <ChevronDown
                  className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <div className="min-w-0">
                  <span
                    className={`block truncate font-bold tracking-tight text-gray-900 dark:text-white ${
                      dense ? "text-[15px] leading-snug" : "text-[16px] leading-snug"
                    }`}
                  >
              {levelData.title}
            </span>
                  <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                    {t("workspace.lecturePanel.level", { number: levelNum })}
                    {dense && !levelAnalytics
                      ? ` · ${t("workspace.curriculum.lectureCount", { count: levelData.lectures.length })}${
                          sectionDuration > 0 ? ` · ${formatDuration(sectionDuration)}` : ""
                        }`
                      : ""}
                  </span>
          </div>
      </button>
            {levelAnalytics ? (
              <SectionAnalyticsRail
                percent={levelAnalytics.completionPercent}
                lectureCount={levelData.lectures.length}
                durationLabel={sectionDuration > 0 ? formatDuration(sectionDuration) : ""}
                canReorder={canReorder}
                dense={dense}
              />
            ) : (
              <span className="flex shrink-0 items-center gap-2 text-[13px] font-semibold text-gray-500 dark:text-gray-400">
                {canReorder ? (
                  <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-600 sm:inline">
                    {t("workspace.curriculum.dragReorder")}
                  </span>
                ) : null}
                {!dense ? (
                  <span className="tabular-nums whitespace-nowrap">
                    {t("workspace.curriculum.lectureCount", { count: levelData.lectures.length })}
                    {sectionDuration > 0 ? ` · ${formatDuration(sectionDuration)}` : ""}
                  </span>
                ) : null}
              </span>
            )}
            {showSectionMenu ? (
              <CurriculumTrailingColumn dense={Boolean(levelAnalytics && dense)}>
                <LevelSectionMenu
                courseId={courseId}
                levelNum={levelNum}
                levelTitle={levelData.title}
                lectureCount={levelData.lectures.length}
                firstLecture={firstLectureInSection}
                onRenameRequested={requestRenameSection}
                onEditFirstLecture={onEditLecture}
                onDeleteSection={handleDeleteSection}
                onRenameLevel={onRenameLevel}
                onDeleteLevelSection={onDeleteLevelSection}
              />
              </CurriculumTrailingColumn>
            ) : levelAnalytics ? (
              <CurriculumTrailingColumn dense={dense} />
            ) : null}
          </div>
        )}
      </div>

      {/* Lecture list */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
            <ul className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {sortedLectures.map((lecture) => (
                <SortableLectureRow
                  key={lecture._id}
                  lecture={lecture}
                  canDelete={canDelete}
                  canReorder={canReorder}
                  isCompleted={Boolean(completedLectureIds?.has(String(lecture._id)))}
                  onDeleteLecture={onDeleteLecture}
                  onSelectLecture={onSelectLecture}
                  selectedLectureId={selectedLectureId}
                  onEditLecture={onEditLecture}
                  onRename={onRename}
                  onInstructorPreview={onInstructorPreview}
                  showAcknowledge={showAcknowledge}
                  acknowledgedLectureIds={acknowledgedLectureIds}
                  onAcknowledgeLecture={onAcknowledgeLecture}
                  dense={dense}
                  lectureAnalytics={lectureAnalyticsById?.[String(lecture._id)]}
                />
              ))}
            </ul>
          </SortableContext>

          {/* Drag overlay — floating ghost while dragging */}
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeLecture ? (
              <div className="flex max-w-sm cursor-grabbing items-center gap-2.5 rounded-xl border border-brand-300 bg-white px-4 py-3 shadow-2xl ring-2 ring-brand-500/20 dark:border-brand-600 dark:bg-gray-900">
                <GripVertical className="w-4 h-4 shrink-0 text-gray-400" />
                <Play className="w-3.5 h-3.5 shrink-0 text-brand-500" />
                <span className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">{activeLecture.title}</span>
                {activeLecture.duration && (
                  <span className="text-xs tabular-nums text-gray-400">{formatDuration(activeLecture.duration)}</span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {canDelete && courseId ? (
          <AddLectureToLevelButton
            courseId={courseId}
            levelNum={levelNum}
            levelTitle={levelData.title}
            lectureCount={levelData.lectures.length}
          />
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LecturesSection — main export
// ---------------------------------------------------------------------------
export default function LecturesSection({
  courseId,
  lectures = [],
  canDelete = false,
  onDeleteLecture,
  isLoading = false,
  onSelectLecture,
  selectedLectureId,
  completedLectureIds,
  onEditLecture,
  onRename,
  onReorder,
  /** Instructor: quick video check without leaving workspace */
  onInstructorPreview,
  showAcknowledge = false,
  acknowledgedLectureIds,
  onAcknowledgeLecture,
  /** Batch-update level title / delete all lectures in a level — instructor workspace */
  onRenameLevel,
  onDeleteLevelSection,
  /** Instructor curriculum analytics keyed by lecture/level id */
  curriculumAnalytics,
  /** "default" | "workspaceTree" | "watchSidebar" — compact layouts beside player */
  variant = "default",
}) {
  const { t } = useTranslation();
  const canReorder = canDelete && !!onReorder;
  const isWorkspaceTree = variant === "workspaceTree";
  const isWatchSidebar = variant === "watchSidebar";
  const useCompactLayout = isWorkspaceTree || isWatchSidebar;

  // Local copy for optimistic drag updates — syncs with prop when not mid-drag
  const [localLectures, setLocalLectures] = useState(() => [...(lectures || [])]);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalLectures([...(lectures || [])]);
    }
  }, [lectures]);

  const storageKey = courseId ? `workspaceLectureLevels:${courseId}` : null;
  const [expandedLevels, setExpandedLevels] = useState({});
  const prevLevelsKeyRef = useRef("");

  const levelNumsKey = useMemo(
    () => sortedUniqueLevelNums(localLectures).join(","),
    [localLectures],
  );

  useEffect(() => {
    prevLevelsKeyRef.current = "";
  }, [courseId]);

  useEffect(() => {
    if (localLectures.length === 0) {
      setExpandedLevels({});
      prevLevelsKeyRef.current = "";
      return;
    }
    if (!levelNumsKey) return;
    if (prevLevelsKeyRef.current === levelNumsKey) return;
    prevLevelsKeyRef.current = levelNumsKey;

    setExpandedLevels((prev) => {
      const nums = sortedUniqueLevelNums(localLectures);
      if (nums.length === 0) return {};

      const next = {};
      if (storageKey) {
        try {
          const raw = sessionStorage.getItem(storageKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object") {
              for (const k of nums) {
                const sk = String(k);
                if (parsed[sk] !== undefined) next[k] = !!parsed[sk];
              }
            }
          }
        } catch {
          /* ignore */
        }
      }
      for (const k of nums) {
        if (next[k] === undefined) next[k] = prev[k] ?? false;
      }
      for (const key of Object.keys(next)) {
        if (!nums.includes(Number(key))) delete next[key];
      }
      return next;
    });
  }, [localLectures, levelNumsKey, storageKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const grouped = useMemo(() => groupLecturesByLevel(localLectures, t), [localLectures, t]);

  const lectureAnalyticsById = curriculumAnalytics?.lectures ?? null;
  const levelAnalyticsByNumber = curriculumAnalytics?.levels ?? null;
  const showCurriculumAnalytics = Boolean(canDelete && curriculumAnalytics);

  const totalDuration = useMemo(
    () => (localLectures || []).reduce((s, l) => s + (l.duration || 0), 0),
    [localLectures],
  );

  const toggleLevel = (num) => {
    setExpandedLevels((prev) => {
      const next = { ...prev, [num]: !prev[num] };
      if (storageKey) {
        try {
          sessionStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  // Called by LevelGroup after drag ends — optimistically updates local state then fires API
  const handleReorderInLevel = useCallback(
    (levelNum, reorderedWithOrders) => {
      isDraggingRef.current = false;
      setLocalLectures((prev) => {
        const others = prev.filter((l) => (l.level?.number ?? 1) !== levelNum);
        return [...others, ...reorderedWithOrders];
      });
      onReorder?.(reorderedWithOrders.map((l) => ({ _id: l._id, order: l.order })));
    },
    [onReorder],
  );

  if (isLoading) {
    return (
      <div
        className={`bg-white dark:bg-gray-800 shadow border dark:border-gray-700 p-5 ${
          useCompactLayout ? "rounded-none border-0 shadow-none h-full" : "rounded-xl"
        }`}
      >
        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="mt-5 space-y-3">
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isWorkspaceTree
          ? "flex h-full max-h-[calc(100dvh-11rem)] min-h-0 flex-col overflow-hidden border-0 bg-transparent shadow-none"
          : isWatchSidebar
            ? "overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            : "rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
      }
    >
      {/* Header */}
      <div
        className={`border-b border-gray-100 dark:border-gray-800 ${
          useCompactLayout ? "shrink-0 px-3 py-2.5" : "px-5 py-4"
        }`}
      >
        {isWatchSidebar ? (
          <>
            <h3 className="flex min-w-0 items-center gap-2 text-[15px] font-bold text-gray-900 dark:text-white">
              <Video className="w-4 h-4 text-brand-500 shrink-0" aria-hidden />
              {t("workspace.lecturesSection.curriculum")}
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <span>
                {t("workspace.lecturesSection.sectionCount", { count: grouped.length })}
              </span>
              <span aria-hidden>·</span>
              <span>
                {t("workspace.curriculum.lectureCount", { count: localLectures.length })}
              </span>
              {totalDuration > 0 ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatDuration(totalDuration)}</span>
                </>
              ) : null}
            </p>
          </>
        ) : (
          <>
        <div className="flex items-center gap-2">
          <h3
            className={`flex min-w-0 flex-1 items-center gap-2 font-bold text-gray-900 dark:text-white ${
              isWorkspaceTree ? "gap-2 text-[15px]" : "gap-2.5 text-xl"
            }`}
          >
            {isWorkspaceTree ? (
              <Layers className="w-4 h-4 text-brand-500 shrink-0" aria-hidden />
            ) : (
              <Video className="w-5 h-5 text-brand-500 shrink-0" aria-hidden />
            )}
            {isWorkspaceTree ? t("workspace.lecturesSection.curriculum") : t("workspace.lecturesSection.lectures")}
          </h3>
          {showCurriculumAnalytics ? (
            <>
              <CurriculumStatsHeader dense={isWorkspaceTree} />
              <CurriculumTrailingColumn dense={isWorkspaceTree} />
            </>
          ) : (
            <div
              className={`flex items-center gap-3 font-semibold text-gray-600 dark:text-gray-400 ${
                isWorkspaceTree ? "gap-2 text-[13px]" : "gap-4 text-[13px]"
              }`}
            >
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                {t("workspace.lecturesSection.sectionCount", { count: grouped.length })}
              </span>
              <span className="flex items-center gap-1">
                <Play className="w-3.5 h-3.5" />
                {t("workspace.curriculum.lectureCount", { count: localLectures.length })}
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(totalDuration)}
                </span>
              )}
            </div>
          )}
        </div>
        {!showCurriculumAnalytics ? (
          <div
            className={`mt-2 flex flex-wrap items-center gap-3 font-semibold text-gray-600 dark:text-gray-400 ${
              isWorkspaceTree ? "text-[13px]" : "text-[13px]"
            }`}
          >
            {canDelete && courseId && localLectures.length === 0 ? (
              <Link
                to={paths.courseNewLecture(courseId)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 text-[13px] font-bold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-900/35 dark:text-brand-300 dark:hover:bg-brand-900/55"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {t("workspace.lecturesSection.startWithLecture")}
              </Link>
            ) : null}
          </div>
        ) : (
          <div
            className={`mt-1.5 flex flex-wrap items-center gap-3 text-[12px] font-semibold text-gray-500 dark:text-gray-400 ${
              isWorkspaceTree ? "text-[11px]" : ""
            }`}
          >
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {grouped.length} section{grouped.length !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <Play className="w-3.5 h-3.5" />
              {localLectures.length} lecture{localLectures.length !== 1 ? "s" : ""}
            </span>
            {totalDuration > 0 ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDuration(totalDuration)}
              </span>
            ) : null}
            {canDelete && courseId && localLectures.length === 0 ? (
              <Link
                to={paths.courseNewLecture(courseId)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1.5 font-bold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-900/35 dark:text-brand-300 dark:hover:bg-brand-900/55"
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {t("workspace.lecturesSection.startWithLecture")}
              </Link>
            ) : null}
          </div>
        )}
          </>
        )}
      </div>

      {localLectures.length === 0 ? (
        <div className={`text-center ${useCompactLayout ? "px-3 py-6" : "px-5 py-8"}`}>
          <Video className="mx-auto mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="text-[15px] font-semibold text-gray-600 dark:text-gray-400">{t("workspace.lecturesSection.noLectures")}</p>
          <p className="mx-auto mt-1 max-w-xs text-[13px] font-medium leading-snug text-gray-500 dark:text-gray-500">
            {t("workspace.lecturesSection.noLecturesHint")}
          </p>
          {canDelete && courseId ? (
            <Link
              to={paths.courseNewLecture(courseId)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600"
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t("workspace.lecturesSection.addFirstLecture")}
            </Link>
          ) : null}
        </div>
      ) : isWorkspaceTree ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {grouped.map(([levelNum, levelData]) => (
            <LevelGroup
              key={levelNum}
              levelNum={Number(levelNum)}
              levelData={levelData}
              isOpen={!!expandedLevels[levelNum]}
              onToggle={() => toggleLevel(levelNum)}
              canDelete={canDelete}
              canReorder={canReorder}
              onDeleteLecture={onDeleteLecture}
              onSelectLecture={onSelectLecture}
              selectedLectureId={selectedLectureId}
              completedLectureIds={completedLectureIds}
              onEditLecture={onEditLecture}
              onRename={onRename}
              onReorderInLevel={handleReorderInLevel}
              sensors={sensors}
              courseId={courseId}
              onInstructorPreview={onInstructorPreview}
              showAcknowledge={showAcknowledge}
              acknowledgedLectureIds={acknowledgedLectureIds}
              onAcknowledgeLecture={onAcknowledgeLecture}
              dense
              onRenameLevel={onRenameLevel}
              onDeleteLevelSection={onDeleteLevelSection}
              levelAnalytics={
                showCurriculumAnalytics ? levelAnalyticsByNumber?.[String(levelNum)] : undefined
              }
              lectureAnalyticsById={showCurriculumAnalytics ? lectureAnalyticsById : undefined}
            />
          ))}
        </div>
      ) : (
        grouped.map(([levelNum, levelData]) => (
          <LevelGroup
            key={levelNum}
            levelNum={Number(levelNum)}
            levelData={levelData}
            isOpen={!!expandedLevels[levelNum]}
            onToggle={() => toggleLevel(levelNum)}
            canDelete={canDelete}
            canReorder={canReorder}
            onDeleteLecture={onDeleteLecture}
            onSelectLecture={onSelectLecture}
            selectedLectureId={selectedLectureId}
            completedLectureIds={completedLectureIds}
            onEditLecture={onEditLecture}
            onRename={onRename}
            onReorderInLevel={handleReorderInLevel}
            sensors={sensors}
            courseId={courseId}
            onInstructorPreview={onInstructorPreview}
            showAcknowledge={showAcknowledge}
            acknowledgedLectureIds={acknowledgedLectureIds}
            onAcknowledgeLecture={onAcknowledgeLecture}
            dense={isWatchSidebar}
            onRenameLevel={onRenameLevel}
            onDeleteLevelSection={onDeleteLevelSection}
            levelAnalytics={
              showCurriculumAnalytics ? levelAnalyticsByNumber?.[String(levelNum)] : undefined
            }
            lectureAnalyticsById={showCurriculumAnalytics ? lectureAnalyticsById : undefined}
          />
        ))
      )}
    </div>
  );
}
