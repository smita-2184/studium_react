import Image from "next/image"
import {
  Plus,
  GraduationCap,
  ChevronDown,
  PanelLeftOpen,
  Search,
  Sun,
  RotateCcw,
  Download,
  Printer,
  Maximize,
  ChevronLeft,
  MessageCircle,
  Copy,
  ClipboardCheck,
  AlignLeft,
  Bot,
  HelpCircle,
  Share2,
  Mic,
  TrendingUp,
  Sparkles,
  AtSign,
  Camera,
  Voicemail,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function YouLearnLayout() {
  return (
    <div className="flex flex-col h-screen">
      {/* Global Header */}
      <header className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900 sticky top-0 z-10">
        <div className="w-72">
          {" "}
          {/* Spacer to align with left sidebar */}
          {/* Intentionally empty or could place a global logo if different from sidebar */}
        </div>
        <div className="flex-1 text-center text-sm text-zinc-400">Comparative Politics Today: A World View 11/E</div>
        <div className="flex items-center space-x-3 w-72 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-100"
              >
                <Globe className="w-4 h-4" />
                <span>US GB</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-zinc-50">
              <DropdownMenuItem className="hover:bg-zinc-700">US English</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-zinc-700">UK English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" className="bg-white text-zinc-900 hover:bg-zinc-200 h-9">
            Sign in
          </Button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-72 p-5 bg-zinc-900 border-r border-zinc-800 flex flex-col space-y-6">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-semibold text-white">YouLearn</h1>
          </div>
          <Button className="w-full justify-start text-left bg-zinc-800 hover:bg-zinc-700 text-white h-10">
            <Plus className="w-4 h-4 mr-2" />
            Add content
          </Button>
          <div className="flex-1 space-y-3 text-zinc-400 text-sm">
            <h2 className="font-semibold text-white text-base">Welcome to YouLearn</h2>
            <p>An AI tutor personalized to you.</p>
            <p>
              Understand your files, YouTube video, website links or recorded lecture through key concepts, familiar
              learning tools like flashcards, and interactive conversations.
            </p>
            <p>
              We&apos;re constantly improving the platform, and if you have any feedback, we&apos;d love to hear from
              you.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 text-center">Sign in to continue</p>
            <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-200 h-10">Sign in</Button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden bg-zinc-850">
          {" "}
          {/* Slightly different shade for main area */}
          <div className="p-3 border-b border-zinc-700 flex items-center space-x-2 bg-zinc-900">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <PanelLeftOpen className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Sun className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-1 text-zinc-400">
              <Input
                type="number"
                defaultValue={1}
                className="w-12 h-8 text-center bg-zinc-800 border-zinc-700 text-zinc-50"
              />
              <span>/</span>
              <span>77</span>
            </div>
            <Select defaultValue="page-fit">
              <SelectTrigger className="w-[120px] h-8 bg-zinc-800 border-zinc-700 text-zinc-50">
                <SelectValue placeholder="Page fit" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
                <SelectItem value="page-fit" className="hover:!bg-zinc-700">
                  Page fit
                </SelectItem>
                <SelectItem value="page-width" className="hover:!bg-zinc-700">
                  Page width
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1" /> {/* Spacer */}
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <RotateCcw className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Download className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Printer className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-auto flex justify-center items-start bg-zinc-800">
            <Image
              src="/comparative-politics-book-cover.png"
              alt="Book Cover: Comparative Politics Today"
              width={800}
              height={1000} // Approximate aspect ratio
              className="object-contain shadow-2xl"
            />
          </div>
        </section>

        {/* Right Sidebar (Chat Panel) */}
        <aside className="w-[400px] bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-3 border-b border-zinc-800 flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" className="bg-zinc-800 text-white hover:bg-zinc-700 h-9 px-3">
              <MessageCircle className="w-4 h-4 mr-2" /> Chat
            </Button>
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3">
              <Copy className="w-4 h-4 mr-2" /> Flashcards
            </Button>
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3">
              <ClipboardCheck className="w-4 h-4 mr-2" /> Quizzes
            </Button>
            <Button variant="ghost" className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 h-9 px-3">
              <AlignLeft className="w-4 h-4 mr-2" /> Summary
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-zinc-400">
            <Bot className="w-16 h-16 text-zinc-500" />
            <p className="text-lg font-medium text-zinc-300">Learn with the AI Tutor</p>
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
              {[
                { icon: HelpCircle, label: "Quiz" },
                { icon: Share2, label: "Mind Map" },
                { icon: Mic, label: "Voice Mode" },
                { icon: Copy, label: "Flashcards" },
                { icon: Search, label: "Search" },
                { icon: TrendingUp, label: "Timeline" },
              ].map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="flex-col h-auto py-2 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-zinc-800 space-y-3">
            <div className="relative">
              <Textarea
                placeholder="Ask anything"
                className="bg-zinc-800 border-zinc-700 text-zinc-50 resize-none pr-28 min-h-[50px] pt-[14px]"
                rows={1}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 w-7 h-7">
                  <Camera className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100 w-7 h-7">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
              >
                <Sparkles className="w-4 h-4 mr-1 text-green-400" /> Learn+
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
              >
                <Search className="w-4 h-4 mr-1" /> Search
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 w-8 h-8"
              >
                <AtSign className="w-4 h-4" />
              </Button>
              <div className="flex-1" />
              <Button className="bg-white text-zinc-900 hover:bg-zinc-200 h-9">
                <Voicemail className="w-4 h-4 mr-2" /> Voice
              </Button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
