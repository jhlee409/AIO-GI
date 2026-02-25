/**
 * File Upload Button Component
 * 파일 업로드를 위한 재사용 가능한 버튼 컴포넌트
 */
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export interface FileUploadButtonProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    disabled?: boolean;
    children?: React.ReactNode;
    className?: string;
}

export function FileUploadButton({
    onFileSelect,
    accept = '.xlsx,.xls',
    disabled = false,
    children,
    className = '',
}: FileUploadButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        if (!disabled && inputRef.current) {
            inputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
        // Reset input value to allow selecting the same file again
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled}
            />
            <button
                onClick={handleClick}
                disabled={disabled}
                className={className}
            >
                {children || (
                    <>
                        <Upload className="w-5 h-5" />
                        <span>파일 업로드</span>
                    </>
                )}
            </button>
        </>
    );
}
