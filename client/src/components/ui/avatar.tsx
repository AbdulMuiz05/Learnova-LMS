import { cn } from '@/utils/cn';
import { initials } from '@/utils/format';

const sizes = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name?: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-sky-500/20 font-semibold text-primary ring-1 ring-border',
        sizes[size],
        className
      )}
      aria-hidden={!name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? 'User avatar'} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
