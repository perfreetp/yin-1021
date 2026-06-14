import React from 'react';
import { cn } from '@/lib/utils';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ className, ...props }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full border-collapse', className)} {...props} />
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader: React.FC<TableHeaderProps> = ({ className, ...props }) => {
  return <thead className={cn('bg-gray-50', className)} {...props} />;
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody: React.FC<TableBodyProps> = ({ className, ...props }) => {
  return <tbody className={cn('divide-y divide-gray-200', className)} {...props} />;
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ className, hoverable = true, ...props }) => {
  return (
    <tr
      className={cn(hoverable && 'hover:bg-gray-50 transition-colors', className)}
      {...props}
    />
  );
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead: React.FC<TableHeadProps> = ({ className, ...props }) => {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider',
        className
      )}
      {...props}
    />
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ className, ...props }) => {
  return <td className={cn('px-4 py-3 text-sm text-gray-700', className)} {...props} />;
};
