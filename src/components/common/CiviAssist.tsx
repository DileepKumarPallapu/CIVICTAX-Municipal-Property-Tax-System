import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Building2,
  Receipt,
  CreditCard,
  AlertTriangle,
  RotateCcw,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storageService';
import { formatCurrency } from '../../utils';

interface ChatMessage {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  actionButton?: {
    label: string;
    path: string;
  };
  timestamp: string;
}

export const CiviAssist: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcoming message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg-init',
          sender: 'assistant',
          text: `Namaste ${
            currentUser?.name ? currentUser.name.split(' ')[0] : 'Citizen'
          }! I am CiviAssist, your municipal automated guidance assistant. How can I help you today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Suggested quick prompts
  const quickPrompts = [
    'How much tax do I owe?',
    'How do I register a property?',
    'Where can I download my receipt?',
    'How is property tax calculated?',
    'How do I submit a grievance?',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputQuery('');

    // Rule-Based Knowledge Engine
    setTimeout(() => {
      const response = processRuleQuery(query.toLowerCase(), currentUser);
      setMessages((prev) => [...prev, response]);
    }, 300);
  };

  const processRuleQuery = (q: string, user: any): ChatMessage => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const id = `asst-${Date.now()}`;

    // 1. Tax Dues / Owed Query
    if (q.includes('tax') && (q.includes('owe') || q.includes('due') || q.includes('pending') || q.includes('balance'))) {
      if (!user) {
        return {
          id,
          sender: 'assistant',
          text: 'Please sign in to check your personalized outstanding property tax balance.',
          actionButton: { label: 'Go to Sign In', path: '/login' },
          timestamp,
        };
      }
      const assessments = StorageService.getAssessments().filter((a) => a.ownerId === user.id);
      const totalDue = assessments.reduce((acc, curr) => acc + curr.outstandingBalance, 0);

      if (totalDue === 0) {
        return {
          id,
          sender: 'assistant',
          text: `Great news, ${user.name}! You currently have ₹0 in outstanding municipal property tax dues across all registered properties.`,
          actionButton: { label: 'View Assessments', path: '/citizen/assessments' },
          timestamp,
        };
      }

      return {
        id,
        sender: 'assistant',
        text: `According to active municipal records, your total outstanding property tax is ${formatCurrency(
          totalDue
        )}. You can pay online via UPI, Cards, or Net Banking to receive an instant tax receipt.`,
        actionButton: { label: 'Pay Outstanding Tax', path: '/citizen/payments' },
        timestamp,
      };
    }

    // 2. Register Property Query
    if (q.includes('register') || (q.includes('add') && q.includes('property'))) {
      return {
        id,
        sender: 'assistant',
        text: 'To register a property: Go to "Register Property", specify your municipal ward/zone, enter your built-up square footage, and input your registered title deed reference. An inspector will verify it within 3-5 days.',
        actionButton: { label: 'Open Registration Form', path: '/citizen/register-property' },
        timestamp,
      };
    }

    // 3. Receipt / Download Query
    if (q.includes('receipt') || q.includes('download') || q.includes('challan')) {
      return {
        id,
        sender: 'assistant',
        text: 'All successful payments automatically generate an authorized municipal e-challan receipt. You can view, print, or download official PDF tax receipts from the Payment Portal.',
        actionButton: { label: 'Open Payment Receipts', path: '/citizen/payments' },
        timestamp,
      };
    }

    // 4. Tax Calculation Query
    if (q.includes('calculate') || q.includes('formula') || q.includes('rate')) {
      return {
        id,
        sender: 'assistant',
        text: 'Tax Formula: Base Tax = Built-up Area (sq ft) × Gazette Rate (Residential: ₹10, Commercial: ₹18, Industrial: ₹15). Total Tax = Base Tax + Penalties - Early Rebates. Historical applied rates remain locked permanently.',
        actionButton: { label: 'View Tax Rates', path: '/services' },
        timestamp,
      };
    }

    // 5. Grievance / Complaint Query
    if (q.includes('grievance') || q.includes('complaint') || q.includes('dispute') || q.includes('issue')) {
      return {
        id,
        sender: 'assistant',
        text: 'You can lodge a municipal grievance regarding incorrect calculations, property title details, or billing discrepancies. Grievances follow a transparent 5-stage resolution process.',
        actionButton: { label: 'Lodge Grievance', path: '/citizen/grievances' },
        timestamp,
      };
    }

    // 6. Reassessment Query
    if (q.includes('reassessment') || q.includes('revaluation') || q.includes('measurement')) {
      return {
        id,
        sender: 'assistant',
        text: 'If your property structure or measured built-up square footage has changed, submit a Reassessment Request with supporting floor plan references for revenue officer audit.',
        actionButton: { label: 'Request Reassessment', path: '/citizen/reassessments' },
        timestamp,
      };
    }

    // 7. Verification Query
    if (q.includes('verification') || q.includes('status') || q.includes('pending')) {
      return {
        id,
        sender: 'assistant',
        text: 'After submission, properties are assigned to the zone revenue officer who conducts physical/deed audits. You can view real-time verification status on the My Properties dashboard.',
        actionButton: { label: 'Check Properties', path: '/citizen/properties' },
        timestamp,
      };
    }

    // Default Fallback
    return {
      id,
      sender: 'assistant',
      text: 'I can assist you with property registration, tax calculations, online payments, receipts, grievances, and reassessments. Try asking one of the suggested prompts below!',
      timestamp,
    };
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#101D32] hover:bg-slate-900 text-white shadow-2xl border border-[#19283D] transition-transform hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Open CiviAssist Municipal Guidance"
        >
          <div className="w-7 h-7 rounded-full bg-[#405CF5] flex items-center justify-center font-bold text-xs shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xs pr-1">CiviAssist AI</span>
        </button>
      </div>

      {/* Assistant Modal Window */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[540px] bg-white dark:bg-[#101D32] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#101D32] text-white flex items-center justify-between border-b border-[#19283D]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#405CF5] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-bold leading-tight">CiviAssist Assistant</h3>
                <p className="text-[10px] text-teal-400 font-medium">Local Rule-Based Municipal Guidance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50 dark:bg-[#0A1220]/50 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#405CF5] text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#19283D] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-xs rounded-bl-xs'
                  }`}
                >
                  <p>{m.text}</p>

                  {m.actionButton && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        navigate(m.actionButton!.path);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#405CF5] hover:bg-[#324BD9] text-white font-bold text-[11px] transition cursor-pointer shadow-xs"
                    >
                      <span>{m.actionButton.label}</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#101D32] overflow-x-auto flex gap-1.5 no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold whitespace-nowrap transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-[#101D32] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about taxes, payments, or registrations..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#19283D] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#405CF5]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 rounded-xl bg-[#405CF5] hover:bg-[#324BD9] text-white transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
