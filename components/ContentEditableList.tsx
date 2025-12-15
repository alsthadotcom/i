/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect } from 'react';
import { AutoResizeTextarea } from './AutoResizeTextarea';

interface ContentEditableListProps {
    items: string[];
    onChange: (newItems: string[]) => void;
    placeholder?: string;
}

export const ContentEditableList: React.FC<ContentEditableListProps> = ({ items, onChange, placeholder }) => {
    const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    useEffect(() => {
        // Ensure refs array matches items length
        inputRefs.current = inputRefs.current.slice(0, items.length);
    }, [items]);

    const handleChange = (index: number, value: string) => {
        const newItems = [...items];
        newItems[index] = value;
        onChange(newItems);
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default new line behavior for Enter alone

            // Allow creating new item only if current is not last or if it's not empty?
            // Standard list behavior: Enter usually creates new item.

            const newItems = [...items];
            newItems.splice(index + 1, 0, ''); // Insert empty item after current
            onChange(newItems);

            // Focus next item on next render
            setTimeout(() => {
                inputRefs.current[index + 1]?.focus();
            }, 0);
        } else if (e.key === 'Backspace' && items[index] === '' && items.length > 1) {
            e.preventDefault();
            const newItems = [...items];
            newItems.splice(index, 1);
            onChange(newItems);

            // Focus prev item
            setTimeout(() => {
                inputRefs.current[index - 1]?.focus();
            }, 0);
        }
    };



    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start group">
                    {/* Number Circle */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-sm text-zinc-500 font-mono mt-0.5 group-focus-within:border-green-500 group-focus-within:text-green-500 transition-colors">
                        {index + 1}
                    </div>

                    {/* Input Area */}
                    {/* Input Area */}
                    <AutoResizeTextarea
                        ref={el => { inputRefs.current[index] = el; }}
                        value={item}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        placeholder={placeholder || "Type here..."}
                        rows={1}
                        className="w-full bg-zinc-950/30 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-200 placeholder-zinc-600 focus:border-green-500 focus:ring-1 focus:ring-green-500/20 focus:outline-none transition-all min-h-[46px]"
                    />
                </div>
            ))}
        </div>
    );
};
