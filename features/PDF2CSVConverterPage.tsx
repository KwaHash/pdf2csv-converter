"use client";

import React from "react";
import Image from "next/image";

import PDFUpload from "@/components/organisms/PDFUpload";

const PDF2CSVConverterPage = () => {
  return (
    <div className="flex flex-col p-10 pb-5 w-full grow">
      <h2 className='flex justify-center items-center gap-3 text-2xl font-bold'>
        <Image src="/imgs/converter.png" width={80} height={80} alt="Converter" />
        PDFデータをエクセル形式変換
      </h2>
      <div className="grid grid-cols-[60%,40%] gap-10 w-full flex-grow mt-3">
        <PDFUpload />
      </div>
    </div>
  )
}

export default PDF2CSVConverterPage;