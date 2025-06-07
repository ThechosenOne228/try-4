
import React, { useState, useCallback, useEffect } from 'react';
import WebcamCapture from './components/WebcamCapture';
import ImageUpload from './components/ImageUpload';
import OutfitAnalysisDisplay from './components/OutfitAnalysisDisplay';
import SimilarItemsDisplay from './components/SimilarItemsDisplay';
import ShareButton from './components/ShareButton';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import { 
  analyzeImageWithGemini, 
  findSimilarItemsWithGemini
} from './services/geminiService';
import { OutfitAnalysisResult, SimilarItemsSearchResult, GroundingChunk, AnalyzedItem } from './types';

type InputMode = 'none' | 'webcam' | 'upload';

const App: React.FC = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [outfitAnalysis, setOutfitAnalysis] = useState<OutfitAnalysisResult | null>(null);
  const [similarItemsResult, setSimilarItemsResult] = useState<SimilarItemsSearchResult | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[] | undefined>(undefined);

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [inputMode, setInputMode] = useState<InputMode>('none');


  const clearAllData = useCallback((preserveInputMode = false) => {
    setCapturedImage(null);
    setOutfitAnalysis(null);
    setSimilarItemsResult(null);
    setGroundingSources(undefined);
    setError(null);
    setIsLoadingAnalysis(false);
    setIsLoadingSearch(false);
    if (!preserveInputMode) {
        setInputMode('none');
    }
  }, []);

  const processImageForAnalysis = useCallback(async (base64Data: string) => {
    setCapturedImage(base64Data);
    setError(null);
    setIsLoadingAnalysis(true);
    setOutfitAnalysis(null);
    setSimilarItemsResult(null);
    setGroundingSources(undefined);
    try {
      const analysis = await analyzeImageWithGemini(base64Data);
      setOutfitAnalysis(analysis);
    } catch (err) {
      console.error("Analysis error in App:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze outfit.");
      setOutfitAnalysis(null);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, []);

  const handleWebcamCapture = useCallback(async (base64ImageData: string) => {
    clearAllData(true); 
    processImageForAnalysis(base64ImageData);
  }, [processImageForAnalysis, clearAllData]);
  
  const handleImageFileSelect = useCallback(async (file: File) => {
    clearAllData(true); 
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = (e.target?.result as string)?.split(',')[1];
      if (base64Data) {
        processImageForAnalysis(base64Data);
      } else {
        setError("Could not read image file.");
      }
    };
    reader.onerror = () => {
      setError("Error reading file.");
    };
    reader.readAsDataURL(file);
  }, [processImageForAnalysis, clearAllData]);


  const handleClearCaptureOrUpload = () => {
    clearAllData(true); 
  };

  useEffect(() => {
    const searchItems = async (items: AnalyzedItem[]) => {
      if (!items || items.length === 0) {
        setSimilarItemsResult(null);
        setGroundingSources(undefined);
        return;
      }
      setIsLoadingSearch(true);
      setError(null); 
      try {
        const { searchResults, groundingSources: sources } = await findSimilarItemsWithGemini(items);
        setSimilarItemsResult(searchResults);
        setGroundingSources(sources);
      } catch (err) {
        console.error("Search error in App:", err);
        setError(err instanceof Error ? err.message : "Failed to find similar items.");
        setSimilarItemsResult(null);
        setGroundingSources(undefined);
      } finally {
        setIsLoadingSearch(false);
      }
    };

    if (outfitAnalysis && outfitAnalysis.identified_clothing && outfitAnalysis.identified_clothing.length > 0 && !isLoadingAnalysis && !similarItemsResult && !isLoadingSearch) {
       searchItems(outfitAnalysis.identified_clothing);
    }
  }, [outfitAnalysis, isLoadingAnalysis, similarItemsResult, isLoadingSearch]);


  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-3xl">
      <header className="text-center mb-6 md:mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-100">
            AI Fashion Finder
        </h1>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-neutral-400">
          Snap or upload your look, get AI insights, and discover similar styles!
        </p>
      </header>

      <main className="space-y-8 md:space-y-10">
        {inputMode === 'none' && !capturedImage && (
             <div className="p-6 md:p-8 bg-neutral-800 rounded-xl shadow-lg text-center space-y-6">
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral-100">Analyze Your Style</h2>
                <p className="text-neutral-300">Choose how you want to provide your outfit image:</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                    <button
                        onClick={() => setInputMode('webcam')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                        aria-label="Use Webcam to capture image"
                    >
                        Use Webcam
                    </button>
                    <button
                        onClick={() => setInputMode('upload')}
                        className="bg-neutral-600 hover:bg-neutral-500 text-neutral-100 font-medium py-2.5 px-6 rounded-lg transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-opacity-75"
                        aria-label="Upload an image file"
                    >
                        Upload Image
                    </button>
                </div>
            </div>
        )}
        
        {inputMode === 'webcam' && (
            <WebcamCapture 
                onCapture={handleWebcamCapture} 
                onClear={handleClearCaptureOrUpload}
                isCapturing={isLoadingAnalysis} 
                hasCapturedImage={!!capturedImage}
            />
        )}
        {inputMode === 'upload' && (
            <ImageUpload
                onImageSelect={handleImageFileSelect}
                onClearImage={handleClearCaptureOrUpload}
                isAnalyzing={isLoadingAnalysis}
                hasUploadedImage={!!capturedImage}
            />
        )}
        
        {(inputMode !== 'none' || capturedImage) && !isLoadingAnalysis && !isLoadingSearch && (
             <div className="text-center mt-6">
                <button
                    onClick={() => {
                        const newMode = inputMode === 'webcam' ? 'upload' : (inputMode === 'upload' ? 'webcam' : 'none');
                        if (capturedImage) {
                            clearAllData(false); 
                        } else if (inputMode !== 'none') {
                            setInputMode(newMode); 
                        } else {
                            clearAllData(false); 
                        }
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    aria-label={capturedImage ? "Start Over with new image" : (inputMode === 'webcam' ? "Switch to Upload Image" : (inputMode === 'upload' ? "Switch to Webcam" : "Start Over"))}
                >
                    {capturedImage ? "Start Over" : (inputMode === 'webcam' ? "Switch to Upload Image" : (inputMode === 'upload' ? "Switch to Webcam" : "Start Over"))}
                </button>
            </div>
        )}

        {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}

        {isLoadingAnalysis && <LoadingSpinner message="Analyzing your outfit..." />}
        
        {outfitAnalysis && !isLoadingAnalysis && (
          <OutfitAnalysisDisplay analysis={outfitAnalysis} capturedImage={capturedImage} />
        )}

        {isLoadingSearch && <LoadingSpinner message="Searching for similar items..." />}

        {similarItemsResult && !isLoadingSearch && (
          <SimilarItemsDisplay searchResult={similarItemsResult} groundingSources={groundingSources} />
        )}
        
        {outfitAnalysis && !isLoadingAnalysis && !isLoadingSearch && similarItemsResult && (
          <ShareButton outfitAnalysis={outfitAnalysis} similarItemsResult={similarItemsResult} />
        )}
      </main>

      <footer className="text-center mt-16 md:mt-20 py-8 border-t border-neutral-700/50">
        <p className="text-xs sm:text-sm text-neutral-500">
          AI Fashion Finder &copy; {new Date().getFullYear()}. Powered by Gemini.
        </p>
      </footer>
    </div>
  );
};

export default App;
