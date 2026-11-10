// La photo du membre, ou ses initiales s'il n'en a pas.
export function MemberAvatar({
  userId,
  name,
  hasPhoto,
  size = "size-12",
}: {
  userId: string;
  name: string;
  hasPhoto: boolean;
  size?: string;
}) {
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image privée servie par notre API
      <img
        src={`/api/profile/photo/${userId}`}
        alt=""
        className={`${size} shrink-0 rounded-full object-cover shadow-sm`}
      />
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-[#e4d6d3] text-sm font-bold text-brand shadow-inner`}
    >
      {initials || "?"}
    </span>
  );
}
