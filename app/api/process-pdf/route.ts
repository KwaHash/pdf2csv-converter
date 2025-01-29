import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyBPYZZGRBUW7_WuhZbUQxSGU-Y_2MdHW4g";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File;
    const formats = JSON.parse(formData.get("formats") as string);

    // Convert PDF file to base64
    const arrayBuffer = await pdfFile.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      あなたはPDFからデータを抽出するAIアシスタントです。
      
      各回答者の以下の情報を抽出し、必ずJSON配列形式で返してください。
      説明文や追加のテキストは一切含めないでください。
      JSONのみを出力してください。
      
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
    `;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: base64Data, mimeType: "application/pdf" } },
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json(text);
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: "Failed to process PDF" },
      { status: 500 }
    );
  }
}
