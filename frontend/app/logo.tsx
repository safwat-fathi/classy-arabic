import Image from "next/image";

export function BrandMark({
  size = "md",
  tone = "light",
}: {
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const iconSize = size === "sm" ? 30 : 34;
  const textSize = size === "sm" ? "text-base" : "text-lg";
  const textColor = tone === "dark" ? "text-white" : "text-gray-900";

  return (
    <span className="inline-flex items-center gap-2.5">
      <Image
        src="/app-icon-dark.png"
        alt="TijaratkBot Logo"
        width={iconSize}
        height={iconSize}
        className="shrink-0 rounded-lg"
      />
      <span
        dir="ltr"
        className={`font-display ${textSize} font-extrabold tracking-tight ${textColor}`}
      >
        TijaratkBot
      </span>
    </span>
  );
}
