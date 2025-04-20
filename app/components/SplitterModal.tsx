import { useRef, useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface SplitterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSplitConfirm: (text: string) => void;
}

export function SplitterModal({ isOpen, onClose, onSplitConfirm }: SplitterModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);
  const [modalText, setModalText] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Reset text when modal opens
      setModalText("");
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleConfirmSplit = () => {
    const trimmedText = modalText.trim();
    if (!trimmedText) {
      toast.error('请输入文本后再进行拆分');
      return;
    }
    onSplitConfirm(trimmedText);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in"
    >
      <div
        ref={modalContentRef}
        className="bg-white rounded-lg w-full max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: '80vh', boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)' }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI多角色自动拆分</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-150"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <textarea
            value={modalText}
            onChange={(e) => setModalText(e.target.value)}
            className="w-full h-80 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 ease-in-out text-sm bg-white text-gray-900 resize-none"
            placeholder="在此处粘贴或输入需要拆分的文本..."
          />
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 gap-4"> 
          <span className="text-xs text-gray-500 mr-auto">注：拆分后会覆盖掉原对话区域中所有的对话</span> 
          <button
            onClick={handleConfirmSplit}
            className="px-8 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            AI拆分
          </button>
        </div>
      </div>
    </div>
  );
} 