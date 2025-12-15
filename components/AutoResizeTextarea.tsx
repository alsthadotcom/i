import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
}

export const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
    ({ className, value, onChange, rows = 1, style, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);

        // Sync external ref if provided
        useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

        const adjustHeight = () => {
            const element = textareaRef.current;
            if (element) {
                element.style.height = 'auto'; // Reset to auto to get correct scrollHeight
                element.style.height = `${element.scrollHeight}px`;
            }
        };

        useEffect(() => {
            adjustHeight();
        }, [value]);

        // Adjust on mount as well to handle initial value
        useEffect(() => {
            adjustHeight();
        }, []);

        return (
            <textarea
                {...props}
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                    // We must adjust height BEFORE calling onChange to avoid flicker if parent re-renders
                    adjustHeight();
                    if (onChange) onChange(e);
                }}
                rows={rows}
                className={`${className} resize-none overflow-hidden`}
                style={style}
                onInput={(e) => {
                    // Fallback for immediate typing
                    adjustHeight();
                    props.onInput?.(e);
                }}
            />
        );
    }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';
