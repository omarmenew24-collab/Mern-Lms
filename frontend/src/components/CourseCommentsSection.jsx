import { useMemo, useState } from "react";
import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "../lib/i18nFormatters";
import useUserStore from "../store/userstore";
import {
  useCreateCourseComment,
  useDeleteCourseComment,
  useListCourseComments,
} from "../api/comments";
import { confirmAction } from "../lib/confirmToast.jsx";

function buildCommentTree(comments) {
  const list = comments || [];
  const childMap = new Map();
  for (const c of list) {
    const raw = c.parentComment?._id ?? c.parentComment;
    const pid = raw != null ? String(raw) : null;
    if (pid) {
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid).push(c);
    }
  }
  for (const arr of childMap.values()) {
    arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }
  const roots = list.filter((c) => {
    const raw = c.parentComment?._id ?? c.parentComment;
    return raw == null;
  });
  roots.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return { roots, childMap };
}

function CommentCard({
  c,
  depth,
  childMap,
  user,
  canModerate,
  openForUser,
  isDeleting,
  deleteComment,
  onReply,
  replyingToId,
}) {
  const { t, i18n } = useTranslation();
  const children = childMap.get(String(c._id)) || [];

  return (
    <div
      className={
        depth > 0
          ? "ms-4 sm:ms-6 ps-3 border-s-2 border-gray-100 dark:border-gray-800"
          : ""
      }
    >
      <div className="rounded-lg border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {c.user?.name || "User"}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
                {c.user?.role || "user"}
              </span>
              <span className="text-[10px] text-gray-400">{formatDateTime(c.createdAt, i18n.language)}</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5 whitespace-pre-wrap break-words">
              {c.content}
            </p>
          </div>
          {canModerate && (
            <button
              type="button"
              disabled={isDeleting}
              onClick={async () => {
                const ok = await confirmAction("Delete this comment?", {
                  destructive: true,
                  confirmLabel: "Delete",
                });
                if (!ok) return;
                try {
                  await deleteComment(c._id);
                } catch {
                  /* toast from mutation */
                }
              }}
              className="text-[11px] font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 shrink-0"
            >
              Delete
            </button>
          )}
        </div>
        {user && openForUser && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => onReply(c._id, c.user?.name)}
              className={`text-[11px] font-semibold ${
                replyingToId === String(c._id)
                  ? "text-brand-600 dark:text-brand-400"
                  : "text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
              }`}
            >
              {replyingToId === String(c._id) ? t("comments.replyingBtnActive") : t("comments.replyBtn")}
            </button>
          </div>
        )}
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((ch) => (
            <CommentCard
              key={ch._id}
              c={ch}
              depth={depth + 1}
              childMap={childMap}
              user={user}
              canModerate={canModerate}
              openForUser={openForUser}
              isDeleting={isDeleting}
              deleteComment={deleteComment}
              onReply={onReply}
              replyingToId={replyingToId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CourseCommentsSection({ courseId, courseTeacherId, title }) {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const { comments, isLoading, isError, commentPolicy } = useListCourseComments(courseId, 30);
  const { createComment, isPending: isCreating } = useCreateCourseComment(courseId);
  const { deleteComment, isPending: isDeleting } = useDeleteCourseComment(courseId);
  const [text, setText] = useState("");
  const [replyingTo, setReplying] = useState(null);
  const [replyLabel, setReplyLabel] = useState("");

  const openForUser = commentPolicy?.openForUser !== false;
  const policyNote = useMemo(() => {
    if (!commentPolicy) return null;
    if (commentPolicy.commentsGloballyDisabled) {
      return t("comments.globallyDisabled");
    }
    if (commentPolicy.courseCommentsDisabled) {
      return t("comments.courseDisabled");
    }
    return null;
  }, [commentPolicy, t]);

  const canPost = Boolean(user && courseId && openForUser);
  const { roots, childMap } = useMemo(() => buildCommentTree(comments), [comments]);

  const canModerate = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;
    if (user.role === "teacher" && courseTeacherId) {
      return String(courseTeacherId) === String(user._id);
    }
    return false;
  }, [user, courseTeacherId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (replyingTo) {
      await createComment({ content, parentComment: replyingTo });
    } else {
      await createComment(content);
    }
    setText("");
    setReplying(null);
    setReplyLabel("");
  };

  const startReply = (id, name) => {
    setReplying(String(id));
    setReplyLabel(name || "");
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
        <MessageCircle className="w-4 h-4 text-brand-500" />
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{title || t("coursePublic.commentsTitle")}</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">({comments?.length || 0})</span>
      </div>

      <div className="p-5 space-y-4">
        {user && !openForUser && policyNote && (
          <div
            className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-lg px-3 py-2"
            role="status"
          >
            {policyNote}
          </div>
        )}

        {user && canPost ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            {replyingTo && (
              <div className="flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span>
                  {t("comments.replyingLabel")} <span className="font-semibold">{replyLabel}</span>
                </span>
                <button
                  type="button"
                  className="font-semibold text-gray-500 hover:text-gray-800 dark:hover:text-white"
                  onClick={() => {
                    setReplying(null);
                    setReplyLabel("");
                  }}
                >
                  {t("comments.cancel")}
                </button>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder={replyingTo ? t("comments.replyPlaceholder") : t("comments.commentPlaceholder")}
              className="w-full text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder-gray-400 transition-shadow"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400">{text.length}/1000</span>
              <button
                type="submit"
                disabled={isCreating || !text.trim()}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {replyingTo ? t("comments.postReply") : t("comments.post")}
              </button>
            </div>
          </form>
        ) : !user ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">{t("comments.signInPrompt")}</p>
        ) : null}

        {isLoading && <p className="text-xs text-gray-400">{t("comments.loading")}</p>}
        {isError && <p className="text-xs text-red-500">{t("comments.error")}</p>}
        {!isLoading && !comments?.length && (
          <p className="text-xs text-gray-400 italic">{t("comments.empty")}</p>
        )}

        <div className="space-y-3">
          {roots.map((c) => (
            <CommentCard
              key={c._id}
              c={c}
              depth={0}
              childMap={childMap}
              user={user}
              canModerate={canModerate}
              openForUser={openForUser}
              isDeleting={isDeleting}
              deleteComment={deleteComment}
              onReply={startReply}
              replyingToId={replyingTo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
