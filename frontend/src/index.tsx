import React, { useState, useRef } from 'react';

interface Message {
  id: number;
  type: 'user' | 'bot';
  content: string;
  image?: string | null;
  timestamp: Date;
}

interface ApiResponse {
  success: boolean;
  response?: string;
  error?: string;
}

const HealthChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I can help provide general health information through text or image analysis. Please remember that this is for informational purposes only and not a substitute for professional medical advice.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMessage = (type: 'user' | 'bot', content: string, image: string | null = null): void => {
    const newMessage: Message = {
      id: Date.now(),
      type,
      content,
      image,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage = inputMessage.trim();
    const imageToSend = selectedImage;
    
    // Add user message
    addMessage('user', userMessage, imageToSend);
    
    // Clear input
    setInputMessage('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      let response: Response;
      
      if (imageToSend) {
        // Send image for analysis
        response = await fetch('http://localhost:5000/api/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: imageToSend,
            message: userMessage
          })
        });
      } else {
        // Send text message
        response = await fetch('http://localhost:5000/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage
          })
        });
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.response) {
        addMessage('bot', data.response);
      } else {
        addMessage('bot', 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('bot', 'Sorry, I cannot connect to the server right now. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setSelectedImage(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const removeSelectedImage = (): void => {
    setSelectedImage(null);
  };

  const triggerFileInput = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">🖼️</span>
          Health Assistant Chatbot
        </h1>
        <p className="text-blue-100 text-sm mt-1">
          Upload images from your computer for health analysis
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <p className="text-sm text-yellow-800">
            <strong>Important:</strong> This tool provides general information only. 
            Always consult healthcare professionals for medical advice and emergencies.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Uploaded"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <p className="text-sm">Analyzing...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        {selectedImage && (
          <div className="mb-3 relative inline-block">
            <img
              src={selectedImage}
              alt="Selected"
              className="w-16 h-16 object-cover rounded border"
            />
            <button
              onClick={removeSelectedImage}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
              type="button"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            ref={fileInputRef}
            className="hidden"
          />
          
          <button
            onClick={triggerFileInput}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Upload image from computer"
            type="button"
          >
            <span className="text-lg">📎</span>
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your health question or upload an image file..."
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="button"
          >
            <span className="text-lg">➤</span>
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Type questions or upload image files from your computer for health guidance
        </p>
      </div>
    </div>
  );
};

export default HealthChatbot;