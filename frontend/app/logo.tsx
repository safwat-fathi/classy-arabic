export function BrandMark({
  size = "md",
  tone = "light",
}: {
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const boxSize = size === "sm" ? "h-[30px] w-[30px] rounded-lg" : "h-[34px] w-[34px] rounded-lg";
  const iconSize = size === "sm" ? 15 : 18;
  const textSize = size === "sm" ? "text-base" : "text-lg";
  const textColor = tone === "dark" ? "text-white" : "text-gray-900";

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`flex ${boxSize} shrink-0 items-center justify-center bg-emerald-500`}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2l1.8 5.6L19 9l-5.2 1.4L12 16l-1.8-5.6L5 9l5.2-1.4L12 2z" />
          <path d="M19 15l.9 2.6L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.4L19 15z" />
        </svg>
      </span>
      <span
        dir="ltr"
        className={`font-display ${textSize} font-extrabold tracking-tight ${textColor}`}
      >
        Classy Arabic
      </span>
    </span>
  );
}
