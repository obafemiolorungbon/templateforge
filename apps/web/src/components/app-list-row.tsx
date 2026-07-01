import Link, { type LinkProps } from 'next/link';
import type {
  AnchorHTMLAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
} from 'react';

const baseRowClassName =
  'group cascade-in grid gap-4 px-4 py-5 transition duration-300 hover:bg-white/[0.055] md:px-5';

function rowClassName(className?: string) {
  return className ? `${baseRowClassName} ${className}` : baseRowClassName;
}

type AppListRowProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'div';
  children: ReactNode;
  style?: CSSProperties;
};

export function AppListRow({
  as: Component = 'div',
  className,
  children,
  ...props
}: AppListRowProps) {
  return (
    <Component className={rowClassName(className)} {...props}>
      {children}
    </Component>
  );
}

type AppListRowLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | 'className'> & {
    className?: string;
    children: ReactNode;
    style?: CSSProperties;
  };

export function AppListRowLink({
  className,
  children,
  ...props
}: AppListRowLinkProps) {
  return (
    <Link className={rowClassName(className)} {...props}>
      {children}
    </Link>
  );
}
