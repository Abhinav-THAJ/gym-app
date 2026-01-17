import React from 'react';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "rounded-2xl bg-surface p-6",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
});
Card.displayName = "Card";
