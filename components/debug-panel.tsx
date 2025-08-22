'use client';

import { useState, useEffect } from 'react';
import { X, Bug, Download, Trash2, Play, Pause } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'api' | 'click' | 'navigation' | 'error' | 'info';
  message: string;
  details?: any;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Check if debug mode is enabled
    const debugEnabled = localStorage.getItem('debug') === 'true' || 
                        window.location.search.includes('debug=true');
    
    if (!debugEnabled) return;

    // Override console.log to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalGroup = console.group || console.log;
    const originalGroupEnd = console.groupEnd || (() => {});

    let groupStack: string[] = [];

    console.log = function(...args) {
      originalLog.apply(console, args);
      
      if (!isPaused) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        
        const type = message.includes('API') ? 'api' : 
                     message.includes('Click') || message.includes('🔗') || message.includes('🔘') ? 'click' :
                     message.includes('Page') || message.includes('Navigation') ? 'navigation' : 
                     'info';
        
        addLog(type, message, args);
      }
    };

    console.error = function(...args) {
      originalError.apply(console, args);
      if (!isPaused) {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        addLog('error', message, args);
      }
    };

    if (console.group) {
      console.group = function(...args) {
        originalGroup.apply(console, args);
        groupStack.push(args[0] || 'Group');
      };
    }

    if (console.groupEnd) {
      console.groupEnd = function() {
        originalGroupEnd.apply(console);
        groupStack.pop();
      };
    }

    // Keyboard shortcut to toggle panel
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      if (console.group) console.group = originalGroup;
      if (console.groupEnd) console.groupEnd = originalGroupEnd;
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPaused]);

  const addLog = (type: LogEntry['type'], message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    
    setLogs(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500 logs
  };

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `debug-logs-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'api': return 'text-blue-400';
      case 'click': return 'text-green-400';
      case 'navigation': return 'text-purple-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeEmoji = (type: LogEntry['type']) => {
    switch (type) {
      case 'api': return '🚀';
      case 'click': return '🔗';
      case 'navigation': return '📄';
      case 'error': return '❌';
      default: return '📝';
    }
  };

  // Don't render if debug is not enabled
  const debugEnabled = typeof window !== 'undefined' && 
    (localStorage.getItem('debug') === 'true' || window.location.search.includes('debug=true'));
  
  if (!debugEnabled) return null;

  return (
    <>
      {/* Debug Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Toggle Debug Panel (Ctrl+Shift+D)"
      >
        <Bug className="w-5 h-5" />
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 text-white h-96 flex flex-col shadow-2xl border-t border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bug className="w-5 h-5" />
                Debug Console
              </h3>
              
              {/* Filters */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                <option value="all">All ({logs.length})</option>
                <option value="api">API ({logs.filter(l => l.type === 'api').length})</option>
                <option value="click">Clicks ({logs.filter(l => l.type === 'click').length})</option>
                <option value="navigation">Navigation ({logs.filter(l => l.type === 'navigation').length})</option>
                <option value="error">Errors ({logs.filter(l => l.type === 'error').length})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title={isPaused ? "Resume logging" : "Pause logging"}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              
              <button
                onClick={exportLogs}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Export logs"
              >
                <Download className="w-4 h-4" />
              </button>
              
              <button
                onClick={clearLogs}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
                title="Clear logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                {isPaused ? 'Logging is paused' : 'No logs to display'}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 hover:bg-gray-800 px-2 py-1 rounded"
                  >
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {log.timestamp}
                    </span>
                    <span className={`${getTypeColor(log.type)}`}>
                      {getTypeEmoji(log.type)}
                    </span>
                    <span className="flex-1 break-all">
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="p-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
            <div className="flex justify-between items-center">
              <span>
                {isPaused ? '⏸️ Paused' : '🔴 Recording'} | 
                {filteredLogs.length} logs shown | 
                Press Ctrl+Shift+D to toggle
              </span>
              <span>
                To disable: localStorage.setItem('debug', 'false')
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}