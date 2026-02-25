/**
 * Confirm Dialog Component
 * Custom confirmation dialog with Yes/No buttons
 */
'use client';

interface ConfirmDialogProps {
    isOpen: boolean;
    message: string;
    onYes: () => void;
    onNo: () => void;
    yesLabel?: string;
    noLabel?: string;
}

export default function ConfirmDialog({
    isOpen,
    message,
    onYes,
    onNo,
    yesLabel = 'Yes',
    noLabel = 'No',
}: ConfirmDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    확인
                </h3>
                <p className="text-gray-700 mb-6">
                    {message}
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onNo}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
                    >
                        {noLabel}
                    </button>
                    <button
                        onClick={onYes}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                        {yesLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

