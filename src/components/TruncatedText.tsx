import { useState } from 'react';
import { X } from 'lucide-react';

interface TruncatedTextProps {
  text: string | null | undefined;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
}

export default function TruncatedText({ 
  text, 
  maxLength = 30, 
  className = '',
  showTooltip = true 
}: TruncatedTextProps) {
  const [showModal, setShowModal] = useState(false);

  if (!text) return <span className={className}>—</span>;

  const isTruncated = text.length > maxLength;
  const displayText = isTruncated ? `${text.substring(0, maxLength)}...` : text;

  if (!isTruncated) {
    return <span className={className}>{text}</span>;
  }

  return (
    <>
      <div className="relative group min-w-0 max-w-full overflow-hidden">
        <span 
          className={`${className} cursor-pointer hover:text-brand-600 dark:hover:text-brand-400 transition-colors block truncate min-w-0 max-w-full text-zoom-safe`}
          onClick={() => setShowModal(true)}
          title={showTooltip ? text : undefined}
        >
          {displayText}
        </span>
        {showTooltip && (
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
            <div className="bg-gray-900 dark:bg-navy-800 text-white dark:text-gray-100 text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs break-words border border-gray-700 dark:border-navy-600 text-zoom-safe">
              {text}
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-navy-800"></div>
            </div>
          </div>
        )}
      </div>

      {/* Full Text Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden modal-container">
          <div 
            className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm modal-backdrop"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative z-50 bg-white dark:bg-navy-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-navy-700 modal-content-zoom-safe">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700 flex-shrink-0 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate min-w-0 text-zoom-safe">Full Text</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto overflow-x-hidden max-h-[calc(80vh-80px)] text-zoom-safe">
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap break-words overflow-wrap-anywhere">{text}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
