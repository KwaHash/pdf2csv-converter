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

  const downloadCSV = (data: any[]) => {
    // Define CSV headers
    const headers = [
      '氏名',
      '氏名ふりがな',
      '学校名',
      '年齢',
      '郵便番号',
      '住所',
      'メールアドレス',
      '電話番号'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers,
      ...data.map(item => [
        item.氏名,
        item.氏名ふりがな,
        item.学校名,
        item.年齢,
        item.郵便番号,
        item.住所,
        item.メールアドレス,
        item.電話番号
      ])
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
          このPDFの2ページ目から10ページ目までに記載されているアンケート回答から、
          各回答者の以下の情報を抽出し、必ずJSON形式で返してください。
          テキスト形式での回答は避け、JSONのみを返してください。
          
          抽出する項目：
          - 氏名
          - 氏名ふりがな
          - 学校名
          - 年齢
          - 郵便番号
          - 住所
          - メールアドレス
          - 電話番号

          必ず以下の形式のJSONで返してください：
          [
              {
                  "氏名": "値",
                  "氏名ふりがな": "値",
                  "学校名": "値",
                  "年齢": "値",
                  "郵便番号": "値",
                  "住所": "値",
                  "メールアドレス": "値",
                  "電話番号": "値"
              },
              {
                  // 2人目のデータ
              },
              // ... 以降同様
          ]

          情報が見つからない場合は、その項目は空文字列("")としてください。
          必ずJSONとして解析可能な形式で返してください。
          各ページのアンケート回答を1つのオブジェクトとして配列に含めてください。
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: "application/pdf" } }
      ]);

      const response = await result.response;
      const text = response.text();

      // For debugging
      console.log('Raw response:', text);

      // Extract JSON array from the response text
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('JSON data not found in response');
      }

      const extractedDataArray = JSON.parse(jsonMatch[0]) as any[];

      // Download as CSV
      downloadCSV(extractedDataArray);

    } catch (error) {
      console.error('Error extracting data:', error);
      alert('データの抽出中にエラーが発生しました。詳細はコンソールを確認してください。');
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