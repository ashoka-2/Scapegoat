import React from 'react';

/**
 * Snitch Design System — Button Components
 * ─────────────────────────────────────────
 * PrimaryBtn   → Accent-filled, high-emphasis CTA
 * SecondaryBtn → Outlined/bordered, medium-emphasis action
 * TertiaryBtn  → Ghost/text, low-emphasis link-like action
 *
 * All variants share:
 * - Theme-aware colors via CSS vars (--color-acc, --color-acc-cont, etc.)
 * - Micro-animation: hover lift + active press
 * - Loading state: spinner icon
 * - Disabled state: opacity + cursor
 * - Optional leading/trailing icon (Remix Icon class string)
 * - Size variants: 'sm' | 'md' | 'lg' (default: 'md')
 * - Full-width mode
 *
 * Usage:
 *   <PrimaryBtn onClick={fn} loading={loading} icon="ri-save-3-line">Save</PrimaryBtn>
 *   <SecondaryBtn onClick={fn}>Cancel</SecondaryBtn>
 *   <TertiaryBtn onClick={fn} trailingIcon="ri-arrow-right-line">Learn More</TertiaryBtn>
 */

// ─── Size maps ─────────────────────────────────────────────────────────────
const sizeMap = {
    sm:  'text-xs px-4 py-2 rounded-lg gap-1.5',
    md:  'text-sm px-6 py-3 rounded-xl gap-2',
    lg:  'text-base px-10 py-4 rounded-2xl gap-3',
};

const iconSizeMap = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
};

// ─── Shared base classes ────────────────────────────────────────────────────
const base =
    'inline-flex items-center justify-center font-bold tracking-wide ' +
    'transition-all duration-300 select-none ' +
    'hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] ' +
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

// ─── Icon helper ────────────────────────────────────────────────────────────
const Icon = ({ name, spin = false, size }) =>
    name ? (
        <i className={`${name} ${iconSizeMap[size]} ${spin ? 'animate-spin' : ''}`} aria-hidden="true" />
    ) : null;


// ═══════════════════════════════════════════════════════════════════════════
// PrimaryBtn — Accent-filled CTA
// ═══════════════════════════════════════════════════════════════════════════
export const PrimaryBtn = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    icon,
    trailingIcon,
    size = 'md',
    fullWidth = false,
    className = '',
    ...rest
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
            base,
            sizeMap[size],
            'bg-accent text-accent-content shadow-md',
            'hover:shadow-[0_0_24px_rgba(250,106,101,0.35)] dark:hover:shadow-[0_0_24px_rgba(255,215,0,0.35)]',
            fullWidth ? 'w-full' : '',
            className,
        ].join(' ')}
        {...rest}
    >
        {loading
            ? <Icon name="ri-loader-4-line" spin size={size} />
            : <Icon name={icon} size={size} />
        }
        {children}
        {!loading && <Icon name={trailingIcon} size={size} />}
    </button>
);


// ═══════════════════════════════════════════════════════════════════════════
// SecondaryBtn — Outlined / Bordered
// ═══════════════════════════════════════════════════════════════════════════
export const SecondaryBtn = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    icon,
    trailingIcon,
    size = 'md',
    fullWidth = false,
    className = '',
    ...rest
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
            base,
            sizeMap[size],
            'border-2 border-accent text-accent bg-transparent',
            'hover:bg-accent/10',
            fullWidth ? 'w-full' : '',
            className,
        ].join(' ')}
        {...rest}
    >
        {loading
            ? <Icon name="ri-loader-4-line" spin size={size} />
            : <Icon name={icon} size={size} />
        }
        {children}
        {!loading && <Icon name={trailingIcon} size={size} />}
    </button>
);


// ═══════════════════════════════════════════════════════════════════════════
// TertiaryBtn — Ghost / Text link-style
// ═══════════════════════════════════════════════════════════════════════════
export const TertiaryBtn = ({
    children,
    onClick,
    type = 'button',
    disabled = false,
    loading = false,
    icon,
    trailingIcon,
    size = 'md',
    fullWidth = false,
    className = '',
    ...rest
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={[
            base,
            sizeMap[size],
            'bg-transparent text-accent',
            'hover:bg-accent/8 hover:gap-3',
            'px-2', // override padding for ghost style
            fullWidth ? 'w-full' : '',
            className,
        ].join(' ')}
        {...rest}
    >
        {loading
            ? <Icon name="ri-loader-4-line" spin size={size} />
            : <Icon name={icon} size={size} />
        }
        {children}
        {!loading && <Icon name={trailingIcon} size={size} />}
    </button>
);

export default { PrimaryBtn, SecondaryBtn, TertiaryBtn };
