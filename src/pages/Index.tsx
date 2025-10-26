import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, Wand2, FileImage } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-slip", {
        body: { image: selectedImage },
      });

      if (error) throw error;

      // Create new image with extracted text on themed background
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Load original image to get dimensions
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply gradient background (themed)
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#7c3aed");
        gradient.addColorStop(1, "#c026d3");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add subtle pattern overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        for (let i = 0; i < canvas.height; i += 20) {
          ctx.fillRect(0, i, canvas.width, 1);
        }

        // Draw extracted text
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        
        if (data.textElements && Array.isArray(data.textElements)) {
          data.textElements.forEach((element: any) => {
            const fontSize = element.fontSize === "large" ? 24 : element.fontSize === "small" ? 12 : 16;
            ctx.font = `${fontSize}px Arial, sans-serif`;
            const x = (element.x / 100) * canvas.width;
            const y = (element.y / 100) * canvas.height;
            ctx.fillText(element.text, x, y);
          });
        }

        setProcessedImage(canvas.toDataURL("image/png"));
        toast({
          title: "Success!",
          description: "Your slip has been processed",
        });
      };
      img.src = selectedImage;
    } catch (error: any) {
      console.error("Error processing image:", error);
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement("a");
    link.download = "processed-slip.png";
    link.href = processedImage;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container relative mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <Wand2 className="h-4 w-4" />
              <span>AI-Powered Image Processing</span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
              Transform Your Slips
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Instantly
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Upload any slip image, and our AI extracts the text while applying a beautiful themed background.
              Keep your layout intact, enhance your documents.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-5xl">
          {!selectedImage ? (
            <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
              <div
                className="flex flex-col items-center justify-center p-12 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <div className="mb-4 rounded-full bg-primary/10 p-6">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Upload Your Slip</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Drag and drop or click to select an image
                </p>
                <Button variant="default" className="gap-2">
                  <FileImage className="h-4 w-4" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Original Image */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    Original
                  </h3>
                </div>
                <div className="p-4">
                  <img
                    src={selectedImage}
                    alt="Original"
                    className="w-full rounded-lg"
                  />
                </div>
              </Card>

              {/* Processed Image */}
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    Processed
                  </h3>
                </div>
                <div className="p-4">
                  {processedImage ? (
                    <img
                      src={processedImage}
                      alt="Processed"
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                      <p className="text-muted-foreground">
                        Click process to see results
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          {selectedImage && (
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedImage(null);
                  setProcessedImage(null);
                }}
              >
                Upload New
              </Button>
              <Button
                onClick={processImage}
                disabled={isProcessing}
                className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Wand2 className="h-4 w-4" />
                {isProcessing ? "Processing..." : "Process Image"}
              </Button>
              {processedImage && (
                <Button
                  onClick={downloadImage}
                  variant="default"
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="p-6 text-center">
              <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">1. Upload</h3>
              <p className="text-sm text-muted-foreground">
                Select or drag your slip image into the upload area
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">2. Process</h3>
              <p className="text-sm text-muted-foreground">
                AI extracts text and applies a beautiful themed background
              </p>
            </Card>
            <Card className="p-6 text-center">
              <div className="mb-4 mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">3. Download</h3>
              <p className="text-sm text-muted-foreground">
                Get your enhanced slip with the original layout preserved
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
