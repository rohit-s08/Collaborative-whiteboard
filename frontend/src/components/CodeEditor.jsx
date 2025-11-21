import React, { useState, useEffect } from 'react';
import AceEditor from 'react-ace';
import { Form, Button, Spinner } from 'react-bootstrap'; // Import Spinner
import axios from 'axios';

// Import Themes and Modes
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools'; // <-- THIS ENABLES AUTOCOMPLETION

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-c_cpp';

const CodeEditor = ({ socket, roomId }) => {
  const [code, setCode] = useState("// Start coding here...");
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState(''); // State for the output console
  const [isRunning, setIsRunning] = useState(false); // Loading state

  useEffect(() => {
    if (!socket) return;

    socket.on('code-change', (newCode) => setCode(newCode));
    socket.on('language-change', (newLanguage) => setLanguage(newLanguage));

    return () => {
      socket.off('code-change');
      socket.off('language-change');
    };
  }, [socket]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) socket.emit('code-change', { code: newCode, roomId });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    if (socket) socket.emit('language-change', { language: newLanguage, roomId });
  };

  // --- NEW: FUNCTION TO RUN CODE ---
  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      // Send code to our backend, which will forward it to Piston
      const res = await axios.post('http://localhost:5000/api/code/run', {
        code,
        language
      });
      setOutput(res.data.output);
    } catch (error) {
      setOutput(error.response?.data?.output || "Error connecting to server");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="d-flex flex-column h-100">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-2 p-1" style={{backgroundColor: '#333', borderRadius: '5px'}}>
        <Form.Select 
          size="sm" 
          value={language} 
          onChange={handleLanguageChange}
          style={{ width: '150px', backgroundColor: '#444', color: 'white', border: 'none' }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="c_cpp">C++</option>
        </Form.Select>

        <Button 
          variant="success" 
          size="sm" 
          onClick={runCode} 
          disabled={isRunning}
        >
          {isRunning ? <Spinner size="sm" animation="border" /> : "▶ Run Code"}
        </Button>
      </div>

      {/* Editor Area */}
      <div className="flex-grow-1" style={{ position: 'relative' }}>
        <AceEditor
          mode={language}
          theme="monokai"
          onChange={handleCodeChange}
          name="collaborative-editor"
          editorProps={{ $blockScrolling: true }}
          value={code}
          fontSize={14}
          showPrintMargin={false}
          showGutter={true}
          highlightActiveLine={true}
          width="100%"
          height="100%" // Takes up remaining height
          setOptions={{
            enableBasicAutocompletion: true, // <-- THESE ENABLE SUGGESTIONS
            enableLiveAutocompletion: true,  // <-- THESE ENABLE SUGGESTIONS
            enableSnippets: true,
            showLineNumbers: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Output Console Area */}
      <div className="mt-2 p-2" style={{ 
        height: '150px', 
        backgroundColor: '#1e1e1e', 
        color: '#0f0', // Hacker green text
        fontFamily: 'monospace',
        overflowY: 'auto',
        borderTop: '1px solid #444',
        fontSize: '0.9rem'
      }}>
        <strong>Output:</strong>
        <pre style={{ margin: 0 }}>{output}</pre>
      </div>
    </div>
  );
};

export default CodeEditor;