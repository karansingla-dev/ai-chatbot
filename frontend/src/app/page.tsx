import ChatWidget from "@/components/ChatWidget";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <h1 className="text-4xl font-extrabold text-gray-800">
        Welcome to AI-Powered Chatbot
      </h1>
      <p className="mt-2 text-gray-600">Your personal AI customer support assistant</p>
      <ChatWidget />
    </main>
  );
}
