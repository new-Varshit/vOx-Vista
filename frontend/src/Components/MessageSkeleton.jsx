export default function MessageSkeleton({ count = 6 }) {
  const rows = Array.from({ length: count });

  const randomWidth = () => {
    const widths = ["w-48", "w-56", "w-64", "w-72"];
    return widths[Math.floor(Math.random() * widths.length)];
  };

  return (
    <div className="w-full flex flex-col gap-3 px-2 pb-2">
      {rows.map((_, i) => {
        const isLeft = i % 2 === 0;

        return (
          <div
            key={i}
            className={`flex items-start gap-2 ${isLeft ? "justify-start" : "justify-end"}`}
          >
            {/* Avatar only for incoming messages */}
            {isLeft && (
              <div className="w-8 h-8 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />
            )}

            <div
              className={`
                rounded-lg px-3 py-2
                ${isLeft ? "bg-gray-200" : "bg-anotherPrimary/40"}
                animate-pulse
                ${randomWidth()}
                max-w-[70%]
              `}
            >
              <div className="h-3 w-full mb-2 rounded bg-white/70" />
              <div className="h-3 w-3/4 rounded bg-white/60" />

              <div className="flex justify-end mt-1">
                <div className="h-2 w-8 rounded bg-white/50" />
              </div>
            </div>

            {/* Tiny spacer on right side for symmetry */}
            {!isLeft && <div className="w-8" />}
          </div>
        );
      })}
    </div>
  );
}
