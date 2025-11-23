import type { ReactNode } from "react";

type CardProps = {
  title?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

const Card = ({ title, children, rightSlot }: CardProps) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || rightSlot) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          {title ? (
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          ) : (
            <span />
          )}
          {rightSlot}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default Card;
