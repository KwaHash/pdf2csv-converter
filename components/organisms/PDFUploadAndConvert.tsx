'use client';

import React, { useState, useRef } from 'react';
import { FaFilePdf } from "react-icons/fa6";
import { ThemeProvider, Button } from "@mui/material";

import Loading from '@/components/molecules/loading';
import TextInput from '@/components/atoms/TextInput';
import PDFUploaderButton from '@/components/atoms/PDFUploaderButton';
import theme from '@/lib/theme';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  const downloadCSV = (data: any[]) => {
    // Define CSV headers
    const headers = splitFormats;

    // Convert data to CSV rows
    const csvRows = [
      headers,
      ...data.map(item => splitFormats.map(formatItem => item[formatItem]))
    ];

    // Convert to CSV string
    const csvContent = csvRows
      .map(row => row.map(cell => `"${cell}"`).join(','))
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

    splitFormats = format.split(/,|\n/).map(word => word.trim()).filter(word => word !== "");
    if (splitFormats.length === 0) {
      alert('区別する形式を入力してください。');
      return;
    }

    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result?.toString().split(',')[1] || '';
          resolve(base64);
        };
        reader.readAsDataURL(pdfFile);
      });

      const prompt = `
        あなたはPDFからデータを抽出するAIアシスタントです。
        
        各回答者の以下の情報を抽出し、必ずJSON配列形式で返してください。
        説明文や追加のテキストは一切含めないでください。
        JSONのみを出力してください。
        
        抽出する項目：
        ${splitFormats.map(format => `- ${format}`).join('\n    ')}

        出力形式：
        [
            {
                ${splitFormats.map(format => `"${format}": "値"`).join(',\n            ')}
            }
        ]

        注意事項：
        - 必ず配列[]で囲んでください
        - 情報が見つからない場合は空文字列("")を使用
        - 余分なテキストは含めない
        - 完全なJSONとして解析可能な形式のみ
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "application/pdf" } }
      ]);

      const response = await result.response;
      const text = response.text();

      // Improved JSON extraction and error handling
      let extractedDataArray;
      try {
        // First, try to parse the entire response as JSON
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
        // First, try to parse the entire response as JSON
        extractedDataArray = JSON.parse(cleanedText);
      } catch (parseError) {
        console.log('First parse attempt failed:', parseError);

        // If that fails, try to find JSON array in the text
        const jsonMatch = text.match(/\[\s*{[\s\S]*}\s*\]/);
        if (!jsonMatch) {
          console.log('No JSON array pattern found in:', text);
          throw new Error('有効なJSONデータが見つかりませんでした。応答形式を確認してください。');
        }
        try {
          extractedDataArray = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          console.log('Second parse attempt failed:', secondParseError);
          throw new Error('JSONの解析に失敗しました。');
        }
      }

      // Validate that we have an array
      if (!Array.isArray(extractedDataArray)) {
        throw new Error('抽出されたデータが配列形式ではありません。');
      }

      // Validate array is not empty
      if (extractedDataArray.length === 0) {
        throw new Error('データが抽出されませんでした。');
      }

      downloadCSV(extractedDataArray);      // Download as CSV
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
    )
  );
}

export default PDFUploadAndConvert;