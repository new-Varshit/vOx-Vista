import React from 'react';
import PropTypes from 'prop-types';

/**
 * ChatListSkeleton
 *
 * A reusable, professional-looking skeleton component for the chat list loading state.
 * Uses Tailwind utility classes (project already uses Tailwind in other components).
 *
 * Props:
 * - count (number): number of placeholder items to render
 * - compact (boolean): render a more compact row style
 *
 * Accessibility:
 * - role="status" and aria-busy are provided so screen readers announce loading.
 *
 * Usage:
 * <ChatListSkeleton count={8} />
 * <ChatListSkeleton count={4} compact />
 */

const ChatListSkeleton = ({ count = 6, compact = false }) => {
  const rows = Array.from({ length: count });

  return (
    <div role="status" aria-busy="true" className="w-full">
      <span className="sr-only">Loading chats…</span>

      <div className="space-y-2">
        {rows.map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm
              ${compact ? 'py-2 px-3' : ''}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 ${compact ? 'w-10 h-10' : 'w-12 h-12'} animate-pulse`}
              aria-hidden="true"
            />

            {/* Content: name + last message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="w-1/2">
                  <div
                    className={`h-3 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ${compact ? 'w-28' : 'w-40'}`}
                    aria-hidden="true"
                  />
                </div>
                <div
                  className={`h-3 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ${compact ? 'w-10' : 'w-14'}`}
                  aria-hidden="true"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 pr-4">
                  <div
                    className={`h-3 rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse ${compact ? 'w-40' : 'w-56'}`}
                    aria-hidden="true"
                  />
                </div>

                {/* Unread badge placeholder */}
                <div className={`${compact ? 'w-6 h-6' : 'w-7 h-7'} rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse`} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ChatListSkeleton.propTypes = {
  count: PropTypes.number,
  compact: PropTypes.bool,
};

export default ChatListSkeleton;