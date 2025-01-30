"use client";

import React from "react";
import Image from "next/image";

import PDFUploadAndConvert from "@/components/organisms/PDFUploadAndConvert";

const PDF2CSVConverterPage = () => {
  return (
    <div className="flex flex-col p-10 pb-5 w-full grow">
      <h1 className='flex justify-center items-center gap-3 text-2xl font-bold'>
        <Image src="/images/converter.png" width={80} height={80} alt="Converter" />
        PDFデータをエクセル形式変換
      </h1>
      <PDFUploadAndConvert />
    </div>
  )
}

export default PDF2CSVConverterPage;