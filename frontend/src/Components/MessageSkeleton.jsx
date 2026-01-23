export default function MessageSkeleton({ count = 6 }) {
  const rows = Array.from({ length: count });

  const randomWidth = () => {
    const widths = [
      "w-32 md:w-48",
      "w-36 md:w-56", 
      "w-40 md:w-64",
      "w-44 md:w-72"
    ];
    return widths[Math.floor(Math.random() * widths.length)];
  };

  return (
    <div className="w-full flex flex-col gap-2 md:gap-3 px-2 pb-2">
      {rows.map((_, i) => {
        const isLeft = i % 2 === 0;

        return (
          <div
            key={i}
            className={`flex items-start gap-1.5 md:gap-2 ${isLeft ? "justify-start" : "justify-end"}`}
          >
            {/* Avatar only for incoming messages */}
            {isLeft && (
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-300 animate-pulse flex-shrink-0" />
            )}

            <div
              className={`
                rounded-lg px-2 py-1.5 md:px-3 md:py-2
                ${isLeft ? "bg-gray-200" : "bg-anotherPrimary/40"}
                animate-pulse
                ${randomWidth()}
                max-w-[75%] md:max-w-[70%]
              `}
            >
              {/* Message lines */}
              <div className="h-2.5 md:h-3 w-full mb-1.5 md:mb-2 rounded bg-white/70" />
              <div className="h-2.5 md:h-3 w-3/4 rounded bg-white/60" />

              {/* Timestamp */}
              <div className="flex justify-end mt-1">
                <div className="h-2 w-6 md:w-8 rounded bg-white/50" />
              </div>
            </div>

            {/* Tiny spacer on right side for symmetry */}
            {!isLeft && <div className="w-6 md:w-8" />}
          </div>
        );
      })}
    </div>
  );
}