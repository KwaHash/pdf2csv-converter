'use client';

import axios from 'axios';
import React, { useState, useRef } from 'react';
import { FaFilePdf } from "react-icons/fa6";
import { ThemeProvider, Button } from "@mui/material";

import Loading from '@/components/molecules/loading';
import TextInput from '@/components/atoms/TextInput';
import PDFUploaderButton from '@/components/atoms/PDFUploaderButton';
import theme from '@/lib/theme';

const WarningMessages = () => (
  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h3 className="text-lg font-bold mb-2">注意事項</h3>
    <ul className="list-disc list-inside space-y-1 text-sm">
      <li>システムで数値などを変換しているため、出力は必ずしも正しいとは限りません。重要な情報は確認するようにしてください。</li>
      <li>手書きデータは認識できません。</li>
      <li>複数のフォーマットが混在しないようにしてください。</li>
      <li>表及び罫線部分のみ出力する仕様になります。</li>
    </ul>
  </div>
);

const FormatExample = () => (
  <div className="mt-2 text-sm pb-4 text-gray-600">
    <p>例：No, 品名, 型番, 数量, 単価, 金額, 同等品, 原本情報</p>
  </div>
);

const PDFUploadAndConvert: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  let splitFormats: string[] = [];

  const downloadCSV = (data: Record<string, string>[]) => {
    const headers = splitFormats;

    // Process data to handle multiple item numbers and equivalent items
    const processedData = data.flatMap(item => {
      // Split item numbers if multiple exist
      const itemNumbers = item['型番']?.split(',').map(num => num.trim()) || [''];

      return itemNumbers.map((num, index) => {
        const newItem = { ...item };

        // Format item number with index if multiple exist
        newItem['型番'] = itemNumbers.length > 1 ? `${num}(${index + 1})` : num;

        // Process quantity (remove units) - Add type checking
        if (newItem['数量'] && typeof newItem['数量'] === 'string') {
          newItem['数量'] = newItem['数量'].replace(/[^0-9.]/g, '');
        } else {
          newItem['数量'] = ''; // Set default value if undefined or not a string
        }

        // Handle equivalent items
        if (newItem['品名']?.includes('同等')) {
          newItem['同等品'] = '○';
        }

        return newItem;
      });
    });

    // Convert to CSV rows
    const csvRows = [
      headers,
      ...processedData.map(item => headers.map(header => item[header] || ''))
    ];

    // Convert to CSV string
    const csvContent = csvRows
      .map(row => row.map((cell: string) => `"${cell}"`).join(','))
      .join('\n');

    // Create blob and download
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'extracted_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConvert = async () => {
    if (!pdfFile) {
      alert('PDFファイルをアップロードしてください。');
      return;
    }

    splitFormats = format.split(/,|\n/).map(word => word.replace(/\s+/g, '').trim()).filter(word => word !== "");
    if (splitFormats.length === 0) {
      alert('区別する形式を入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('formats', JSON.stringify(splitFormats));

      const response = await axios.post('/api/process-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // The response.data is already parsed JSON
      const extractedDataArray = response.data;

      // Validate that we have an array
      if (!Array.isArray(extractedDataArray)) {
        throw new Error('抽出されたデータが配列形式ではありません。');
      }

      // Validate array is not empty
      if (extractedDataArray.length === 0) {
        throw new Error('データが抽出されませんでした。');
      }

      downloadCSV(extractedDataArray);
    } catch (error) {
      console.error('Error extracting data:', error);
      alert(`データの抽出中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    isLoading ? <Loading /> : (
      <ThemeProvider theme={theme}>
        <div className="flex flex-col w-full">
          <WarningMessages />
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
                <FormatExample />
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
        </div>
      </ThemeProvider>
    )
  );
}

export default PDFUploadAndConvert;