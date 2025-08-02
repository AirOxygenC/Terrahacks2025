import React, { useState } from 'react';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const ChatBot: React.FC = () => {
  const [userInput, setUserInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newUserMessage: Message = { role: 'user', text: userInput };
    setChatHistory((prev) => [...prev, newUserMessage]);
    setUserInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });

      const data = await response.json();
      const botMessage: Message = { role: 'bot', text: data.reply };
      setChatHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'bot', text: '⚠️ Error: Failed to get response.' },
      ]);
      console.error('Error communicating with backend:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">ChatBot</h1>

      <div className="w-full max-w-xl bg-white rounded shadow p-4 flex flex-col space-y-2 h-[60vh] overflow-y-auto mb-4">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded max-w-[75%] ${
              msg.role === 'user' ? 'bg-blue-200 self-end' : 'bg-green-100 self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="text-gray-400 italic self-start">Bot is typing...</div>
        )}
      </div>

      <div className="w-full max-w-xl flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
