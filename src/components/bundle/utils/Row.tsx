import React from "react";

interface RowProps {
  readonly label: React.ReactNode;
  readonly value: React.ReactNode;
}

export const Row = React.memo<RowProps>(({
  label,
  value
}) => (
  <div className="flex items-center justify-between">
    <div className="text-neutral-600">{label}</div>
    <div>{value}</div>
  </div>
));

Row.displayName = 'Row';