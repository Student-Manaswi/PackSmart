// ... any existing imports
// ... rest of your code
import { Users } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  Upload,
  Scan,
  Layers,
  Box,
  Eye,
  Camera,
  Ruler,
  BarChart3,
  Shield,
  ChevronRight,
  Play,
  ArrowRight,
  Check,
  ArrowLeft,
  FileText,
  Download,
  RotateCcw,
  Weight,
  DollarSign,
  Grid3x3,
  Cpu,
  Mail,
  MapPin,
  Linkedin,
  Building2,
  SwitchCamera,
  X,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Progress } from "./components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import BoxDieline from "./components/BoxDieline";
import PackSmart3D, { BoxType } from "./components/PackSmart3D";
import { formatDimension } from "./utils/formatDimension";

const env = (import.meta as any).env || {};
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
type Page =
  | "landing"
  | "about"
  | "capture"
  | "camera"
  | "detection"
  | "materials"
  | "packaging"
  | "bom"
  | "pricing";

type ImageData = {
  url: string;
  file: File | null;
};

type CameraViewType = "top" | "front";

type AppData = {
  topViewImage: ImageData | null;
  frontViewImage: ImageData | null;
  annotatedImageUrl: string | null;
  knownWidth: string;
  detectedObject: string;
  confidence: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
    volume: number;
  };
  materials: Array<{
    name: string;
    confidence: number;
  }>;
  materialProperties: {
    category: string;
    fragility: string;
  };
  estimatedWeight: number;
  _materialData: any | null;
  _realDimensions: any | null;
  realWeight: string;
  weightUnit: "kg" | "g";
  packaging: {
    type: string;
    boxDimensions: string;
    cushioning: string;
  };
  bom: Array<{
    material: string;
    quantity: string;
    unit: string;
    usage: string;
  }>;
  bomFull: Array<{
    material: string;
    quantity: number;
    unit: string;
    description: string;
    unit_price: number;
    total_cost: number;
  }>;
  pricing: {
    totalCost: number;
    quotationId: string;
  };
  companyDetails: {
    companyName: string;
    companyTagline: string;
    name: string;
    address: string;
    phone: string;
    email: string;
  };
};

type PageProps = {
  appData: AppData;
  setAppData: React.Dispatch<React.SetStateAction<AppData>>;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  currentCameraView: CameraViewType;
  openCamera: (view: CameraViewType) => void;
  capturedImage: string | null;
  setCapturedImage: (img: string | null) => void;
  handleCapture: () => void;
  handleUseImage: () => void;
  handleImageUpload: (file: File, type: "front" | "top") => void;
};

const pageStepsMap: Record<Page, number> = {
  landing: 0,
  about: 0,
  capture: 1,
  camera: 1,
  detection: 2,
  materials: 3,
  packaging: 4,
  bom: 5,
  pricing: 6,
};

function parseBoxDimensions(
  boxDimensions: string,
  fallback: { length: number; width: number; height: number },
) {
  const values = boxDimensions?.match(/([0-9]+(?:\.[0-9]+)?)/g);
  if (!values || values.length < 3) {
    return fallback;
  }
  return {
    length: Number(values[0]),
    width: Number(values[1]),
    height: Number(values[2]),
  };
}

function ProgressIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  if (currentStep === 0) return null;
  const steps = [
    { label: "Upload", step: 1 },
    { label: "Analysis", step: 2 },
    { label: "Material", step: 3 },
    { label: "Recommendation", step: 4 },
    { label: "Design", step: 5 },
    { label: "Quote", step: 6 },
  ];
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-4 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {currentStep} of {totalSteps}
          </span>
        </div>
        <div className="relative">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-700"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between">
            {steps.map((step) => (
              <div
                key={step.step}
                className={`text-xs ${step.step <= currentStep ? "text-blue-700 font-medium" : "text-gray-400"}`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Navbar({
  showBack,
  currentPage,
  setCurrentPage,
}: {
  showBack?: boolean;
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
}) {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {showBack ? (
            <Button
              variant="ghost"
              onClick={() => {
                const backMap: Record<Page, Page> = {
                  landing: "landing",
                  about: "landing",
                  capture: "landing",
                  camera: "capture",
                  detection: "capture",
                  materials: "detection",
                  packaging: "materials",
                  bom: "packaging",
                  pricing: "bom",
                };
                setCurrentPage(backMap[currentPage]);
              }}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">PACKSMART</h1>
              </div>
            </div>
          )}
          {!showBack && (
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() =>
                  document
                    .getElementById("technology-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                Technology
              </button>
              <button
                onClick={() =>
                  document
                    .getElementById("modules-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                Modules
              </button>
              <button
                onClick={() => setCurrentPage("about")}
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                About
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

function LandingPage({ setCurrentPage }: Pick<PageProps, "setCurrentPage">) {
  const modules = [
    {
      icon: Camera,
      title: "Image Capture",
      description: "Capture front and top images of the object.",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Scan,
      title: "Object Detection & Dimension Estimation",
      description:
        "AI detects the object and calculates physical dimensions and volume.",
      color: "from-teal-500 to-teal-600",
    },
    {
      icon: Layers,
      title: "Material Classification",
      description: "Identifies material composition using deep learning.",
      color: "from-violet-500 to-violet-600",
    },
    {
      icon: Box,
      title: "Packaging Recommendation",
      description: "Generates optimized box size and material suggestions.",
      color: "from-orange-500 to-orange-600",
    },
    {
      icon: FileText,
      title: "Bill of Materials (BOM)",
      description: "Breakdown of packaging materials required.",
      color: "from-green-500 to-green-600",
    },
    {
      icon: DollarSign,
      title: "Pricing & Quotation",
      description: "Estimated packaging cost and quotation generation.",
      color: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar currentPage="landing" setCurrentPage={setCurrentPage} />

      {/* Hero Section */}
      <section className="pt-20 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Smart Packaging Decisions, Powered by{" "}
                <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Vision Intelligence
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Capture product images, estimate real-world dimensions, identify
                materials, and generate optimized packaging solutions —
                instantly.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => setCurrentPage("capture")}
                  className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl transition-all"
                >
                  Get Started <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("modules-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="border-2 border-gray-300 hover:border-blue-500 px-8 py-6 rounded-xl"
                >
                  <Play className="w-4 h-4 mr-2" /> View Workflow
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative bg-gradient-to-br from-blue-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl p-12 backdrop-blur-sm border border-white/50 shadow-2xl">
                <div className="relative">
                  <div className="w-64 h-64 mx-auto relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-teal-500 rounded-2xl transform rotate-6 opacity-20"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-teal-600 rounded-2xl shadow-2xl flex items-center justify-center">
                      <Box className="w-32 h-32 text-white/80" />
                    </div>
                    <motion.div
                      animate={{ y: [0, 256, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    />
                    <div className="absolute -top-8 left-0 right-0 flex justify-center">
                      <Badge className="bg-white/90 text-blue-700 border-0 shadow-lg">
                        <Ruler className="w-3 h-3 mr-1" />
                        22.5 cm
                      </Badge>
                    </div>
                    <div className="absolute -right-12 top-1/2 transform -translate-y-1/2">
                      <Badge className="bg-white/90 text-teal-700 border-0 shadow-lg">
                        16.4 cm
                      </Badge>
                    </div>
                  </div>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-0 -left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-gray-200/50"
                  >
                    <div className="flex items-center space-x-2">
                      <Scan className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          Scanning Object
                        </p>
                        <p className="text-xs text-gray-500">Processing...</p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute bottom-0 -right-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-gray-200/50"
                  >
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-teal-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">
                          Material Detected
                        </p>
                        <p className="text-xs text-gray-500">Cardboard 68%</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full blur-3xl opacity-30"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-30"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules-section" className="py-20 px-6 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How PACKSMART Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Six intelligent modules for complete packaging automation
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module, index) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/90 backdrop-blur-sm h-full">
                  <CardContent className="p-6">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${module.color} rounded-xl flex items-center justify-center shadow-lg mb-4`}
                    >
                      <module.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {module.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {module.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">PACKSMART</span>
              </div>
              <p className="text-gray-400 text-sm">
                Intelligent Packaging Automation
              </p>
            </div>

            <div id="technology-section">
              <h3 className="font-semibold mb-4 text-white">Technology</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button className="hover:text-white transition-colors">
                    Computer Vision
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Deep Learning
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Calibration Model
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Resources</h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <button
                    onClick={() => {
                      setCurrentPage("about");
                      setTimeout(() => {
                        document
                          .getElementById("meet-the-team")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Authors
                  </button>
                </li>
                <li className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <a
                    href="/PACKSMART.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Documentation
                  </a>
                </li>
                <li className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Pune, India</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-sm text-gray-400">
              © 2026 PACKSMART. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── About Page ───────────────────────────────────────────────────────────────

function AboutPage({ setCurrentPage }: Pick<PageProps, "setCurrentPage">) {
  const team = [
    { name: "Vedanti Pacharne", role: "vedantipacharne@gmail.com" },
    { name: "Sayee Rananaware", role: "sayee.rananaware@gmail.com" },
    { name: "Aabha Thoke", role: "aabhathoke6@gmail.com" },
    { name: "Manaswi Dasi", role: "dasi.manaswi@gmail.com" },
  ];

  const steps = [
    {
      step: 1,
      icon: Camera,
      title: "Capture Images",
      desc: "Upload or capture a front-view and top-view photo of your product. Use a plain background for best results.",
      color: "from-blue-500 to-blue-600",
    },
    {
      step: 2,
      icon: Scan,
      title: "Enter Known Width",
      desc: "Measure one real dimension of the object (e.g. its width in cm) and enter it. This calibrates all other measurements.",
      color: "from-teal-500 to-teal-600",
    },
    {
      step: 3,
      icon: Eye,
      title: "Run AI Detection",
      desc: "Click 'Run Detection'. The AI detects the object, draws a bounding box, and calculates L × W × H and volume.",
      color: "from-cyan-500 to-cyan-600",
    },
    {
      step: 4,
      icon: Layers,
      title: "Review Materials",
      desc: "The system identifies material composition (e.g. plastic, cardboard) and estimates or accepts a real weight.",
      color: "from-violet-500 to-violet-600",
    },
    {
      step: 5,
      icon: Box,
      title: "Get Packaging Recommendation",
      desc: "View the recommended box type, dimensions, and cushioning. Explore the 2D dieline and interactive 3D preview.",
      color: "from-orange-500 to-orange-600",
    },
    {
      step: 6,
      icon: DollarSign,
      title: "Download Quotation",
      desc: "Review the Bill of Materials and pricing. Add your company details and download a professional PDF quotation.",
      color: "from-green-500 to-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar showBack currentPage="about" setCurrentPage={setCurrentPage} />

      {/* Hero */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6">
              <Package className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              About PACKSMART
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
              A final-year engineering project that combines computer vision,
              deep learning, and packaging engineering to automate smart
              packaging decisions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 px-6 bg-white/60">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white h-full">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                <p className="text-blue-100 leading-relaxed">
                  To eliminate guesswork in packaging by providing AI-powered,
                  vision-calibrated recommendations — reducing material waste,
                  cost, and delivery damage for businesses of all sizes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white h-full">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                  <Scan className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                <p className="text-teal-100 leading-relaxed">
                  A world where every product ships in the perfectly-sized,
                  right-material package — determined in seconds by a camera and
                  AI, not hours of manual measurement and estimation.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How to Use — Manual */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              How to Use PACKSMART
            </h2>
            <p className="text-gray-600">
              Follow these 6 steps to get a complete packaging quotation
            </p>
          </motion.div>
          <div className="space-y-4">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="border-0 shadow-md bg-white/90 hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 flex items-start space-x-5">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-md`}
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                          Step {item.step}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section id="meet-the-team" className="py-16 px-6 bg-white/60">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Meet the Team
            </h2>
            <p className="text-gray-600">
              Final Year B.E. Students — Pune, India
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="border-0 shadow-lg bg-white text-center hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                      <span className="text-2xl font-bold text-white">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-xs text-gray-500">{member.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Try It?
          </h2>
          <p className="text-gray-600 mb-8">
            Upload your product images and get a packaging solution in under a
            minute.
          </p>
          <Button
            size="lg"
            onClick={() => setCurrentPage("capture")}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-10 py-6 rounded-xl shadow-xl"
          >
            Get Started <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
}

// ─── Capture Page ─────────────────────────────────────────────────────────────

function CapturePage({
  appData,
  setAppData,
  currentPage,
  setCurrentPage,
  openCamera,
}: PageProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const runDetection = async () => {
    if (
      !appData.frontViewImage?.file ||
      !appData.topViewImage?.file ||
      !appData.knownWidth
    ) {
      alert("Please upload both images and enter the known width");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append("front_image", appData.frontViewImage.file);
      formData.append("top_image", appData.topViewImage.file);
      formData.append("real_width_cm", appData.knownWidth);

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Backend error");
      }

      const result = await response.json();
      const data = result.data;

      setAppData((prev) => ({
        ...prev,
        annotatedImageUrl: data.bbox_image_path
          ? `${API_URL}/outputs/${data.bbox_image_path.split(/[\\/]/).pop()}`
          : null,
        detectedObject: data.object_name || "Detected Object",
        confidence: data.object_confidence ?? prev.confidence,
        dimensions: {
          length: data.real_dimensions?.length_cm ?? prev.dimensions.length,
          width: data.real_dimensions?.width_cm ?? prev.dimensions.width,
          height: data.real_dimensions?.height_cm ?? prev.dimensions.height,
          volume: data.real_dimensions?.volume_cm3 ?? prev.dimensions.volume,
        },
        materials: data.material?.materials || [],
        materialProperties: {
          category: data.material?.object_category || "Unknown",
          fragility: data.material?.fragility || "Non-Fragile",
        },
        estimatedWeight: data.estimated_weight || 0,
        _materialData: data.material,
        _realDimensions: data.real_dimensions,
      }));

      setCurrentPage("detection");
    } catch (err: any) {
      setAnalysisError(
        err.message || "Could not connect to backend. Make sure it is running.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-0">
            <Camera className="w-3 h-3 mr-1" />
            Step 1 of 6
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Capture Object Images
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Upload images from two angles for accurate analysis
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: JPG, PNG, JPEG, WEBP • Max size: 100MB per image
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Front View Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              {appData.frontViewImage ? (
                <div className="relative group">
                  <ImageWithFallback
                    src={appData.frontViewImage.url}
                    alt="Front view"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCamera("front")}
                      className="bg-white hover:bg-gray-100"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Re-capture
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setAppData((prev) => ({
                              ...prev,
                              frontViewImage: { url, file },
                            }));
                          }
                        };
                        input.click();
                      }}
                      className="bg-white hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Re-upload
                    </Button>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-green-500 border-0">
                    <Check className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-teal-50 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-4">
                      Drag & drop or click to upload
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => openCamera("front")}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Image
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setAppData((prev) => ({
                                ...prev,
                                frontViewImage: { url, file },
                              }));
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top View Card */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="pt-6">
              {appData.topViewImage ? (
                <div className="relative group">
                  <ImageWithFallback
                    src={appData.topViewImage.url}
                    alt="Top view"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCamera("top")}
                      className="bg-white hover:bg-gray-100"
                    >
                      <Camera className="w-4 h-4 mr-1" />
                      Re-capture
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setAppData((prev) => ({
                              ...prev,
                              topViewImage: { url, file },
                            }));
                          }
                        };
                        input.click();
                      }}
                      className="bg-white hover:bg-gray-100"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Re-upload
                    </Button>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-green-500 border-0">
                    <Check className="w-3 h-3 mr-1" />
                    Uploaded
                  </Badge>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gradient-to-br from-blue-50 to-teal-50 hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-700 mb-4">
                      Drag & drop or click to upload
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => openCamera("top")}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:from-blue-700 hover:to-teal-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Image
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setAppData((prev) => ({
                                ...prev,
                                topViewImage: { url, file },
                              }));
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
          <CardContent className="p-8">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <Ruler className="w-6 h-6 text-white" />
                </div>
              </div>
              <Label
                htmlFor="known-width"
                className="text-base font-semibold text-gray-900 mb-4 block text-center"
              >
                Enter Known Width (in cm)
              </Label>
              <input
                id="known-width"
                type="number"
                inputMode="decimal"
                placeholder="Example: 7.8"
                value={appData.knownWidth}
                onChange={(e) =>
                  setAppData((prev) => ({
                    ...prev,
                    knownWidth: e.target.value,
                  }))
                }
                className="text-center text-xl font-semibold h-12 bg-white border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] rounded-xl mb-4 w-full px-3 focus:outline-none"
              />
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    This value is used to scale all other dimensions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pb-12">
          {analysisError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4 text-sm">
              ⚠️ {analysisError}
            </div>
          )}
          <Button
            size="lg"
            onClick={runDetection}
            disabled={
              !appData.frontViewImage ||
              !appData.topViewImage ||
              !appData.knownWidth ||
              isAnalyzing
            }
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                Run Detection <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          {isAnalyzing && (
            <p className="text-sm text-gray-500 mt-3">
              Running AI pipeline — this may take a few seconds...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Camera Page ──────────────────────────────────────────────────────────────

function CameraPage({
  currentPage,
  setCurrentPage,
  currentCameraView,
  capturedImage,
  setCapturedImage,
  handleUseImage,
  setAppData,
  appData,
}: PageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );

  const viewLabel = currentCameraView === "front" ? "Front View" : "Top View";

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsLoading(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsLoading(false);
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        setCameraError(
          "Camera permission denied. Please allow camera access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (err.name === "NotReadableError") {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError(
          "Could not access camera. Please try uploading an image instead.",
        );
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!capturedImage) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const handleSwitchCamera = () => {
    const newFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(newFacing);
    startCamera(newFacing);
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedImage(imageDataUrl);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const handleCancel = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCurrentPage("capture");
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative h-full w-full">
        {!capturedImage ? (
          <>
            {!cameraError && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover ${
                  facingMode === "user" ? "-scale-x-100" : ""
                }`}
              />
            )}

            {isLoading && !cameraError && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-sm">Starting camera...</p>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center p-8">
                <div className="text-center text-white max-w-sm">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
                  <p className="text-sm text-gray-400 mb-6">{cameraError}</p>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Go Back & Upload Instead
                  </Button>
                </div>
              </div>
            )}

            {!cameraError && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
                <div className="relative w-full max-w-2xl aspect-[4/3]">
                  <div className="absolute inset-0 border-2 border-white/30 rounded-2xl">
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br"></div>
                  </div>
                  <div className="absolute top-3 left-3 bg-blue-500/90 px-3 py-1 rounded-lg">
                    <p className="text-white text-xs font-semibold">
                      {viewLabel}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
              {!cameraError && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSwitchCamera}
                  className="text-white hover:bg-white/20 rounded-full w-10 h-10 p-0"
                  title="Switch camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </Button>
              )}
            </div>

            {!cameraError && !isLoading && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                <div className="flex justify-center items-center space-x-6">
                  <p className="text-white/70 text-xs absolute bottom-24 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    Position object within the frame
                  </p>
                  <button
                    onClick={handleCapture}
                    aria-label="Capture photo"
                    className="w-20 h-20 rounded-full bg-white border-4 border-white/50 shadow-2xl hover:scale-95 active:scale-90 transition-transform flex items-center justify-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-300"></div>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full aspect-[4/3] object-cover rounded-2xl"
                />
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg">
                  <Check className="w-5 h-5 text-white" />
                  <span className="text-white font-semibold text-sm">
                    Photo Captured!
                  </span>
                </div>
              </div>
              <div className="flex justify-center space-x-4 mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleRetake}
                  className="rounded-xl border-white text-white hover:bg-white/10 px-8"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  size="lg"
                  onClick={handleUseImage}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-8"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detection Page ───────────────────────────────────────────────────────────

function DetectionPage({ appData, currentPage, setCurrentPage }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-6xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            <Scan className="w-3 h-3 mr-1" />
            Step 2 of 6
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Object Detection & Dimensions
          </h1>
          <p className="text-lg text-gray-600">
            AI has analyzed your object and calculated real-world dimensions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* LEFT CARD — image fills full card height */}
          <Card
            className="border-0 shadow-xl bg-white/90 backdrop-blur-sm flex flex-col"
            style={{ width: "550px", height: "660px" }}
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center space-x-2">
                <Scan className="w-5 h-5 text-green-600" />
                <span>Object Detection Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-6 px-6 overflow-hidden">
              {appData.annotatedImageUrl ? (
                <img
                  src={appData.annotatedImageUrl}
                  alt="Annotated detection"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : appData.frontViewImage?.url ? (
                <ImageWithFallback
                  src={appData.frontViewImage.url}
                  alt="Detected object"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                  No image available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* RIGHT CARD — green detected box on top, then dimensions */}
          <Card
            className="border-0 shadow-xl bg-white/90 backdrop-blur-sm flex flex-col"
            style={{ width: "550px", height: "660px" }}
          >
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center space-x-2">
                <Ruler className="w-5 h-5 text-blue-600" />
                <span>Calculated Dimensions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-auto px-6 pb-6">
              {/* GREEN DETECTED OBJECT BOX */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Detected Object:
                </Label>
                <p className="text-3xl font-bold text-gray-900 mb-4">
                  {appData.detectedObject}
                </p>
                <Label className="text-sm text-gray-600 mb-2 block">
                  Detection Confidence:
                </Label>
                <div className="flex items-end space-x-2 mb-3">
                  <span className="text-4xl font-bold text-green-600">
                    {appData.confidence}
                  </span>
                  <span className="text-xl text-gray-600 mb-1">%</span>
                </div>
                <Progress value={appData.confidence} className="h-3" />
              </div>

              {/* DIMENSION BOXES */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4">
                  <p className="text-sm opacity-90 mb-1">Length</p>
                  <p className="text-3xl font-bold">
                    {appData.dimensions.length}
                  </p>
                  <p className="text-xs opacity-80">centimeters</p>
                </div>
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl p-4">
                  <p className="text-sm opacity-90 mb-1">Width</p>
                  <p className="text-3xl font-bold">
                    {appData.dimensions.width}
                  </p>
                  <p className="text-xs opacity-80">centimeters</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-4">
                  <p className="text-sm opacity-90 mb-1">Height</p>
                  <p className="text-3xl font-bold">
                    {appData.dimensions.height}
                  </p>
                  <p className="text-xs opacity-80">centimeters</p>
                </div>
                <div className="bg-gradient-to-br from-violet-500 to-violet-600 text-white rounded-xl p-4">
                  <p className="text-sm opacity-90 mb-1">Volume</p>
                  <p className="text-3xl font-bold">
                    {appData.dimensions.volume.toFixed(1)}
                  </p>
                  <p className="text-xs opacity-80">cubic cm</p>
                </div>
              </div>

              {/* INFO BOX */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Eye className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">
                    Dimensions calculated using computer vision and calibrated
                    with your known reference measurement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setCurrentPage("materials")}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl"
          >
            Proceed to Material Identification{" "}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Materials Page (EDITED & COMPATIBLE) ────────────────────────────────────

function MaterialsPage({
  appData,
  setAppData,
  currentPage,
  setCurrentPage,
}: PageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGeneratePackaging = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    const weightInKg = appData.realWeight
      ? appData.weightUnit === "g"
        ? parseFloat(appData.realWeight) / 1000
        : parseFloat(appData.realWeight)
      : null;

    try {
      // Pointed explicitly to /api/packaging and supplied aligned JSON keys
      const response = await fetch(`${API_URL}/api/packaging`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: appData._materialData,
          real_dimensions: appData._realDimensions,
          estimated_weight: appData.estimatedWeight,
          real_weight: weightInKg,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.detail || "Backend error parsing Stage 2 instructions.",
        );
      }

      const result = await response.json();
      const data = result.data;

      if (!data || !data.packaging) {
        throw new Error(
          "Invalid format received from automated response arrays.",
        );
      }

      const fullBomData = Array.isArray(data.bom) ? data.bom : [data.bom];

      setAppData((prev) => ({
        ...prev,
        packaging: {
          type: data.packaging.packaging_material || "Standard Box",
          boxDimensions:
            data.packaging.box_dimensions ||
            `${prev.dimensions.length}×${prev.dimensions.width}×${prev.dimensions.height}`,
          cushioning: data.packaging.protection_layer || "None",
        },
        bomFull: fullBomData,
        bom: fullBomData.map((item: any) => ({
          material: item.material || "Unknown Material",
          quantity:
            item.quantity !== undefined ? item.quantity.toString() : "1",
          unit: item.unit || "pcs",
          usage: item.description || "Packaging protection component",
        })),
        pricing: {
          totalCost: data.grand_total ?? 0.0,
          quotationId: "PKS-2026-001",
        },
      }));

      setCurrentPage("packaging");
    } catch (err: any) {
      setGenerationError(err.message || "Could not connect to backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-purple-100 text-purple-700 border-0">
            <Layers className="w-3 h-3 mr-1" />
            Step 3 of 6
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Material Identification & Weight Estimation
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered texture analysis and density-based weight prediction
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-violet-600" />
              <span>Material Composition Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {appData.materials &&
              appData.materials.map((material, index) => (
                <motion.div
                  key={material.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${index === 0 ? "bg-gradient-to-br from-blue-500 to-cyan-500" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}
                      >
                        <Box className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {material.name}
                      </span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                      {(material.confidence ?? 0).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={material.confidence ?? 0} className="h-4" />
                </motion.div>
              ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <span>Material Properties (AI Detected)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Object Category
                </Label>
                <div className="w-full px-4 py-4 bg-gradient-to-r from-blue-50 to-teal-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {appData.materialProperties.category}
                    </span>
                    <Badge className="bg-blue-600 text-white border-0">
                      <Check className="w-3 h-3 mr-1" />
                      Detected
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Fragility
                </Label>
                <div className="w-full px-4 py-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900">
                      {appData.materialProperties.fragility}
                    </span>
                    <Badge className="bg-orange-600 text-white border-0">
                      <Check className="w-3 h-3 mr-1" />
                      Detected
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-teal-600 text-white">
            <CardContent className="p-8 text-center">
              <Weight className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <p className="text-lg font-medium mb-2 opacity-90">
                Estimated Weight (AI Predicted)
              </p>
              <div className="flex items-end justify-center space-x-2 mb-2">
                <span className="text-6xl font-bold">
                  {appData.estimatedWeight < 1
                    ? +(appData.estimatedWeight * 1000).toFixed(2)
                    : appData.estimatedWeight}
                </span>
                <span className="text-2xl mb-3 opacity-80">
                  {appData.estimatedWeight < 1 ? "g" : "kg"}
                </span>
              </div>
              <p className="text-sm opacity-80">
                Based on material density analysis
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <Ruler className="w-6 h-6 text-white" />
                </div>
              </div>
              <Label
                htmlFor="real-weight"
                className="text-base font-semibold text-gray-900 mb-4 block text-center"
              >
                Enter Real Weight (Optional)
              </Label>
              <div className="flex justify-center mb-4">
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() =>
                      setAppData((prev) => ({ ...prev, weightUnit: "kg" }))
                    }
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${appData.weightUnit === "kg" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    kg
                  </button>
                  <button
                    onClick={() =>
                      setAppData((prev) => ({ ...prev, weightUnit: "g" }))
                    }
                    className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${appData.weightUnit === "g" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
                  >
                    g
                  </button>
                </div>
              </div>
              <input
                id="real-weight"
                type="number"
                inputMode="decimal"
                step="0.01"
                placeholder={
                  appData.weightUnit === "kg" ? "Example: 0.4" : "Example: 400"
                }
                value={appData.realWeight}
                onChange={(e) =>
                  setAppData((prev) => ({
                    ...prev,
                    realWeight: e.target.value,
                  }))
                }
                className="text-center text-lg font-semibold h-12 bg-white border border-gray-300 focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.15)] rounded-xl mb-4 w-full px-3 focus:outline-none"
              />
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-xs text-gray-700 text-center">
                  If provided, real weight will be used instead of AI estimate
                  for packaging calculations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {generationError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-6 py-4 text-sm text-center">
            {generationError}
          </div>
        )}

        <div className="text-center pb-12">
          <Button
            size="lg"
            onClick={handleGeneratePackaging}
            disabled={isGenerating}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                Generate Packaging Recommendation{" "}
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
          {isGenerating && (
            <p className="text-sm text-gray-500 mt-3">
              Generating packaging recommendation...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Packaging Page ───────────────────────────────────────────────────────────

function PackagingPage({ appData, currentPage, setCurrentPage }: PageProps) {
  const currentBoxType: BoxType = (() => {
    const low = appData.packaging.type.toLowerCase();
    if (low.includes("plywood crate") || low.includes("wood")) return "plywood";
    if (low.includes("single panel cardboard box") || low.includes("light"))
      return "bottle";
    if (low.includes("4 panel cardboard box") || low.includes("medium"))
      return "cardboard";
    return "cardboard";
  })();

  const packagingDims = parseBoxDimensions(
    appData.packaging.boxDimensions,
    appData.dimensions,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Packaging Recommendation
          </h1>
          <p className="text-gray-600">
            Intelligent box design based on object properties and industry rules
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl bg-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Box className="w-5 h-5 text-orange-600" />
              <span>Optimal Packaging Selection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-200 mb-6">
              <p className="text-sm text-gray-700 mb-4">
                Based on your object material, volume, and weight, the system
                recommends:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4 border border-amber-300">
                  <p className="text-xs text-gray-600 mb-1">
                    Packaging Material
                  </p>
                  <p className="font-bold text-orange-600">
                    {appData.packaging.type}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-300">
                  <p className="text-xs text-gray-600 mb-1">Box Dimensions</p>
                  <p className="font-bold text-orange-600">
                    {packagingDims.length} × {packagingDims.width} ×{" "}
                    {packagingDims.height} cm
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-300">
                  <p className="text-xs text-gray-600 mb-1">Protection Level</p>
                  <p className="font-bold text-orange-600">
                    {appData.packaging.cushioning}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Box Design Preview
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">2D Flat Layout</h3>
              </div>
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-6 flex flex-col items-center justify-start min-h-[640px]">
                <BoxDieline
                  length={packagingDims.length}
                  width={packagingDims.width}
                  height={packagingDims.height}
                />
                <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Width</p>
                    <p className="text-lg font-bold text-amber-700">
                      {formatDimension(packagingDims.width)} cm
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Height</p>
                    <p className="text-lg font-bold text-amber-700">
                      {formatDimension(packagingDims.height)} cm
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Length</p>
                    <p className="text-lg font-bold text-amber-700">
                      {formatDimension(packagingDims.length)} cm
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-6">
                  Scaled 2D box dieline — fold on dashed lines, cut on solid
                  lines
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-8">
              <div className="flex items-center space-x-2 mb-6">
                <Box className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  3D Interactive Preview
                </h3>
              </div>
              <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 rounded-lg p-4 min-h-[459px]">
                <PackSmart3D
                  length={packagingDims.length}
                  breadth={packagingDims.width}
                  height={packagingDims.height}
                  boxType={currentBoxType}
                />
                <p className="text-sm text-gray-700 mt-3 text-center">
                  Drag inside the 3D view to orbit, right-drag to pan, wheel to
                  zoom. Model type follows recommended packaging:{" "}
                  {appData.packaging.type}.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setCurrentPage("bom")}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl"
          >
            View Bill of Materials <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── BOM Page ─────────────────────────────────────────────────────────────────

function BOMPage({ appData, currentPage, setCurrentPage }: PageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            <FileText className="w-3 h-3 mr-1" />
            Step 5 of 6
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Bill of Materials
          </h1>
          <p className="text-lg text-gray-600">
            Complete breakdown of packaging components and quantities
          </p>
        </motion.div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-600" />
              <span>Materials List</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Generated for {appData.packaging.type} with dimensions{" "}
              {appData.packaging.boxDimensions}
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Material</TableHead>
                  <TableHead className="font-semibold">Quantity</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  <TableHead className="font-semibold">
                    Estimated Usage
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appData.bom.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.material}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-gray-600">
                      {item.usage}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-teal-600 text-white mb-8">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <p className="text-lg font-medium mb-2 opacity-90">
              Total Material Usage
            </p>
            <p className="text-5xl font-bold mb-2">{appData.bom.length}</p>
            <p className="text-sm opacity-80">Material types required</p>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setCurrentPage("pricing")}
            className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl shadow-xl"
          >
            Generate Pricing & Quotation{" "}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Page ─────────────────────────────────────────────────────────────

function PricingPage({
  appData,
  setAppData,
  currentPage,
  setCurrentPage,
}: PageProps) {
  let subtotal = appData.pricing.totalCost;
  const taxRate = 0.085;
  const tax = subtotal * taxRate;
  const shipping = 15.0;
  const total = subtotal + tax + shipping;

  const handleDownloadPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    pdf.setFillColor(22, 163, 74);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(appData.companyDetails.companyName || "PACKSMART", margin, 18);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      appData.companyDetails.companyTagline ||
        "Vision-Calibrated Packaging Intelligence",
      margin,
      25,
    );

    y = 45;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("PRICE QUOTATION", pageWidth - margin, y, { align: "right" });
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Quotation #: ${appData.pricing.quotationId}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );
    y += 6;
    pdf.text(
      `Date: ${new Date().toLocaleDateString()}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );
    y += 6;
    pdf.text(
      `Valid Until: ${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}`,
      pageWidth - margin,
      y,
      { align: "right" },
    );

    y = 45;
    if (appData.companyDetails.name) {
      pdf.text(appData.companyDetails.name, margin, y);
      y += 6;
    }
    if (appData.companyDetails.address) {
      pdf.text(appData.companyDetails.address, margin, y);
      y += 6;
    }
    if (appData.companyDetails.phone) {
      pdf.text(`Phone: ${appData.companyDetails.phone}`, margin, y);
      y += 6;
    }
    if (appData.companyDetails.email) {
      pdf.text(`Email: ${appData.companyDetails.email}`, margin, y);
      y += 6;
    }

    y = 95;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Quotation For:", margin, y);
    y += 7;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Object: ${appData.detectedObject}`, margin, y);
    y += 6;
    pdf.text(`Dimensions: ${appData.packaging.boxDimensions}`, margin, y);
    y += 6;

    pdf.setFillColor(254, 243, 199);
    pdf.rect(margin, y, pageWidth - margin * 2, 8, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("DESCRIPTION", margin + 2, y + 5.5);
    pdf.text("QTY", 100, y + 5.5);
    pdf.text("UNIT PRICE", 140, y + 5.5);
    pdf.text("AMOUNT", 170, y + 5.5);
    y += 8;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    if (appData.bomFull && appData.bomFull.length > 0) {
      appData.bomFull.forEach((item) => {
        pdf.rect(margin, y, pageWidth - margin * 2, 8);
        pdf.text(item.material, margin + 2, y + 5.5);
        pdf.text(`${item.quantity} ${item.unit}`, 100, y + 5.5);
        pdf.text(`Rs ${item.unit_price.toFixed(2)}`, 140, y + 5.5);
        pdf.text(`Rs ${item.total_cost.toFixed(2)}`, 170, y + 5.5);
        y += 8;
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
      });
    } else {
      pdf.text("No BOM data available", margin, y);
      y += 8;
    }

    y += 15;
    const col = 140;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(col, y, pageWidth - margin, y);
    y += 6;
    pdf.text("Subtotal:", col, y);
    pdf.text(`Rs ${subtotal.toFixed(2)}`, 185, y, { align: "right" });
    y += 6;
    pdf.text(`Tax (${(taxRate * 100).toFixed(1)}%):`, col, y);
    pdf.text(`Rs ${tax.toFixed(2)}`, 185, y, { align: "right" });
    y += 6;
    pdf.text("Shipping:", col, y);
    pdf.text(`Rs ${shipping.toFixed(2)}`, 185, y, { align: "right" });
    y += 6;
    pdf.line(col, y, pageWidth - margin, y);
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(22, 163, 74);
    pdf.text("TOTAL:", col, y);
    pdf.text(`Rs ${total.toFixed(2)}`, 185, y, { align: "right" });

    y += 20;
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "bold");
    pdf.text("THANK YOU FOR YOUR BUSINESS!", pageWidth / 2, y, {
      align: "center",
    });

    pdf.save(`PackSmart_Quotation_${appData.pricing.quotationId}.pdf`);
  };

  const resetData: AppData = {
    frontViewImage: null,
    topViewImage: null,
    knownWidth: "",
    annotatedImageUrl: null,
    detectedObject: "Plastic Bottle",
    confidence: 94,
    dimensions: { length: 22.5, width: 7.8, height: 16.4, volume: 2876.4 },
    materials: [
      { name: "Cardboard", confidence: 72 },
      { name: "Plastic", confidence: 28 },
    ],
    materialProperties: { category: "Consumer Goods", fragility: "Moderate" },
    estimatedWeight: 0.38,
    realWeight: "",
    weightUnit: "kg",
    _materialData: null,
    _realDimensions: null,
    packaging: {
      type: "Corrugated Cardboard Box",
      boxDimensions: "28 × 14 × 22 cm",
      cushioning: "Bubble Wrap + Edge Protectors",
    },
    bom: [
      {
        material: "Corrugated Sheet",
        quantity: "0.8",
        unit: "sq.m",
        usage: "Box Material",
      },
      {
        material: "Thermocol Padding",
        quantity: "2",
        unit: "pieces",
        usage: "Cushioning",
      },
      {
        material: "Bubble Wrap",
        quantity: "1.2",
        unit: "meters",
        usage: "Inner Protection",
      },
      {
        material: "Packing Tape",
        quantity: "1",
        unit: "roll",
        usage: "Sealing",
      },
    ],
    bomFull: [
      {
        material: "Corrugated Sheet",
        quantity: 0.8,
        unit: "sq.m",
        description: "Box Material",
        unit_price: 50,
        total_cost: 40,
      },
      {
        material: "Thermocol Padding",
        quantity: 2,
        unit: "pieces",
        description: "Cushioning",
        unit_price: 15,
        total_cost: 30,
      },
      {
        material: "Bubble Wrap",
        quantity: 1.2,
        unit: "meters",
        description: "Inner Protection",
        unit_price: 25,
        total_cost: 30,
      },
      {
        material: "Packing Tape",
        quantity: 1,
        unit: "roll",
        description: "Sealing",
        unit_price: 10,
        total_cost: 10,
      },
    ],
    pricing: { totalCost: 86.0, quotationId: "PKS-2026-001" },
    companyDetails: {
      companyName: "",
      companyTagline: "",
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <Navbar
        showBack
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <ProgressIndicator
        currentStep={pageStepsMap[currentPage]}
        totalSteps={6}
      />
      <div className="max-w-5xl mx-auto px-6 py-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <Badge className="mb-4 bg-green-100 text-green-700 border-0">
            <Check className="w-3 h-3 mr-1" />
            Step 6 of 6 - Complete
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Pricing & Quotation
          </h1>
          <p className="text-lg text-gray-600">
            Professional packaging quotation ready for download
          </p>
        </motion.div>

        <Card id="quotation-card" className="border-0 shadow-2xl bg-white mb-8">
          <div className="p-8 border-b-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h1 className="text-3xl font-bold text-green-700 mb-2">
                  {appData.companyDetails.companyName || "YOUR COMPANY NAME"}
                </h1>
                <p className="text-gray-600 text-sm mb-4">
                  {appData.companyDetails.companyTagline ||
                    "Your Company Tagline"}
                </p>
                <div className="text-sm text-gray-700 space-y-1 mt-6">
                  {appData.companyDetails.name && (
                    <p className="font-semibold">
                      {appData.companyDetails.name}
                    </p>
                  )}
                  {appData.companyDetails.address && (
                    <p>{appData.companyDetails.address}</p>
                  )}
                  {appData.companyDetails.phone && (
                    <p>Phone: {appData.companyDetails.phone}</p>
                  )}
                  {appData.companyDetails.email && (
                    <p>Email: {appData.companyDetails.email}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-right">
                  <h2 className="text-3xl font-bold text-pink-300 mb-4">
                    [Price Quote]
                  </h2>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">DATE:</span>
                    <span className="text-gray-900">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Quotation #:
                    </span>
                    <span className="text-gray-900">
                      {appData.pricing.quotationId}
                    </span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="italic text-gray-600">
                      Quotation valid until:
                    </span>
                    <span className="text-gray-900">
                      {new Date(
                        Date.now() + 10 * 24 * 60 * 60 * 1000,
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="italic text-gray-600">Prepared by:</span>
                    <span className="text-gray-900">
                      {appData.companyDetails.companyName || "Your Company"} AI
                      System
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-bold text-gray-900 mb-3">Quotation For:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-semibold">
                  {appData.detectedObject} Packaging
                </p>
                <p>Dimensions: {appData.packaging.boxDimensions}</p>
                <p>Material: {appData.packaging.type}</p>
              </div>
            </div>
            <div className="mb-6 overflow-x-auto">
              <table className="w-full border border-gray-300 text-sm">
                <thead className="bg-amber-50">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                      MATERIAL
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                      QUANTITY
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-700">
                      UNIT PRICE
                    </th>
                    <th className="border border-gray-300 px-3 py-2 text-center font-semibold text-gray-700">
                      TOTAL COST
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {appData.bomFull && appData.bomFull.length > 0 ? (
                    appData.bomFull.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-3 text-gray-900 font-medium">
                          {item.material}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-gray-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-gray-900">
                          ₹ {item.unit_price.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-right text-gray-900 font-medium">
                          ₹ {item.total_cost.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-gray-300 px-3 py-3 text-center text-gray-500"
                      >
                        No BOM data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mb-8">
              <div className="w-full md:w-1/2 bg-amber-50 border border-gray-300 rounded-lg">
                <div className="flex justify-between px-4 py-3 border-b border-gray-300">
                  <span className="font-semibold text-gray-700">SUBTOTAL</span>
                  <span className="font-semibold text-gray-900">
                    ₹ {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3 border-b border-gray-300">
                  <span className="font-semibold text-gray-700">
                    TAX (8.5%)
                  </span>
                  <span className="font-semibold text-gray-900">
                    {tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3 border-b border-gray-300">
                  <span className="font-semibold text-gray-700">SHIPPING</span>
                  <span className="font-semibold text-gray-900">
                    {shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-4 bg-white rounded-b-lg">
                  <span className="text-xl font-bold text-gray-900">TOTAL</span>
                  <span className="text-xl font-bold text-green-600">
                    ₹ {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-700">
                THANK YOU FOR YOUR BUSINESS!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-teal-50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Edit Your Company Details</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Customize the letterhead and contact information that appears in
              your quotation
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Letterhead Information
              </h3>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="companyName"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Company Name
                  </Label>
                  <input
                    id="companyName"
                    type="text"
                    placeholder="e.g., PACKSMART"
                    value={appData.companyDetails.companyName}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          companyName: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-12 px-4 border border-[#E0E0E0] rounded-xl text-base font-semibold focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="companyTagline"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Company Tagline
                  </Label>
                  <input
                    id="companyTagline"
                    type="text"
                    placeholder="e.g., Vision-Calibrated Packaging Intelligence"
                    value={appData.companyDetails.companyTagline}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          companyTagline: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-12 px-4 border border-[#E0E0E0] rounded-xl text-sm focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="contactName"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Contact Name
                  </Label>
                  <input
                    id="contactName"
                    type="text"
                    placeholder="Contact person or department"
                    value={appData.companyDetails.name}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          name: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-12 px-4 border border-[#E0E0E0] rounded-xl text-sm focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Phone Number
                  </Label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+91 XXX XXX XXXX"
                    value={appData.companyDetails.phone}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          phone: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-12 px-4 border border-[#E0E0E0] rounded-xl text-sm focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label
                    htmlFor="address"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Address
                  </Label>
                  <textarea
                    id="address"
                    placeholder="Full company address"
                    value={appData.companyDetails.address}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          address: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    className="w-full min-h-[80px] px-4 py-3 border border-[#E0E0E0] rounded-xl text-sm focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none resize-none transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-gray-700 mb-1 block"
                  >
                    Email Address
                  </Label>
                  <input
                    id="email"
                    type="email"
                    placeholder="contact@yourcompany.com"
                    value={appData.companyDetails.email}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        companyDetails: {
                          ...prev.companyDetails,
                          email: e.target.value,
                        },
                      }))
                    }
                    className="w-full h-12 px-4 border border-[#E0E0E0] rounded-xl text-sm focus:border-[#4A90E2] focus:shadow-[0_0_0_3px_rgba(74,144,226,0.15)] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <Button
            size="lg"
            onClick={handleDownloadPDF}
            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-12 py-6 rounded-xl shadow-xl"
          >
            <Download className="w-5 h-5 mr-2" />
            Download Quotation PDF
          </Button>
          <p className="text-sm text-gray-500">
            Your quotation will be downloaded as a PDF file
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setCurrentPage("bom")}
            className="border-2 border-gray-300 hover:border-gray-400 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOM
          </Button>
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8"
            onClick={() => {
              setAppData(resetData);
              setCurrentPage("landing");
            }}
          >
            Accept Quote & Start New
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("landing");
  const [currentCameraView, setCurrentCameraView] =
    useState<CameraViewType>("top");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [appData, setAppData] = useState<AppData>({
    frontViewImage: null,
    topViewImage: null,
    knownWidth: "",
    annotatedImageUrl: null,
    detectedObject: "Plastic Bottle",
    confidence: 94,
    dimensions: { length: 22.5, width: 7.8, height: 16.4, volume: 2876.4 },
    materials: [
      { name: "Plastic", confidence: 72 },
      { name: "Cardboard", confidence: 28 },
    ],
    materialProperties: { category: "Consumer Goods", fragility: "Moderate" },
    estimatedWeight: 0.38,
    realWeight: "",
    weightUnit: "kg",
    _materialData: null,
    _realDimensions: null,
    packaging: {
      type: "Corrugated Cardboard Box",
      boxDimensions: "28 × 14 × 22 cm",
      cushioning: "Bubble Wrap + Edge Protectors",
    },
    bom: [
      {
        material: "Corrugated Sheet",
        quantity: "0.8",
        unit: "sq.m",
        usage: "Box Material",
      },
      {
        material: "Thermocol Padding",
        quantity: "2",
        unit: "pieces",
        usage: "Cushioning",
      },
      {
        material: "Bubble Wrap",
        quantity: "1.2",
        unit: "meters",
        usage: "Inner Protection",
      },
      {
        material: "Packing Tape",
        quantity: "1",
        unit: "roll",
        usage: "Sealing",
      },
    ],
    bomFull: [
      {
        material: "Corrugated Sheet",
        quantity: 0.8,
        unit: "sq.m",
        description: "Box Material",
        unit_price: 50,
        total_cost: 40,
      },
      {
        material: "Thermocol Padding",
        quantity: 2,
        unit: "pieces",
        description: "Cushioning",
        unit_price: 15,
        total_cost: 30,
      },
      {
        material: "Bubble Wrap",
        quantity: 1.2,
        unit: "meters",
        description: "Inner Protection",
        unit_price: 25,
        total_cost: 30,
      },
      {
        material: "Packing Tape",
        quantity: 1,
        unit: "roll",
        description: "Sealing",
        unit_price: 10,
        total_cost: 10,
      },
    ],
    pricing: { totalCost: 86.0, quotationId: "PKS-2026-001" },
    companyDetails: {
      companyName: "",
      companyTagline: "",
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const openCamera = (viewType: CameraViewType) => {
    setCurrentCameraView(viewType);
    setCapturedImage(null);
    setCurrentPage("camera");
  };

  const handleCapture = () => {};

  const handleUseImage = () => {
    if (capturedImage) {
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${currentCameraView}-view.jpg`, {
            type: "image/jpeg",
          });
          setAppData((prev) => ({
            ...prev,
            [currentCameraView === "front" ? "frontViewImage" : "topViewImage"]:
              {
                url: capturedImage,
                file,
              },
          }));
        });
      setCurrentPage("capture");
    }
  };

  const handleImageUpload = (file: File, type: "front" | "top") => {
    const url = URL.createObjectURL(file);
    setAppData((prev) => ({
      ...prev,
      [type === "front" ? "frontViewImage" : "topViewImage"]: { url, file },
    }));
  };

  const pageProps: PageProps = {
    appData,
    setAppData,
    currentPage,
    setCurrentPage,
    currentCameraView,
    openCamera,
    capturedImage,
    setCapturedImage,
    handleCapture,
    handleUseImage,
    handleImageUpload,
  };

  return (
    <div>
      {currentPage === "landing" && <LandingPage {...pageProps} />}
      {currentPage === "about" && <AboutPage setCurrentPage={setCurrentPage} />}
      {currentPage === "capture" && <CapturePage {...pageProps} />}
      {currentPage === "camera" && <CameraPage {...pageProps} />}
      {currentPage === "detection" && <DetectionPage {...pageProps} />}
      {currentPage === "materials" && <MaterialsPage {...pageProps} />}
      {currentPage === "packaging" && <PackagingPage {...pageProps} />}
      {currentPage === "bom" && <BOMPage {...pageProps} />}
      {currentPage === "pricing" && <PricingPage {...pageProps} />}
    </div>
  );
}
