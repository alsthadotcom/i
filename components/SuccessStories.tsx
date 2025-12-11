/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/outline';

export const SuccessStories: React.FC = () => {
    return (
        <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center px-4 pt-20 animate-in zoom-in-95 duration-700">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600 to-green-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-8 md:p-12 bg-zinc-900 ring-1 ring-zinc-800 rounded-lg leading-none flex flex-col items-center text-center max-w-md">
                    <div className="mb-6 p-4 bg-zinc-800/50 rounded-full">
                        <TrophyIcon className="w-12 h-12 text-yellow-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Success Stories</h2>
                    <p className="text-zinc-400 mb-8 leading-relaxed">
                        Read how founders turned napkins into exits. Real case studies of intellectual property monetization on Ida.
                    </p>
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-mono">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>COMING SOON</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
