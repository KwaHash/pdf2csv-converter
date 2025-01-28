'use client';

import React, { useState, useRef } from 'react';
import TextInput from '@/components/atoms/TextInput';
import PDFUploaderButton from '@/components/atoms/PDFUploaderButton';
import { FaFilePdf } from "react-icons/fa6";
import { ThemeProvider, Button } from "@mui/material";
import theme from '@/lib/theme';

const PDFUploadAndConvert: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfUrl(URL.createObjectURL(file));
      setPdfFile(file);
    } else {
      alert('有効なPDFファイルをアップロードしてください。');
    }
  };

  const clearPDF = () => {
    setPdfUrl(null);
    setPdfFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="grid grid-cols-[60%,1fr] gap-10 w-full flex-grow mt-3">
        <div className="flex flex-col w-full p-6 bg-white rounded-lg shadow-md">
          {pdfUrl && pdfFile ? (
            <div className="flex flex-col flex-grow mt-4 w-full">
              <div className="w-full flex items-center gap-3 p-3 border rounded-sm">
                <FaFilePdf className="text-blue-500 text-3xl" />
                <div className="flex-1">
                  <p className="font-medium">{pdfFile.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{
                      "borderRadius": "3px",
                      "fontSize": "12px",
                      "padding": "3px",
                    }}
                    onClick={clearPDF}
                  >
                    削除
                  </Button>
                </div>
              </div>
              <div className="w-full mt-4 flex-grow">
                <embed
                  src={pdfUrl}
                  type="application/pdf"
                  width="100%"
                  height="100%"
                  className="rounded-lg border"
                />
              </div>
            </div>
          ) : (
            <PDFUploaderButton
              onFileChange={handleFileChange}
              inputRef={fileInputRef}
            />
          )}
        </div>
        <div className="flex flex-col justify-evenly w-full p-6 bg-white rounded-lg shadow-md">
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold">区別する形式</h2>
            <TextInput
              value={format}
              onChange={setFormat}
            />
          </div>
          <div className="flex justify-center">
            <Button
              variant="contained"
              onClick={handleConvert}
              disabled={!pdfFile || !format.trim()}
            >
              変換する
            </Button>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default PDFUploadAndConvert;