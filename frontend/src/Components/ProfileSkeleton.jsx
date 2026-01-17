export default function ProfileSkeleton() {
  return (
    <div className="p-5 bg-gray-200 flex flex-col gap-5 rounded-tl-2xl h-full">
      {/* Title - matches: font-bold text-blue-800 text-2xl text-center font-serif */}
      <div className="flex justify-center">
        <div className="h-8 w-40 rounded-md bg-white animate-pulse" />
      </div>

      {/* Avatar + meta */}
      <div className="flex justify-between">
        <div className="flex gap-4 items-center">
          {/* Avatar - exact match with border */}
          <div className="w-[72px] h-[72px] rounded-full bg-white animate-pulse flex-shrink-0 border-2 border-gray-300 shadow-md" />

          {/* Name + email */}
          <div>
            {/* Username - matches: text-anotherPrimary font-bold */}
            <div className="h-5 w-28 mb-1 rounded-md bg-white animate-pulse" />
            {/* Email - matches: text-font text-sm */}
            <div className="h-4 w-44 rounded-md bg-white animate-pulse" />
          </div>
        </div>

        {/* Edit icon placeholder */}
        <div className="w-5 h-5 mt-2 rounded bg-white animate-pulse" />
      </div>

      {/* Action buttons - matches: text-sm font-semibold py-1 */}
      <div className="flex justify-evenly">
        <div className="h-7 w-2/5 rounded-md bg-white animate-pulse" />
        <div className="h-7 w-2/5 rounded-md bg-white animate-pulse" />
      </div>
    </div>
  );
}