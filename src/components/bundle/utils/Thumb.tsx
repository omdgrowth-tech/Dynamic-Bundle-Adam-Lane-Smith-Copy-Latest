import React from "react";

interface ThumbProps {
  readonly title: string;
}

export const Thumb = React.memo<ThumbProps>(({
  title
}) => (
  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
    {title.split(" ").slice(0, 2).join("\n")}
  </div>
));

Thumb.displayName = 'Thumb';