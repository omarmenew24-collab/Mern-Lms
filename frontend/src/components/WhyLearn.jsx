import { usePublicWhyLearn } from "../api/admin";
import { getWhyLearnColorStyle, getWhyLearnIconComponent } from "../lib/whyLearnUi";

function gridClass(count) {
  if (count <= 1) return "grid-cols-1 max-w-md mx-auto";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
}

const WhyLearn = () => {
  const { title, titleHighlight, subtitle, cards, isLoading } = usePublicWhyLearn();

  if (isLoading) {
    return (
      <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto text-center animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3 max-w-md mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 max-w-sm mx-auto mt-3" />
          <div className={`grid gap-6 mt-12 ${gridClass(3)}`}>
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="rounded-xl p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 h-48"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const list = Array.isArray(cards) && cards.length > 0 ? cards : [];

  return (
    <section className="py-20 px-6 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          {title}
          {titleHighlight ? (
            <>
              {" "}
              <span className="text-brand-600 dark:text-brand-400">{titleHighlight}</span>
            </>
          ) : null}
        </h2>
        {subtitle ? (
          <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">{subtitle}</p>
        ) : null}

        <div className={`grid gap-6 mt-12 text-start ${gridClass(list.length)}`}>
          {list.map((f, idx) => {
            const Icon = getWhyLearnIconComponent(f.icon);
            const { color, bg } = getWhyLearnColorStyle(f.color);
            return (
              <div
                key={`why-learn-${idx}-${f.title}`}
                className="rounded-xl p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} aria-hidden />
                </div>
                <h3 className="mt-4 font-bold text-gray-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyLearn;
