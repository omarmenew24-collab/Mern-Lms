import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Video,
  Trash2,
  ChevronDown,
  Play,
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

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function groupLecturesByLevel(lectures = []) {
  const grouped = (lectures || []).reduce((groups, lecture) => {
    const levelNum = lecture.level?.number ?? 1;
    if (!groups[levelNum]) {
      groups[levelNum] = {
        title: lecture.level?.title || `Level ${levelNum}`,
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
}) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 px-4 py-3 transition-colors ${
        isDragging
          ? "opacity-40"
          : isSelected
            ? "bg-brand-50 dark:bg-brand-900/20"
            : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
      }`}
    >
      {/* Drag handle — always rendered for instructors so they discover it */}
      {canReorder && (
        <span
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 -ml-1 rounded text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500 touch-none select-none transition-colors"
          aria-label="Drag to reorder"
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
              className="w-full text-sm font-medium bg-transparent border-b border-brand-400 dark:border-brand-500 outline-none text-gray-800 dark:text-white pb-0.5 placeholder-gray-400"
              aria-label="Rename lecture"
            />
          ) : (
            <>
              <div
                className="flex items-center gap-1.5 min-w-0"
                onDoubleClick={onRename ? startRename : undefined}
                title={onRename ? "Double-click to rename" : undefined}
              >
                <span
                  className={`text-sm font-medium truncate ${
                    isSelected
                      ? "text-brand-700 dark:text-brand-300"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {lecture.title}
                </span>
                {lecture.attachments?.length > 0 && (
                  <Paperclip className="w-3 h-3 shrink-0 text-gray-400 dark:text-gray-500" title={`${lecture.attachments.length} attachment${lecture.attachments.length > 1 ? "s" : ""}`} />
                )}
                {lecture.isFreePreview && (
                  <span className="shrink-0 rounded bg-violet-100 dark:bg-violet-900/45 text-violet-800 dark:text-violet-200 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5">
                    Free
                  </span>
                )}
                                {isCompleted && (
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-900/45 text-emerald-700 dark:text-emerald-200 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Done
                                  </span>
                                )}
              </div>
              {lecture.description && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                  {lecture.description}
                </p>
              )}
            </>
          )}
        </div>
      </button>

      {/* Right-side actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isRenaming ? (
          <>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                commitRename();
              }}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
              title="Save rename (Enter)"
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
              title="Cancel (Esc)"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <>
            {lecture.duration ? (
              <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums mr-1">
                {formatDuration(lecture.duration)}
              </span>
            ) : null}
            {/* Rename — revealed on hover */}
            {onRename && (
              <button
                type="button"
                onClick={startRename}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Rename"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Full edit form — revealed on hover */}
            {onEditLecture && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditLecture(lecture);
                }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Edit lecture (video, level, details)"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            )}
            {/* Delete — revealed on hover */}
            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLecture?.(lecture._id);
                }}
                className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete lecture"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// AddLectureToLevelButton — inline shortcut to add lecture in a specific level
// ---------------------------------------------------------------------------
function AddLectureToLevelButton({ courseId, levelNum, levelTitle, lectureCount }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() =>
        navigate(paths.courseNewLecture(courseId), {
          state: { prefillLevel: levelNum, prefillLevelTitle: levelTitle, prefillOrder: lectureCount },
        })
      }
      className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors border-t border-dashed border-gray-200 dark:border-gray-700"
    >
      <Plus className="w-3.5 h-3.5" />
      Add lecture to this level
    </button>
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
}) {
  const [activeId, setActiveId] = useState(null);
  const activeLecture = useMemo(
    () => levelData.lectures.find((l) => l._id === activeId) || null,
    [activeId, levelData.lectures],
  );

  const sortedLectures = useMemo(
    () => [...levelData.lectures].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [levelData.lectures],
  );

  const sortedIds = useMemo(() => sortedLectures.map((l) => l._id), [sortedLectures]);

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

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      {/* Section header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors text-start group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <div className="min-w-0">
            <span className="font-semibold text-sm text-gray-800 dark:text-white block truncate">
              {levelData.title}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">Level {levelNum}</span>
          </div>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 flex items-center gap-2">
          {canReorder && (
            <span className="hidden sm:inline text-[10px] text-gray-300 dark:text-gray-600 font-medium">
              drag to reorder
            </span>
          )}
          {levelData.lectures.length} lecture{levelData.lectures.length !== 1 ? "s" : ""}
          {sectionDuration > 0 ? ` · ${formatDuration(sectionDuration)}` : ""}
        </span>
      </button>

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
                />
              ))}
            </ul>
          </SortableContext>

          {/* Drag overlay — floating ghost while dragging */}
          <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
            {activeLecture ? (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-brand-300 dark:border-brand-600 ring-2 ring-brand-500/20 cursor-grabbing max-w-sm">
                <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <Play className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate flex-1">
                  {activeLecture.title}
                </span>
                {activeLecture.duration && (
                  <span className="text-xs text-gray-400 tabular-nums">
                    {formatDuration(activeLecture.duration)}
                  </span>
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {canDelete && courseId && (
          <AddLectureToLevelButton
            courseId={courseId}
            levelNum={levelNum}
            levelTitle={levelData.title}
            lectureCount={levelData.lectures.length}
          />
        )}
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
}) {
  const canReorder = canDelete && !!onReorder;

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
      if (!nums.some((k) => next[k])) next[nums[0]] = true;
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

  const grouped = useMemo(() => groupLecturesByLevel(localLectures), [localLectures]);

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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-5">
        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="mt-5 space-y-3">
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <Video className="w-5 h-5 text-brand-500" />
          Lectures
        </h3>
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            {grouped.length} section{grouped.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Play className="w-3.5 h-3.5" />
            {localLectures.length} lecture{localLectures.length !== 1 ? "s" : ""}
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDuration(totalDuration)}
            </span>
          )}
          {canDelete && courseId && (
            <Link
              to={paths.courseNewLecture(courseId)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add lecture
            </Link>
          )}
        </div>
      </div>

      {localLectures.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">No lectures yet.</p>
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
          />
        ))
      )}
    </div>
  );
}
