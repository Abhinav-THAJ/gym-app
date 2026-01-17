import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const variants = {
        primary: "bg-fitness-green text-black hover:bg-fitness-green/90 border border-transparent shadow-[0_0_15px_rgba(164,255,0,0.3)]",
        secondary: "bg-surface-highlight text-white hover:bg-surface-highlight/80",
        outline: "bg-transparent border border-zinc-700 text-white hover:border-white",
        ghost: "bg-transparent text-zinc-400 hover:text-white hover:bg-white/5",
        danger: "bg-fitness-red/10 text-fitness-red border border-fitness-red/20 hover:bg-fitness-red/20",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-5 py-2.5 text-sm",
        lg: "px-8 py-3 text-base",
        icon: "p-2",
    };

    return (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none tracking-wide",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = "Button";
