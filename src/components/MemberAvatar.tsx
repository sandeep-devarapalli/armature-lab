import type { PublicProfile } from "../types/domain";

export function MemberAvatar({
  member,
  large = false
}: {
  member: Pick<PublicProfile, "name" | "avatarUrl">;
  large?: boolean;
}) {
  const className = `avatar${large ? " avatar-large" : ""}`;
  if (member.avatarUrl) {
    return (
      <img
        className={className}
        src={member.avatarUrl}
        alt={`${member.name} avatar`}
      />
    );
  }
  return (
    <div className={className} aria-hidden="true">
      {member.name
        .split(" ")
        .map((word) => word[0])
        .join("")}
    </div>
  );
}
