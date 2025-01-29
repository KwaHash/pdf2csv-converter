import React from 'react';
import { FaUpload } from "react-icons/fa";

type PDFUploaderButtonProps = {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement>;
};

const PDFUploaderButton: React.FC<PDFUploaderButtonProps> = ({ onFileChange, inputRef }) => {
  return (
    <label
      htmlFor="pdf-upload"
      className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-300 rounded cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-300 ease-out"
      onDrop={(e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
          onFileChange({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
      }}
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <FaUpload className="w-12 h-12 mb-4 text-gray-500" />
        <p className="mb-2 text-sm text-gray-500">
          <span className="font-semibold">PDFクリックしてアップロードする</span> か、ドラッグアンドドロップしてください
        </p>
      </div>
      <input
        ref={inputRef}
        id="pdf-upload"
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={onFileChange}
      />
    </label>
  );
}

export default PDFUploaderButton;