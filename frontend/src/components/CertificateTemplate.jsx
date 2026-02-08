import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Award, ShieldCheck } from "lucide-react";

const CertificateTemplate = React.forwardRef(({ studentName, courseTitle, date }, ref) => {
  return (
    <div ref={ref} className="p-10 bg-white text-center border-[20px] border-double border-amber-400 m-5 relative shadow-2xl" 
         style={{ width: '297mm', height: '210mm', margin: '0 auto' }}>
      
      {/* Decorative Border Logic */}
      <div className="border-4 border-amber-200 h-full w-full p-10 flex flex-col items-center justify-center">
        <Award size={100} className="text-amber-500 mb-6" />
        
        <h1 className="text-6xl font-serif text-gray-800 mb-4 tracking-widest">CERTIFICATE</h1>
        <p className="text-xl text-gray-500 italic mb-10">OF COMPLETION</p>

        <p className="text-2xl text-gray-600 mb-2">This is to certify that</p>
        <h2 className="text-5xl font-bold text-indigo-900 border-b-4 border-gray-300 pb-4 mb-10 min-w-[60%] uppercase">
          {studentName}
        </h2>

        <p className="text-2xl text-gray-600 max-w-2xl leading-relaxed">
          Has successfully mastered all requirements for the professional course: <br/>
          <span className="font-extrabold text-gray-900 text-3xl">"{courseTitle}"</span>
        </p>

        <div className="mt-20 flex justify-between w-full px-20">
          <div className="text-center">
            <p className="font-bold text-gray-800 border-b border-gray-400 px-4">{date}</p>
            <p className="text-xs text-gray-500 mt-2 uppercase tracking-tighter">Issue Date</p>
          </div>
          
          <div className="relative">
             <div className="absolute -top-12 -left-8 opacity-20">
                <ShieldCheck size={80} className="text-indigo-600" />
             </div>
             <p className="font-serif italic text-3xl text-gray-800 border-b border-gray-400 px-4">Official Platform</p>
             <p className="text-xs text-gray-500 mt-2 uppercase tracking-tighter">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;