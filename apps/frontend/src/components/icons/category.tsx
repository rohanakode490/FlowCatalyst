import clsx from "clsx";
import React from "react";

type Props = { selected: boolean };

function Category({ selected }: Props) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="8"
        height="8"
        rx="3"
        className={clsx(
          "transition-all fill-muted-foreground group-hover:fill-primary",
          { "fill-primary-foreground": selected },
        )}
      />
      <rect
        x="3"
        y="13"
        width="8"
        height="8"
        rx="3"
        className={clsx(
          "transition-all fill-muted-foreground group-hover:fill-primary",
          { "fill-primary-foreground": selected },
        )}
      />
      <rect
        x="13"
        y="3"
        width="8"
        height="8"
        rx="3"
        className={clsx(
          "transition-all fill-muted-foreground group-hover:fill-primary",
          { "fill-primary-foreground": selected },
        )}
      />
      <rect
        x="13"
        y="13"
        width="8"
        height="8"
        rx="3"
        className={clsx(
          "transition-all fill-muted group-hover:fill-accent",
          { "fill-accent-foreground/80": selected },
        )}
      />
    </svg>
  );
}

export default Category;
