
import React, { useState, useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import jsQR from 'jsqr';

// Helper for icon components
const QrCodeIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h.01" /><path d="M21 12h.01" /><path d="M12 21h.01" /></svg>
);

const ScanLineIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></svg>
);

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
);

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
);

const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
);

const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

type Tab = 'generate' | 'decode';

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('generate');
    
    // Generator state
    const [urlInput, setUrlInput] = useState<string>('');
    const [qrValue, setQrValue] = useState<string>('');
    const qrCanvasRef = useRef<HTMLDivElement>(null);

    // Decoder state
    const [decodedUrl, setDecodedUrl] = useState<string | null>(null);
    const [decodeError, setDecodeError] = useState<string | null>(null);
    const [isDecoding, setIsDecoding] = useState<boolean>(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleGenerate = () => {
        if (urlInput.trim()) {
            setQrValue(urlInput.trim());
        }
    };

    const handleDownload = () => {
        const canvas = qrCanvasRef.current?.querySelector<HTMLCanvasElement>('canvas');
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = 'qrcode.png';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };
    
    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsDecoding(true);
        setDecodedUrl(null);
        setDecodeError(null);
        setImagePreview(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            setImagePreview(imageUrl);

            const image = new Image();
            image.onload = () => {
                const canvas = canvasRef.current;
                if (!canvas) {
                    setDecodeError('Canvas element not found.');
                    setIsDecoding(false);
                    return;
                }
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                if (!ctx) {
                    setDecodeError('Could not get canvas context.');
                    setIsDecoding(false);
                    return;
                }

                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, image.width, image.height);
                
                const imageData = ctx.getImageData(0, 0, image.width, image.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    setDecodedUrl(code.data);
                } else {
                    setDecodeError('QR code not found. Please try another image.');
                }
                setIsDecoding(false);
            };
            image.onerror = () => {
                setDecodeError('Failed to load image.');
                setIsDecoding(false);
            };
            image.src = imageUrl;
        };
        reader.readAsDataURL(file);
    }, []);

    const TabButton = ({ id, label, icon }: { id: Tab; label: string; icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:ring-indigo-400 ${
                activeTab === id
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4 font-sans">
             <div className="w-full max-w-md">
                <header className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-white">QR Code <span className="text-indigo-400">Wizard</span></h1>
                    <p className="text-gray-400 mt-2">Generate and Decode QR codes with ease.</p>
                </header>

                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl shadow-indigo-900/20">
                    <div className="flex border-b border-gray-700">
                        <TabButton id="generate" label="Generate" icon={<QrCodeIcon className="w-5 h-5"/>} />
                        <TabButton id="decode" label="Decode" icon={<ScanLineIcon className="w-5 h-5"/>} />
                    </div>

                    <div className="p-6">
                        {activeTab === 'generate' && (
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">Website URL</label>
                                    <input
                                        type="text"
                                        id="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="e.g., https://www.google.com"
                                        className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={handleGenerate}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-indigo-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 focus-visible:ring-indigo-400"
                                >
                                    Generate QR Code
                                </button>
                                {qrValue && (
                                    <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center gap-4 border border-gray-700">
                                        <div ref={qrCanvasRef} className="p-4 bg-white rounded-md">
                                            <QRCodeCanvas
                                                value={qrValue}
                                                size={256}
                                                bgColor={"#ffffff"}
                                                fgColor={"#000000"}
                                                level={"L"}
                                                includeMargin={false}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleDownload}
                                            className="w-full flex items-center justify-center gap-2 bg-gray-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-500 transition-colors"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                            Download PNG
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'decode' && (
                            <div className="space-y-6">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 text-gray-400 font-semibold py-8 px-4 rounded-md hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                                >
                                    <UploadIcon className="w-6 h-6"/>
                                    <span>Click to upload QR code image</span>
                                </button>

                                {isDecoding && <div className="text-center text-gray-400">Scanning...</div>}
                                
                                {imagePreview && (
                                     <div className="bg-gray-900 p-4 rounded-lg flex flex-col items-center gap-4 border border-gray-700">
                                        <p className="text-sm font-medium text-gray-300">Image Preview</p>
                                        <img src={imagePreview} alt="QR Code Preview" className="max-w-full h-auto max-h-64 rounded-md" />
                                     </div>
                                )}
                                
                                {decodeError && (
                                    <div className="flex items-center gap-3 bg-red-900/50 text-red-300 border border-red-700 p-3 rounded-md">
                                        <AlertTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{decodeError}</p>
                                    </div>
                                )}
                                {decodedUrl && (
                                    <div className="flex flex-col gap-3 bg-green-900/50 text-green-300 border border-green-700 p-4 rounded-md">
                                        <div className="flex items-center gap-2">
                                            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                            <h3 className="font-semibold">Decoded URL:</h3>
                                        </div>
                                        <a href={decodedUrl} target="_blank" rel="noopener noreferrer" className="break-all font-mono text-lg text-white bg-gray-900/50 p-3 rounded-md hover:bg-gray-800 transition-colors">
                                            {decodedUrl}
                                        </a>
                                    </div>
                                )}
                                <canvas ref={canvasRef} className="hidden"></canvas>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
