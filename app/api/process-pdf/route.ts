import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFDocument } from "pdf-lib";

async function splitPdfToPages(pdfBuffer: ArrayBuffer): Promise<Uint8Array[]> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const numberOfPages = pdfDoc.getPageCount();

  const pages: Uint8Array[] = [];

  for (let i = 0; i < numberOfPages; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);
    const pdfBytes = await newPdf.save();
    pages.push(pdfBytes);
  }

  return pages;
}

async function processPage(
  pageData: Uint8Array,
  formats: string[],
  model: any
): Promise<any[]> {
  const base64Data = Buffer.from(pageData).toString("base64");

  const prompt = `
    あなたはPDFからデータを抽出するAIアシスタントです。
    
    PDFの全てのエントリーについて、以下の情報を抽出し、必ずJSON配列形式で返してください。
    
    抽出する項目：
    ${formats.map((format: string) => `- ${format}`).join("\n    ")}

    出力形式：
    [
      {
        ${formats
          .map((format: string) => `"${format}": "値"`)
          .join(",\n            ")}
      }
    ]

    注意事項：
    - 必ず配列[]で囲んでください
    - 情報が見つからない場合は空文字列("")を使用
    - 余分なテキストは含めない
    - 完全なJSONとして解析可能な形式のみ
    - 型番や物品番号は、日本語の文字を含めてはならない
    - PDFの全てのエントリーを抽出してください。一部のみではなく、全てのデータを返してください
    - 注釈や説明は一切不要です。純粋なJSONデータのみを返してください
    - 文字数制限による途中での切り捨ては避けてください。全てのエントリーを含めてください
    - 表形式のデータから必要な情報を抽出します
    - 表形式のデータがない場合は、空のJSONオブジェクトを返してください

    PDFデータの配置に関する注意事項：
    - 調達要求番号と物品番号は同じ行に配置されており、調達要求番号は左側に、物品番号は右側に位置する
    - 調達要求番号は英数字で構成され、物品番号は数字のみで構成されている
    - 引渡場所、搬入場所、納期は同じ列に配置されており、上から引渡場所、搬入場所、納期順に並んでいます
  `;

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const response = await result.response;
    let text = response.text();

    if (typeof text !== "string") {
      text = JSON.stringify(text);
    }

    // Parse the JSON response with multiple fallback methods
    let parsedData = null;

    // Method 1: Try direct JSON parse after cleaning
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      parsedData = JSON.parse(cleanedText);
    } catch (error) {
      // Method 2: Try to extract JSON from the text
      try {
        const jsonStartIndex = text.indexOf("[");
        const jsonEndIndex = text.lastIndexOf("]") + 1;
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
          const jsonText = text.substring(jsonStartIndex, jsonEndIndex);
          parsedData = JSON.parse(jsonText);
        }
      } catch (error) {
        // console.log("Method 2 failed:", error);
      }
    }

    if (!parsedData) {
      return [];
    }

    const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    // Validate and format each object
    const validatedData = dataArray.map((item) => {
      const validItem: Record<string, string> = {};
      formats.forEach((format) => {
        validItem[format] = item[format] || "";
      });
      return validItem;
    });

    return validatedData;
  } catch (error) {
    console.error("Error in processPage:", error);
    console.error(
      "Error details:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const formats = JSON.parse(formData.get("formats") as string);

    const pdfBuffer = await pdfFile.arrayBuffer();
    const pdfPages = await splitPdfToPages(pdfBuffer);

    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
    );
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-thinking-exp-01-21",
    });

    const allResults: any[] = [];

    for (const pageData of pdfPages) {
      const pageResults = await processPage(pageData, formats, model);
      if (pageResults && pageResults.length > 1) {
        allResults.push(...pageResults);
      }
    }

    if (allResults.length === 0) {
      return NextResponse.json(
        { error: "No data could be extracted from the PDF" },
        { status: 400 }
      );
    }

    return NextResponse.json(allResults);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to process PDF",
      },
      { status: 500 }
    );
  }
}
