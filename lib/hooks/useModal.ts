/**
 * Modal Management Hook
 * 모달 상태를 관리하는 재사용 가능한 hook
 */
import { useState, useCallback } from 'react';

export interface UseModalReturn {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
}

export function useModal(initialState: boolean = false): UseModalReturn {
    const [isOpen, setIsOpen] = useState(initialState);

    const open = useCallback(() => {
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    return {
        isOpen,
        open,
        close,
        toggle,
    };
}
